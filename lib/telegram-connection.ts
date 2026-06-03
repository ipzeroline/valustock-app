import crypto from "crypto";

function getConnectionSecret() {
  return process.env.TELEGRAM_CONNECT_SECRET || process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET || "valustock-dev-telegram-connect";
}

export function createTelegramConnectCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VS-";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return code;
}

export function hashTelegramConnectCode(code: string) {
  return crypto
    .createHmac("sha256", getConnectionSecret())
    .update(code.trim().toUpperCase())
    .digest("hex");
}

export function getTelegramBotUsername() {
  return (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
}

export function maskTelegramChatId(chatId: string) {
  if (chatId.length <= 6) return chatId;
  return `${chatId.slice(0, 3)}...${chatId.slice(-4)}`;
}
