import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { hashTelegramConnectCode } from "@/lib/telegram-connection";
import { answerTelegramCallbackQuery, sendTelegramMessage } from "@/lib/telegram";
import {
  buildCompareTelegramSummaryMessage,
  buildPortfolioTelegramSummaryMessage,
  buildWatchlistTelegramSummaryMessages,
} from "@/lib/telegram-digest";
import { getStock } from "@/lib/stocks";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string; type?: string };
    from?: { username?: string; first_name?: string; last_name?: string };
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: {
      chat?: { id?: number | string; type?: string };
    };
    from?: { id?: number | string; username?: string; first_name?: string; last_name?: string };
  };
};

type TelegramConnection = {
  user_email: string;
  telegram_chat_id: string;
  status: string;
};

type TransactionRow = {
  symbol: string;
  action: "BUY" | "SELL";
  price: string | number;
  shares: string | number;
  fee: string | number | null;
};

type CompareSetRow = {
  id: string;
  name: string;
  symbols: string;
  chartMetric: string | null;
};

function verifyWebhookSecret(req: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === expected;
}

function extractStartCode(text: string | undefined) {
  const match = (text || "").trim().match(/^\/start(?:@\w+)?\s+([A-Z0-9-]{5,24})$/i);
  return match?.[1]?.trim().toUpperCase() || "";
}

