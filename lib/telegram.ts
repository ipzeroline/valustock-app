type TelegramMessage = {
  text: string;
  chatId?: string;
  replyMarkup?: Record<string, unknown>;
};

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function sendTelegramMessage({ text, chatId, replyMarkup }: TelegramMessage) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId;

  if (!token || !targetChatId) {
    throw new Error("Telegram is not configured");
  }

  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram message failed");
  }

  return data;
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !callbackQueryId) return null;

  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {}),
    }),
  });

  return response.json().catch(() => ({}));
}
