import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { requireMember } from "@/lib/member-auth";
import { getTelegramBotUsername, maskTelegramChatId } from "@/lib/telegram-connection";
import { sendTelegramMessage } from "@/lib/telegram";
import { buildWatchlistTelegramSummaryMessages, getDefaultWatchlistSymbols } from "@/lib/telegram-digest";

type TelegramConnectionRow = {
  telegram_chat_id: string | null;
  telegram_username: string | null;
  status: string | null;
  notifications_enabled: number | boolean | null;
  watchlist_digest_enabled: number | boolean | null;
  watchlist_digest_frequency: string | null;
  connected_at: string | null;
  last_test_at: string | null;
};

async function ensureReady() {
  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code },
      { status: 503 }
    );
  }
  await initDatabase();
  return null;
}

async function getConnection(email: string) {
  const rows = await query<TelegramConnectionRow[]>(
    `SELECT telegram_chat_id, telegram_username, status, notifications_enabled, watchlist_digest_enabled, watchlist_digest_frequency, connected_at, last_test_at
     FROM telegram_connections
     WHERE user_email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

function serializeConnection(row: TelegramConnectionRow | null) {
  const connected = row?.status === "connected" && Boolean(row.telegram_chat_id);
  return {
    connected,
    status: row?.status || "not_connected",
    telegramUsername: row?.telegram_username || null,
    chatIdMask: row?.telegram_chat_id ? maskTelegramChatId(String(row.telegram_chat_id)) : null,
    notificationsEnabled: row?.notifications_enabled !== false && row?.notifications_enabled !== 0,
    watchlistDigestEnabled: row?.watchlist_digest_enabled !== false && row?.watchlist_digest_enabled !== 0,
    watchlistDigestFrequency: row?.watchlist_digest_frequency || "daily",
    connectedAt: row?.connected_at || null,
    lastTestAt: row?.last_test_at || null,
    botUsername: getTelegramBotUsername() || null,
  };
}

export async function GET(req: Request) {
  const { error, member } = await requireMember(req);
  if (error) return error;

  const readyError = await ensureReady();
  if (readyError) return readyError;

  const row = await getConnection(member.email);
  return NextResponse.json({ telegram: serializeConnection(row) });
}

export async function POST(req: Request) {
  const { error, member } = await requireMember(req);
  if (error) return error;

  const readyError = await ensureReady();
  if (readyError) return readyError;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "test");

  if (!["test", "watchlist_summary", "update_preferences"].includes(action)) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  if (action === "update_preferences") {
    const watchlistDigestEnabled = body.watchlistDigestEnabled === false ? 0 : 1;
    const frequency = body.watchlistDigestFrequency === "weekly" ? "weekly" : "daily";
    await query(
      `INSERT INTO telegram_connections (user_email, status, watchlist_digest_enabled, watchlist_digest_frequency)
       VALUES (?, 'pending', ?, ?)
       ON DUPLICATE KEY UPDATE
         watchlist_digest_enabled = VALUES(watchlist_digest_enabled),
         watchlist_digest_frequency = VALUES(watchlist_digest_frequency)`,
      [member.email, watchlistDigestEnabled, frequency]
    );
    const next = await getConnection(member.email);
    return NextResponse.json({ success: true, telegram: serializeConnection(next) });
  }

  const plan = await getPlanForEmail(member.email);
  if (!plan.limits.alerts) {
    return NextResponse.json({ error: "Telegram alerts require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
  }

  const row = await getConnection(member.email);
  if (!row?.telegram_chat_id || row.status !== "connected") {
    return NextResponse.json({ error: "Telegram is not connected" }, { status: 409 });
  }

  let messages = [[
    "<b>ValuStock Telegram Alerts</b>",
    "",
    "ทดสอบการแจ้งเตือนสำเร็จ",
    `บัญชี: <b>${member.email}</b>`,
    "",
    "ต่อจากนี้ Alert Center สามารถส่งสัญญาณราคาและ Margin of Safety มาที่ Telegram นี้ได้",
    "ข้อความจาก ValuStock ใช้เพื่อการติดตามและวิเคราะห์เท่านั้น ไม่ใช่คำแนะนำซื้อขายหลักทรัพย์",
  ].join("\n")];

  if (action === "watchlist_summary") {
    const watchlistRows = await query<{ symbol: string }[]>(
      "SELECT symbol FROM watchlists WHERE user_email = ? ORDER BY created_at ASC",
      [member.email]
    );
    const symbols = getDefaultWatchlistSymbols(watchlistRows.map((row) => row.symbol));
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
    messages = buildWatchlistTelegramSummaryMessages({ email: member.email, symbols, siteUrl });
  }

  try {
    for (const text of messages) {
      await sendTelegramMessage({ chatId: row.telegram_chat_id, text });
    }
    await query(
      "UPDATE telegram_connections SET last_test_at = CURRENT_TIMESTAMP WHERE user_email = ?",
      [member.email]
    );
    return NextResponse.json({ success: true, messagesSent: messages.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Telegram test failed" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const { error, member } = await requireMember(req);
  if (error) return error;

  const readyError = await ensureReady();
  if (readyError) return readyError;

  await query(
    `UPDATE telegram_connections
     SET telegram_chat_id = NULL,
         telegram_username = NULL,
         status = 'disconnected',
         connect_code_hash = NULL,
         connect_code_expires_at = NULL,
         notifications_enabled = FALSE
     WHERE user_email = ?`,
    [member.email]
  );

  return NextResponse.json({ success: true });
}
