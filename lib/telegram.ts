type TelegramMessage = {
  text: string;
  chatId?: string;
};

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function sendTelegramMessage({ text, chatId }: TelegramMessage) {
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
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram message failed");
  }

  return data;
}
