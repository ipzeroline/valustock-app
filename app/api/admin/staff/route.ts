import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, isDbConnected, query } from "@/lib/db";

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const status = await getDbConnectionStatus();

  try {
    if (status.connected) {
      const rows = await query("SELECT id, username, name, role, email, status, created_at FROM staff ORDER BY created_at ASC");
      return NextResponse.json({ staff: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database staff fetch error:", err.message);
    return NextResponse.json(
      { error: "Database staff fetch failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Staff were not loaded.", detail: status.error, code: status.code, mockMode: false },
    { status: 503 }
  );
}

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

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
      { error: "Database staff write failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Staff member was not saved.", mockMode: false },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

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
      { error: "Database staff delete failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Staff member was not deleted.", mockMode: false },
    { status: 503 }
  );
}
