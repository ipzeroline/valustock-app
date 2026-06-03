import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { sendTelegramMessage } from "@/lib/telegram";
import { buildCompareTelegramSummaryMessage, buildWatchlistTelegramSummaryMessages } from "@/lib/telegram-digest";
import { getTelegramMiniMember } from "@/lib/telegram-mini";

type CompareSetRow = {
  id: string;
  name: string;
  symbols: string;
  chartMetric: string | null;
};

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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const member = await getTelegramMiniMember(body.initData);
  if (!member) {
    return NextResponse.json({ error: "Telegram Mini App authentication failed" }, { status: 401 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code },
      { status: 503 }
    );
  }
  await initDatabase();

  const plan = await getPlanForEmail(member.email);
  if (!plan.limits.alerts) {
    return NextResponse.json({ error: "Telegram actions require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
  }

  const action = String(body.action || "");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");

  if (action === "watchlist_summary") {
    const rows = await query<{ symbol: string }[]>(
      "SELECT symbol FROM watchlists WHERE user_email = ? ORDER BY created_at ASC",
      [member.email]
    );
    const messages = buildWatchlistTelegramSummaryMessages({
      email: member.email,
      symbols: rows.map((row) => row.symbol),
      siteUrl,
    });
    for (const text of messages) {
      await sendTelegramMessage({ chatId: member.chatId, text });
    }
    return NextResponse.json({ success: true, messagesSent: messages.length });
  }

  if (action === "compare_alert") {
    const setId = typeof body.setId === "string" ? body.setId.trim() : "";
    if (!setId) return NextResponse.json({ error: "Comparison set ID is required" }, { status: 400 });

    const rows = await query<CompareSetRow[]>(
      `SELECT id, name, symbols, chart_metric AS chartMetric
       FROM comparison_sets
       WHERE user_email = ? AND id = ?
       LIMIT 1`,
      [member.email, setId]
    );
    const savedSet = rows[0];
    if (!savedSet) return NextResponse.json({ error: "Comparison set was not found" }, { status: 404 });

    const text = buildCompareTelegramSummaryMessage({
      email: member.email,
      name: savedSet.name,
      symbols: parseSymbols(savedSet.symbols),
      chartMetric: savedSet.chartMetric || "mos",
      siteUrl,
    });
    await sendTelegramMessage({ chatId: member.chatId, text });
    return NextResponse.json({ success: true, messagesSent: 1 });
  }

  return NextResponse.json({ error: "Unsupported Telegram Mini App action" }, { status: 400 });
}
