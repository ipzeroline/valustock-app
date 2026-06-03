import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, isDbConnected, query } from "@/lib/db";

async function ensureNewsletterTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email VARCHAR(255) PRIMARY KEY,
      source VARCHAR(100) DEFAULT 'landing',
      lang VARCHAR(10) DEFAULT 'th',
      status VARCHAR(30) DEFAULT 'subscribed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Newsletter subscribers were not loaded.", detail: status.error, code: status.code, mockMode: false },
      { status: 503 }
    );
  }

  try {
    await ensureNewsletterTable();
    const rows = await query(
      `SELECT email, source, lang, status, created_at, updated_at
       FROM newsletter_subscribers
       ORDER BY updated_at DESC`
    );
    return NextResponse.json({ subscribers: rows, mockMode: false });
  } catch (err: any) {
    console.error("Database newsletter fetch error:", err.message);
    return NextResponse.json(
      { error: "Database newsletter fetch failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const connected = await isDbConnected();
  const { email: rawEmail } = await req.json();
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await ensureNewsletterTable();
      await query(
        "UPDATE newsletter_subscribers SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP WHERE email = ?",
        [email]
      );
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database newsletter unsubscribe error:", err.message);
    return NextResponse.json(
      { error: "Database newsletter unsubscribe failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Subscriber was not updated.", mockMode: false },
    { status: 503 }
  );
}
