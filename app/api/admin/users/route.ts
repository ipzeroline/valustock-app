import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, isDbConnected, query } from "@/lib/db";

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const status = await getDbConnectionStatus();

  try {
    if (status.connected) {
      const rows = await query("SELECT email, name, plan, billing, joined_at FROM users ORDER BY joined_at DESC");
      return NextResponse.json({ users: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database user fetch error:", err.message);
    return NextResponse.json(
      { error: "Database user fetch failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Users were not loaded.", detail: status.error, code: status.code, mockMode: false },
    { status: 503 }
  );
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const connected = await isDbConnected();
  const { email, name, plan, billing } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query(`
        INSERT INTO users (email, name, plan, billing)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = ?, plan = ?, billing = ?
      `, [email, name || "นักลงทุน", plan || "free", billing || "monthly", name || "นักลงทุน", plan || "free", billing || "monthly"]);

      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database user upsert error:", err.message);
    return NextResponse.json(
      { error: "Database user upsert failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. User was not saved.", mockMode: false },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const connected = await isDbConnected();
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query("DELETE FROM users WHERE email = ?", [email]);
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database user delete error:", err.message);
    return NextResponse.json(
      { error: "Database user delete failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. User was not deleted.", mockMode: false },
    { status: 503 }
  );
}
