import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";

// Beautiful populated user list for Sandboxed Mock Mode
const MOCK_USERS = [
  {
    email: "zeroline@live.com",
    name: "Zeroline (Super Admin)",
    plan: "premium",
    billing: "yearly",
    joined_at: "2026-05-30T09:45:00Z",
  },
  {
    email: "admin@valustock.app",
    name: "Admin (ระบบผู้จัดการ)",
    plan: "premium",
    billing: "yearly",
    joined_at: "2026-05-15T08:00:00Z",
  },
  {
    email: "kitti.value@gmail.com",
    name: "กิตติพงษ์ เน้นคุ้มค่า",
    plan: "pro",
    billing: "monthly",
    joined_at: "2026-05-20T10:12:00Z",
  },
  {
    email: "somchai.trade@hotmail.com",
    name: "สมชาย ยอดนักลงทุน",
    plan: "free",
    billing: "monthly",
    joined_at: "2026-05-24T14:45:00Z",
  },
  {
    email: "pitcha.dividend@outlook.com",
    name: "พิชชาภา รักเงินปันผล",
    plan: "premium",
    billing: "monthly",
    joined_at: "2026-05-28T09:05:00Z",
  },
  {
    email: "suradech.grow@yahoo.com",
    name: "สุรเดช เติบโตแกร่ง",
    plan: "pro",
    billing: "yearly",
    joined_at: "2026-05-29T16:30:00Z",
  },
];

export async function GET() {
  const connected = await isDbConnected();

  try {
    if (connected) {
      const rows = await query("SELECT email, name, plan, billing, joined_at FROM users ORDER BY joined_at DESC");
      
      // If table is empty, seed it with mock users for initial database beauty
      if (rows.length === 0) {
        for (const u of MOCK_USERS) {
          await query(
            "INSERT INTO users (email, name, plan, billing, joined_at) VALUES (?, ?, ?, ?, ?)",
            [u.email, u.name, u.plan, u.billing, new Date(u.joined_at)]
          );
        }
        const seeded = await query("SELECT email, name, plan, billing, joined_at FROM users ORDER BY joined_at DESC");
        return NextResponse.json({ users: seeded, mockMode: false });
      }

      return NextResponse.json({ users: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database user fetch error:", err.message);
  }

  // Fallback to Mock sandbox if offline
  return NextResponse.json({ users: MOCK_USERS, mockMode: true });
}

export async function POST(req: Request) {
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
      { error: "Database user upsert failed", detail: err.message, mockMode: true },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. User was not saved.", mockMode: true },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
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
      { error: "Database user delete failed", detail: err.message, mockMode: true },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. User was not deleted.", mockMode: true },
    { status: 503 }
  );
}
