import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";

// Pre-populated mock staff list for sandboxed workspace mode
const MOCK_STAFF = [
  {
    id: 1,
    username: "zeroline",
    name: "Super Admin Zeroline",
    role: "superadmin",
    email: "zeroline.exec@valustock.app",
    status: "active",
    created_at: "2026-05-10T12:00:00Z",
  },
  {
    id: 2,
    username: "somprat",
    name: "สมปราชญ์ วิเคราะห์หลัก",
    role: "analyst",
    email: "somprat.analyst@valustock.app",
    status: "active",
    created_at: "2026-05-18T09:30:00Z",
  },
  {
    id: 3,
    username: "napha",
    name: "นภา ลิขิตอักษร",
    role: "editor",
    email: "napha.editor@valustock.app",
    status: "active",
    created_at: "2026-05-22T14:15:00Z",
  },
  {
    id: 4,
    username: "chana",
    name: "ชนะใจ ช่วยเหลือลูกค้า",
    role: "support",
    email: "chana.support@valustock.app",
    status: "active",
    created_at: "2026-05-25T08:45:00Z",
  },
];

export async function GET() {
  const connected = await isDbConnected();

  try {
    if (connected) {
      const rows = await query("SELECT id, username, name, role, email, status, created_at FROM staff ORDER BY created_at ASC");
      
      // If table is empty, seed it with mock staff
      if (rows.length === 0) {
        for (const s of MOCK_STAFF) {
          await query(
            "INSERT INTO staff (username, name, role, email, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [s.username, s.name, s.role, s.email, s.status, new Date(s.created_at)]
          );
        }
        const seeded = await query("SELECT id, username, name, role, email, status, created_at FROM staff ORDER BY created_at ASC");
        return NextResponse.json({ staff: seeded, mockMode: false });
      }

      return NextResponse.json({ staff: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database staff fetch error:", err.message);
  }

  // Fallback to sandboxed data
  return NextResponse.json({ staff: MOCK_STAFF, mockMode: true });
}

export async function POST(req: Request) {
  const connected = await isDbConnected();
  const body = await req.json();
  const { id, username, name, role, email, status } = body;

  if (!username || !name) {
    return NextResponse.json({ error: "Username and Name are required" }, { status: 400 });
  }

  try {
    if (connected) {
      if (id) {
        // Update staff member
        await query(
          "UPDATE staff SET name = ?, role = ?, email = ?, status = ? WHERE id = ?",
          [name, role || "support", email || "", status || "active", id]
        );
      } else {
        // Insert new staff member
        await query(
          "INSERT INTO staff (username, name, role, email, status) VALUES (?, ?, ?, ?, ?)",
          [username, name, role || "support", email || "", status || "active"]
        );
      }
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database staff write error:", err.message);
    return NextResponse.json(
      { error: "Database staff write failed", detail: err.message, mockMode: true },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Staff member was not saved.", mockMode: true },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
  const connected = await isDbConnected();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query("DELETE FROM staff WHERE id = ?", [id]);
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database staff delete error:", err.message);
    return NextResponse.json(
      { error: "Database staff delete failed", detail: err.message, mockMode: true },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Staff member was not deleted.", mockMode: true },
    { status: 503 }
  );
}
