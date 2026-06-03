import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPlanForEmail } from "@/lib/entitlements";
import { requireMember } from "@/lib/member-auth";
import { sendTelegramMessage } from "@/lib/telegram";

function normalizeSymbol(symbol: unknown) {
  return typeof symbol === "string" ? symbol.trim().toUpperCase().slice(0, 24) : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const { error, member } = await requireMember(req);
  if (error) return error;

  const body = await req.json();
  const symbol = normalizeSymbol(body.symbol);
  const price = Number(body.price);
  const fairValue = Number(body.fairValue);
  const mos = Number(body.marginOfSafety);

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const plan = await getPlanForEmail(member.email);
  if (!plan.limits.alerts) {
    return NextResponse.json({ error: "Telegram alerts require Premium plan or higher", requiredPlan: "premium" }, { status: 403 });
  }

  const rows = await query<{ telegram_chat_id: string; status: string }[]>(
    "SELECT telegram_chat_id, status FROM telegram_connections WHERE user_email = ? LIMIT 1",
    [member.email]
  );
  const connection = rows[0];
  if (!connection?.telegram_chat_id || connection.status !== "connected") {
    return NextResponse.json({ error: "Telegram is not connected for this member" }, { status: 409 });
  }

  const safeSymbol = escapeHtml(symbol);
  const safeEmail = escapeHtml(member.email);
  const text = [
    "<b>ValuStock Alert Center</b>",
    "",
    `<b>${safeSymbol}</b> เข้าสู่โซนที่ต้องติดตาม`,
    Number.isFinite(price) ? `ราคาปัจจุบัน: <b>${price.toFixed(2)}</b>` : "",
    Number.isFinite(fairValue) ? `Fair Value: <b>${fairValue.toFixed(2)}</b>` : "",
    Number.isFinite(mos) ? `Margin of Safety: <b>${mos.toFixed(0)}%</b>` : "",
    "",
    `บัญชี: ${safeEmail}`,
    "หมายเหตุ: ข้อความนี้เป็น test alert เพื่อยืนยันการเชื่อมต่อ Telegram",
  ].filter(Boolean).join("\n");

  try {
    await sendTelegramMessage({ chatId: connection.telegram_chat_id, text });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Telegram message failed" }, { status: 502 });
  }
}
