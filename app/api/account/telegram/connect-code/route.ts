import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { requireMember } from "@/lib/member-auth";
import {
  createTelegramConnectCode,
  getTelegramBotUsername,
  hashTelegramConnectCode,
} from "@/lib/telegram-connection";

export async function POST(req: Request) {
  const { error, member } = await requireMember(req);
  if (error) return error;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code },
      { status: 503 }
    );
  }
  await initDatabase();

  const botUsername = getTelegramBotUsername();
  if (!botUsername) {
    return NextResponse.json(
      { error: "Telegram bot username is not configured", requiredEnv: ["NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"] },
      { status: 503 }
    );
  }

  const code = createTelegramConnectCode();
  const codeHash = hashTelegramConnectCode(code);

  await query(
    `INSERT INTO telegram_connections (user_email, status, connect_code_hash, connect_code_expires_at, notifications_enabled)
     VALUES (?, 'pending', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE), TRUE)
     ON DUPLICATE KEY UPDATE
       status = IF(status = 'connected', 'connected', 'pending'),
       connect_code_hash = VALUES(connect_code_hash),
       connect_code_expires_at = VALUES(connect_code_expires_at),
       notifications_enabled = TRUE`,
    [member.email, codeHash]
  );

  const command = `/start ${code}`;
  return NextResponse.json({
    success: true,
    code,
    command,
    botUsername,
    deepLink: `https://t.me/${botUsername}?start=${encodeURIComponent(code)}`,
    expiresInSeconds: 600,
  });
}
