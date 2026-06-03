import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase, query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { requireMember } from "@/lib/member-auth";
import { sendTelegramMessage } from "@/lib/telegram";
import { buildCompareTelegramSummaryMessage } from "@/lib/telegram-digest";

type ChartMetric = "mos" | "yield" | "roe" | "margin";

type ComparisonSetRow = {
  id: string;
  name: string;
  symbols: string;
  chartMetric: string | null;
};

type TelegramConnectionRow = {
  telegram_chat_id: string | null;
  status: string | null;
};

function normalizeSymbols(symbols: unknown) {
  if (!Array.isArray(symbols)) return [];
  return Array.from(
    new Set(
      symbols
        .filter((symbol): symbol is string => typeof symbol === "string")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => /^[A-Z0-9._-]{1,20}$/.test(symbol))
    )
  ).slice(0, 4);
}

function normalizeMetric(metric: unknown): ChartMetric {
  return metric === "yield" || metric === "roe" || metric === "margin" ? metric : "mos";
}

function parseSymbols(value: string) {
  try {
    return normalizeSymbols(JSON.parse(value));
  } catch {
    return [];
  }
}

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

  const plan = await getPlanForEmail(member.email);
  if (!plan.limits.alerts) {
    return NextResponse.json(
      { error: "Compare Telegram alerts require Premium plan or higher", requiredPlan: "premium" },
      { status: 403 }
    );
  }

  const connections = await query<TelegramConnectionRow[]>(
    "SELECT telegram_chat_id, status FROM telegram_connections WHERE user_email = ? LIMIT 1",
    [member.email]
  );
  const connection = connections[0];
  if (!connection?.telegram_chat_id || connection.status !== "connected") {
    return NextResponse.json({ error: "Telegram is not connected" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const setId = typeof body.setId === "string" ? body.setId.trim() : "";
  let name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : "";
  let symbols = normalizeSymbols(body.symbols);
  let chartMetric = normalizeMetric(body.chartMetric);

  if (setId) {
    const rows = await query<ComparisonSetRow[]>(
      `SELECT id, name, symbols, chart_metric AS chartMetric
       FROM comparison_sets
       WHERE user_email = ? AND id = ?
       LIMIT 1`,
      [member.email, setId]
    );
    const savedSet = rows[0];
    if (!savedSet) {
      return NextResponse.json({ error: "Comparison set was not found" }, { status: 404 });
    }
    name = savedSet.name;
    symbols = parseSymbols(savedSet.symbols);
    chartMetric = normalizeMetric(savedSet.chartMetric);
  }

  if (symbols.length < 2) {
    return NextResponse.json({ error: "At least 2 symbols are required" }, { status: 400 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://valustock.com").replace(/\/$/, "");
  const text = buildCompareTelegramSummaryMessage({
    email: member.email,
    name: name || symbols.join(" vs "),
    symbols,
    chartMetric,
    siteUrl,
  });

  try {
    await sendTelegramMessage({ chatId: connection.telegram_chat_id, text });
    return NextResponse.json({ success: true, messagesSent: 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Telegram compare alert failed" }, { status: 502 });
  }
}
