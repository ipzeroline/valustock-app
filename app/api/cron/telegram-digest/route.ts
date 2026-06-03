import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";
import { buildWatchlistTelegramSummaryMessages, getDefaultWatchlistSymbols } from "@/lib/telegram-digest";

type DigestFrequency = "daily" | "weekly";

type Recipient = {
  user_email: string;
  telegram_chat_id: string;
};

function getCronSecret(req: Request) {
  const header = req.headers.get("x-cron-secret") || "";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  const url = new URL(req.url);
  return header || bearer || url.searchParams.get("secret") || "";
}

function getFrequency(req: Request): DigestFrequency {
  const url = new URL(req.url);
  return url.searchParams.get("frequency") === "weekly" ? "weekly" : "daily";
}

function getBangkokDateKey() {
  const bangkok = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return bangkok.toISOString().slice(0, 10);
}

async function hasDelivered(email: string, deliveryType: string, deliveryDate: string) {
  const rows = await query<{ id: number }[]>(
    `SELECT id
     FROM telegram_delivery_logs
     WHERE user_email = ?
       AND delivery_type = ?
       AND delivery_date = ?
       AND status = 'sent'
     LIMIT 1`,
    [email, deliveryType, deliveryDate]
  );
  return rows.length > 0;
}

async function saveDeliveryLog({
  email,
  deliveryType,
  deliveryDate,
  status,
  messagesSent,
  error,
}: {
  email: string;
  deliveryType: string;
  deliveryDate: string;
  status: "sent" | "failed";
  messagesSent: number;
  error?: string;
}) {
  await query(
    `INSERT INTO telegram_delivery_logs (user_email, delivery_type, delivery_date, status, messages_sent, error)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       messages_sent = VALUES(messages_sent),
       error = VALUES(error),
       created_at = CURRENT_TIMESTAMP`,
    [email, deliveryType, deliveryDate, status, messagesSent, error || null]
  );
}

export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || getCronSecret(req) !== expectedSecret) {
    return NextResponse.json({ error: "Cron authentication required" }, { status: 401 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code },
      { status: 503 }
    );
  }
  await initDatabase();

  const url = new URL(req.url);
  const frequency = getFrequency(req);
  const force = url.searchParams.get("force") === "1";
  const deliveryDate = getBangkokDateKey();
  const deliveryType = `watchlist_${frequency}`;

  const recipients = await query<Recipient[]>(
    `SELECT tc.user_email, tc.telegram_chat_id
     FROM telegram_connections tc
     INNER JOIN users u ON u.email = tc.user_email
     WHERE tc.status = 'connected'
       AND tc.telegram_chat_id IS NOT NULL
       AND tc.watchlist_digest_enabled = TRUE
       AND tc.watchlist_digest_frequency = ?
       AND u.plan IN ('premium', 'lifetime')`,
    [frequency]
  );

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
  const result = {
    frequency,
    deliveryDate,
    recipients: recipients.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const recipient of recipients) {
    if (!force && await hasDelivered(recipient.user_email, deliveryType, deliveryDate)) {
      result.skipped += 1;
      continue;
    }

    try {
      const watchlistRows = await query<{ symbol: string }[]>(
        "SELECT symbol FROM watchlists WHERE user_email = ? ORDER BY created_at ASC",
        [recipient.user_email]
      );
      const symbols = getDefaultWatchlistSymbols(watchlistRows.map((row) => row.symbol));
      const messages = buildWatchlistTelegramSummaryMessages({
        email: recipient.user_email,
        symbols,
        siteUrl,
      });

      for (const text of messages) {
        await sendTelegramMessage({ chatId: recipient.telegram_chat_id, text });
      }

      await saveDeliveryLog({
        email: recipient.user_email,
        deliveryType,
        deliveryDate,
        status: "sent",
        messagesSent: messages.length,
      });
      result.sent += 1;
    } catch (err: any) {
      await saveDeliveryLog({
        email: recipient.user_email,
        deliveryType,
        deliveryDate,
        status: "failed",
        messagesSent: 0,
        error: err.message || "Unknown Telegram digest error",
      });
      result.failed += 1;
    }
  }

  return NextResponse.json({ success: true, ...result });
}
