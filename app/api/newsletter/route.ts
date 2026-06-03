import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_SUBMITS = 5;
const MAX_EMAIL_SUBMITS = 3;
const MIN_FORM_TIME_MS = 2500;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function hitRateLimit(key: string, max: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > max;
}

export async function POST(req: Request) {
  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Newsletter subscriber was not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const source = String(body.source || "landing").slice(0, 100);
  const lang = String(body.lang || "th").slice(0, 10);
  const website = String(body.website || "").trim();
  const elapsedMs = Number(body.elapsedMs || 0);
  const ip = getClientIp(req);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field. Return success silently so bots do not learn the rule.
  if (website) {
    return NextResponse.json({ success: true, skipped: true });
  }

  if (!Number.isFinite(elapsedMs) || elapsedMs < MIN_FORM_TIME_MS) {
    return NextResponse.json({ error: "Please wait a moment before submitting." }, { status: 429 });
  }

  if (hitRateLimit(`ip:${ip}`, MAX_IP_SUBMITS) || hitRateLimit(`email:${email}`, MAX_EMAIL_SUBMITS)) {
    return NextResponse.json({ error: "Too many newsletter attempts. Please try again later." }, { status: 429 });
  }

  try {
    await ensureNewsletterTable();
    await query(
      `INSERT INTO newsletter_subscribers (email, source, lang, status)
       VALUES (?, ?, ?, 'subscribed')
       ON DUPLICATE KEY UPDATE
         source = VALUES(source),
         lang = VALUES(lang),
         status = 'subscribed',
         updated_at = CURRENT_TIMESTAMP`,
      [email, source, lang]
    );

    return NextResponse.json({ success: true, email });
  } catch (err: any) {
    console.error("Newsletter subscriber save error:", err.message);
    return NextResponse.json(
      { error: "Newsletter subscriber save failed", detail: err.message },
      { status: 500 }
    );
  }
}
