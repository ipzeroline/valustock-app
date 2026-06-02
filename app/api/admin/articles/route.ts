import { NextResponse } from "next/server";
import { getDbConnectionStatus, isDbConnected, query } from "@/lib/db";

export async function GET() {
  const status = await getDbConnectionStatus();

  try {
    if (status.connected) {
      const rows = await query("SELECT slug, title, category, read_time, summary, content, tag, lang, created_at FROM articles ORDER BY created_at DESC");
      return NextResponse.json({ articles: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database articles fetch error:", err.message);
    return NextResponse.json(
      { error: "Database articles fetch failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Articles were not loaded.", detail: status.error, code: status.code, mockMode: false },
    { status: 503 }
  );
}

export async function POST(req: Request) {
  const connected = await isDbConnected();
  const { slug, title, category, read_time, summary, content, tag, lang } = await req.json();

  if (!slug || !title) {
    return NextResponse.json({ error: "Slug and Title are required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query(`
        INSERT INTO articles (slug, title, category, read_time, summary, content, tag, lang)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = ?, category = ?, read_time = ?, summary = ?, content = ?, tag = ?, lang = ?
      `, [
        slug, title, category || "General", read_time || "5 mins", summary || "", content || "", tag || "", lang || "th",
        title, category || "General", read_time || "5 mins", summary || "", content || "", tag || "", lang || "th"
      ]);

      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database article upsert error:", err.message);
    return NextResponse.json(
      { error: "Database article upsert failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Article was not saved to the real database.", mockMode: false },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
  const connected = await isDbConnected();
  const { slug } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query("DELETE FROM articles WHERE slug = ?", [slug]);
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database article delete error:", err.message);
    return NextResponse.json(
      { error: "Database article delete failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Article was not deleted from the real database.", mockMode: false },
    { status: 503 }
  );
}
