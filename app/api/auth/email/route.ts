import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { createSingleActiveSession } from "@/lib/sessions";
import { normalizeMemberEmail } from "@/lib/member-identity";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? normalizeMemberEmail(value) : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Member was not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const name = String(body.name || email.split("@")[0] || "นักลงทุน").trim().slice(0, 255);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO users (email, name, plan, billing)
       VALUES (?, ?, 'free', 'monthly')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [email, name || "นักลงทุน"]
    );

    const rows = await query<{ email: string; name: string; plan: string; billing: string }[]>(
      "SELECT email, name, plan, billing FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0] || { email, name: name || "นักลงทุน", plan: "free", billing: "monthly" };
    const sessionId = await createSingleActiveSession("member", email);
    const token = signToken({ email, name: user.name, sessionId });

    return NextResponse.json({
      success: true,
      email: user.email,
      name: user.name,
      plan: user.plan,
      billing: user.billing,
      token,
    });
  } catch (err: any) {
    console.error("Email auth upsert error:", err.message);
    return NextResponse.json(
      { error: "Email auth save failed", detail: err.message },
      { status: 500 }
    );
  }
}
