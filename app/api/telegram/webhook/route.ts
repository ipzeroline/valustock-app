import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { hashTelegramConnectCode } from "@/lib/telegram-connection";
import { sendTelegramMessage } from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string; type?: string };
    from?: { username?: string; first_name?: string; last_name?: string };
  };
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

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Invalid Telegram webhook secret" }, { status: 401 });
  }

  const update = (await req.json().catch(() => ({}))) as TelegramUpdate;
  const chatId = update.message?.chat?.id;
  const code = extractStartCode(update.message?.text);

  if (!chatId || !code) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json({ error: "Database is not connected" }, { status: 503 });
  }
  await initDatabase();

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
      chatId: String(chatId),
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
    [String(chatId), displayTelegramName(update), match.user_email]
  );

  await sendTelegramMessage({
    chatId: String(chatId),
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
  }).catch(() => {
    /* keep connection even if confirmation reply fails */
  });

  return NextResponse.json({ ok: true, matched: true });
}
