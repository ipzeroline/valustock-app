import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { createSingleActiveSession } from "@/lib/sessions";
import { normalizeMemberEmail } from "@/lib/member-identity";
import { sendTelegramMessage } from "@/lib/telegram";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? normalizeMemberEmail(value) : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Email demo authentication is disabled in production. Use Google OAuth." },
      { status: 403 }
    );
  }

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
  const plan = typeof body.plan === "string" ? body.plan : undefined;
  const billing = typeof body.billing === "string" ? body.billing : undefined;
  const validPlans = ["free", "pro", "premium", "lifetime"];
  const validBillings = ["monthly", "yearly", "lifetime"];
  const resolvedPlan = plan && validPlans.includes(plan) ? plan : "free";
  const resolvedBilling = billing && validBillings.includes(billing) ? billing : "monthly";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  try {
    const existingUser = await query<any[]>(
      "SELECT email FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const isNewUser = existingUser.length === 0;

    // In development, allow setting plan directly (bypasses Stripe for testing)
    if (plan || billing) {
      await query(
        `INSERT INTO users (email, name, plan, billing)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), plan = VALUES(plan), billing = VALUES(billing)`,
        [email, name || "นักลงทุน", resolvedPlan, resolvedBilling]
      );
    } else {
      await query(
        `INSERT INTO users (email, name, plan, billing)
         VALUES (?, ?, 'free', 'monthly')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [email, name || "นักลงทุน"]
      );
    }

    if (isNewUser) {
      sendTelegramMessage({
        text: `🆕 <b>สมัครสมาชิกใหม่ (Email/Dev)</b>\n\n👤 ชื่อ: ${name || "นักลงทุน"}\n✉️ อีเมล: ${email}\n📅 เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} น.`,
      }).catch((err) => {
        console.error("Failed to send signup Telegram notification:", err);
      });
    }

    const rows = await query<{ email: string; name: string; plan: string; billing: string }[]>(
      "SELECT email, name, plan, billing FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0] || { email, name: name || "นักลงทุน", plan: resolvedPlan, billing: resolvedBilling };
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
