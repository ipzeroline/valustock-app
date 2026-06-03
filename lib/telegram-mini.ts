import crypto from "crypto";
import { query } from "@/lib/db";
import { getTelegramBotUsername } from "@/lib/telegram-connection";

type TelegramMiniUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramMiniMember = {
  email: string;
  chatId: string;
  telegramUser: TelegramMiniUser;
};

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

export function validateTelegramInitData(initData: string, maxAgeSeconds = 60 * 60 * 24) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key !== "hash") pairs.push(`${key}=${value}`);
  });
  pairs.sort();

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(getBotToken())
    .digest();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(pairs.join("\n"))
    .digest("hex");

  const safeHash = Buffer.from(hash, "hex");
  const safeExpected = Buffer.from(expected, "hex");
  if (safeHash.length !== safeExpected.length || !crypto.timingSafeEqual(safeHash, safeExpected)) {
    return null;
  }

  const rawUser = params.get("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as TelegramMiniUser;
  } catch {
    return null;
  }
}

export async function getTelegramMiniMember(initData: unknown): Promise<TelegramMiniMember | null> {
  if (typeof initData !== "string" || !initData.trim()) return null;

  const telegramUser = validateTelegramInitData(initData);
  if (!telegramUser?.id) return null;

  const chatId = String(telegramUser.id);
  const username = telegramUser.username?.trim();
  const usernameWithAt = username ? `@${username}` : "";
  const rows = await query<{ user_email: string; telegram_chat_id: string }[]>(
    `SELECT user_email, telegram_chat_id
     FROM telegram_connections
     WHERE status = 'connected'
       AND (
         telegram_chat_id = ?
         OR telegram_username = ?
         OR telegram_username = ?
       )
     LIMIT 1`,
    [chatId, username || "", usernameWithAt]
  );

  const connection = rows[0];
  if (!connection?.user_email || !connection.telegram_chat_id) return null;
  return {
    email: connection.user_email.trim().toLowerCase(),
    chatId: String(connection.telegram_chat_id),
    telegramUser,
  };
}

export function getTelegramMiniAppUrl(path = "/telegram") {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
  return `${siteUrl}${path}`;
}

export function getTelegramMiniBotUsername() {
  return getTelegramBotUsername();
}
