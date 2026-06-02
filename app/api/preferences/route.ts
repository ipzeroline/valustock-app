import { NextResponse } from "next/server";
import { getDbConnectionStatus, query } from "@/lib/db";

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeTheme(theme: unknown) {
  return theme === "light" ? "light" : "dark";
}

function normalizeLang(lang: unknown) {
  return lang === "en" ? "en" : "th";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = normalizeEmail(searchParams.get("email"));

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Preferences were not loaded.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    const rows = await query<{ theme: "dark" | "light"; lang: "th" | "en" }[]>(
      "SELECT theme, lang FROM user_preferences WHERE user_email = ? LIMIT 1",
      [email]
    );
    return NextResponse.json({ preferences: rows[0] || null });
  } catch (err: any) {
    console.error("Database preferences fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load preferences from database", detail: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = normalizeEmail(body.email);
  const theme = normalizeTheme(body.theme);
  const lang = normalizeLang(body.lang);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Preferences were not saved.", detail: status.error, code: status.code },
      { status: 503 }
    );
  }

  try {
    await query(
      `INSERT INTO user_preferences (user_email, theme, lang)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE theme = VALUES(theme), lang = VALUES(lang)`,
      [email, theme, lang]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Database preferences write error:", err.message);
    return NextResponse.json(
      { error: "Could not save preferences to database", detail: err.message },
      { status: 500 }
    );
  }
}