function displayTelegramName(update: TelegramUpdate) {
  const from = update.message?.from;
  if (!from) return "";
  if (from.username) return `@${from.username}`;
  return [from.first_name, from.last_name].filter(Boolean).join(" ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 Portfolio", callback_data: "vs:portfolio" },
        { text: "⭐ Watchlist", callback_data: "vs:watchlist" },
      ],
      [
        { text: "🔍 Compare Sets", callback_data: "vs:compare" },
        { text: "🌐 Mini App", web_app: { url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "")}/telegram` } },
      ],
    ],
  };
}

async function findConnectionByChat(chatId: string) {
  const rows = await query<TelegramConnection[]>(
    `SELECT user_email, telegram_chat_id, status
     FROM telegram_connections
     WHERE telegram_chat_id = ? AND status = 'connected'
     LIMIT 1`,
    [chatId]
  );
  return rows[0] || null;
}

function parseSymbols(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((symbol): symbol is string => typeof symbol === "string").map((symbol) => symbol.toUpperCase()).slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

async function sendBotMenu(chatId: string, email?: string) {
  await sendTelegramMessage({
    chatId,
    text: [
      "<b>ValuStock Bot Menu</b>",
      "",
      email ? `บัญชี: <b>${escapeHtml(email)}</b>` : "เลือกเมนูที่ต้องการ",
      "",
      "กดปุ่มด้านล่างเพื่อให้ bot reply ข้อมูลกลับใน Telegram ได้ทันที",
    ].join("\n"),
    replyMarkup: mainMenuKeyboard(),
  });
}

async function sendPortfolio(chatId: string, email: string) {
  const rows = await query<TransactionRow[]>(
    "SELECT symbol, action, price, shares, fee FROM portfolio_transactions WHERE user_email = ? ORDER BY trade_date DESC, created_at DESC",
    [email]
  );
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
  await sendTelegramMessage({
    chatId,
    text: buildPortfolioTelegramSummaryMessage({ email, transactions: rows, siteUrl }),
    replyMarkup: mainMenuKeyboard(),
  });
}

async function sendWatchlist(chatId: string, email: string) {
  const rows = await query<{ symbol: string }[]>(
    "SELECT symbol FROM watchlists WHERE user_email = ? ORDER BY created_at ASC",
    [email]
  );
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
  const messages = buildWatchlistTelegramSummaryMessages({ email, symbols: rows.map((row) => row.symbol), siteUrl });
  for (let i = 0; i < messages.length; i += 1) {
    await sendTelegramMessage({
      chatId,
      text: messages[i],
      ...(i === messages.length - 1 ? { replyMarkup: mainMenuKeyboard() } : {}),
    });
  }
}

async function sendCompareList(chatId: string, email: string) {
  const rows = await query<CompareSetRow[]>(
    `SELECT id, name, symbols, chart_metric AS chartMetric
     FROM comparison_sets
     WHERE user_email = ?
     ORDER BY updated_at DESC
     LIMIT 8`,
    [email]
  );

  if (rows.length === 0) {
    await sendTelegramMessage({
      chatId,
      text: [
        "<b>ValuStock Compare Sets</b>",
        "",
        "ยังไม่มีชุดเปรียบเทียบที่บันทึกไว้",
        `${(process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "")}/compare`,
      ].join("\n"),
      replyMarkup: mainMenuKeyboard(),
    });
    return;
  }

  const lines = rows.map((row, index) => {
    const symbols = parseSymbols(row.symbols);
    return `<b>${index + 1}. ${escapeHtml(row.name)}</b>\n${symbols.join(" / ")}`;
  });

  await sendTelegramMessage({
    chatId,
    text: [
      "<b>ValuStock Compare Sets</b>",
      "",
      "เลือกชุดด้านล่างเพื่อให้ bot ส่ง Compare Alert กลับใน Telegram",
      "",
      ...lines,
    ].join("\n\n"),
    replyMarkup: {
      inline_keyboard: [
        ...rows.map((row, index) => ([{
          text: `🔍 ${index + 1}. ${row.name.slice(0, 28)}`,
          callback_data: `vs:cmp:${row.id}`,
        }])),
        [{ text: "⬅️ เมนูหลัก", callback_data: "vs:menu" }],
      ],
    },
  });
}

async function sendCompareSet(chatId: string, email: string, setId: string) {
  const rows = await query<CompareSetRow[]>(
    `SELECT id, name, symbols, chart_metric AS chartMetric
     FROM comparison_sets
     WHERE user_email = ? AND id = ?
     LIMIT 1`,
    [email, setId]
  );
  const savedSet = rows[0];
  if (!savedSet) {
    await sendTelegramMessage({ chatId, text: "ไม่พบ Compare Set นี้", replyMarkup: mainMenuKeyboard() });
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
  await sendTelegramMessage({
    chatId,
    text: buildCompareTelegramSummaryMessage({
      email,
      name: savedSet.name,
      symbols: parseSymbols(savedSet.symbols),
      chartMetric: savedSet.chartMetric || "mos",
      siteUrl,
    }),
    replyMarkup: mainMenuKeyboard(),
  });
}

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Invalid Telegram webhook secret" }, { status: 401 });
  }

  const update = (await req.json().catch(() => ({}))) as TelegramUpdate;
  const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id || update.callback_query?.from?.id;
  const chatIdString = chatId ? String(chatId) : "";
  const callbackData = update.callback_query?.data || "";
  const commandText = (update.message?.text || "").trim().toLowerCase();
  const code = extractStartCode(update.message?.text);

  if (!chatIdString) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json({ error: "Database is not connected" }, { status: 503 });
  }
  await initDatabase();

  if (callbackData) {
    if (update.callback_query?.id) {
      await answerTelegramCallbackQuery(update.callback_query.id).catch(() => undefined);
    }
    const connection = await findConnectionByChat(chatIdString);
    if (!connection) {
      await sendTelegramMessage({
        chatId: chatIdString,
        text: [
          "<b>ValuStock Telegram</b>",
          "",
          "ยังไม่พบการเชื่อมบัญชีสมาชิก",
          "กรุณาเชื่อม Telegram จากหน้า Account ก่อนใช้งานเมนูนี้",
        ].join("\n"),
      }).catch(() => undefined);
      return NextResponse.json({ ok: true, connected: false });
    }

    if (callbackData === "vs:menu") await sendBotMenu(chatIdString, connection.user_email);
    else if (callbackData === "vs:portfolio") await sendPortfolio(chatIdString, connection.user_email);
    else if (callbackData === "vs:watchlist") await sendWatchlist(chatIdString, connection.user_email);
    else if (callbackData === "vs:compare") await sendCompareList(chatIdString, connection.user_email);
    else if (callbackData.startsWith("vs:cmp:")) await sendCompareSet(chatIdString, connection.user_email, callbackData.slice("vs:cmp:".length));
    else await sendBotMenu(chatIdString, connection.user_email);

    return NextResponse.json({ ok: true, callback: true });
  }

  if (!code && ["/menu", "menu", "/start", "/portfolio", "portfolio", "/watchlist", "watchlist", "/compare", "compare"].includes(commandText)) {
    const connection = await findConnectionByChat(chatIdString);
    if (!connection) {
      await sendTelegramMessage({
        chatId: chatIdString,
        text: [
          "<b>ValuStock Telegram</b>",
          "",
          "ยังไม่พบการเชื่อมบัญชีสมาชิก",
          "กรุณาไปที่หน้า Account ของ ValuStock แล้วกดเชื่อมต่อ Telegram ก่อน",
          "",
          "หลังเชื่อมแล้วพิมพ์ /menu เพื่อใช้งานปุ่ม Portfolio, Watchlist และ Compare",
        ].join("\n"),
      }).catch(() => undefined);
      return NextResponse.json({ ok: true, connected: false });
    }

    if (commandText === "/portfolio" || commandText === "portfolio") await sendPortfolio(chatIdString, connection.user_email);
    else if (commandText === "/watchlist" || commandText === "watchlist") await sendWatchlist(chatIdString, connection.user_email);
    else if (commandText === "/compare" || commandText === "compare") await sendCompareList(chatIdString, connection.user_email);
    else await sendBotMenu(chatIdString, connection.user_email);

    return NextResponse.json({ ok: true, command: true });
  }

  if (!code) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const codeHash = hashTelegramConnectCode(code);
  const rows = await query<{ user_email: string }[]>(
    `SELECT user_email
     FROM telegram_connections
     WHERE connect_code_hash = ?
       AND connect_code_expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [codeHash]
  );
  const match = rows[0];

  if (!match) {
    await sendTelegramMessage({
      chatId: chatIdString,
      text: [
        "<b>ValuStock Telegram Alerts</b>",
        "",
        "ไม่สามารถเชื่อมต่อบัญชีได้",
        "โค้ดนี้หมดอายุหรือไม่ถูกต้อง",
        "",
        "กรุณากลับไปที่หน้า Account ของ ValuStock แล้วกดสร้างโค้ดใหม่",
      ].join("\n"),
    }).catch(() => {
      /* Telegram already reached us; do not fail webhook delivery for a reply error. */
    });
    return NextResponse.json({ ok: true, matched: false });
  }

  await query(
    `UPDATE telegram_connections
     SET telegram_chat_id = ?,
         telegram_username = ?,
         status = 'connected',
         connect_code_hash = NULL,
         connect_code_expires_at = NULL,
         notifications_enabled = TRUE,
         connected_at = CURRENT_TIMESTAMP
     WHERE user_email = ?`,
    [chatIdString, displayTelegramName(update), match.user_email]
  );

  await sendTelegramMessage({
    chatId: chatIdString,
    text: [
      "<b>ValuStock Telegram Alerts</b>",
      "",
      "เชื่อมต่อ Telegram สำเร็จ",
      `บัญชี: <b>${match.user_email}</b>`,
      "",
      "คุณสามารถกลับไปที่หน้า Account แล้วกดรีเฟรชเพื่อตรวจสอบสถานะ",
      "เมื่อเปิดใช้งาน Alert Center ระบบจะส่งแจ้งเตือนราคาและ Margin of Safety มาที่ Telegram นี้",
      "",
      "หากต้องการหยุดรับแจ้งเตือน สามารถยกเลิกการเชื่อมต่อได้จากหน้า Account",
    ].join("\n"),
    replyMarkup: mainMenuKeyboard(),
  }).catch(() => {
    /* keep connection even if confirmation reply fails */
  });

  return NextResponse.json({ ok: true, matched: true });
}
