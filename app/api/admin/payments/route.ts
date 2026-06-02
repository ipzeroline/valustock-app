import { NextResponse } from "next/server";
import { getDbConnectionStatus, isDbConnected, query } from "@/lib/db";

export async function GET() {
  const status = await getDbConnectionStatus();

  try {
    if (status.connected) {
      const rows = await query("SELECT id, user_email, amount, plan, billing, status, payment_method, transaction_ref, created_at FROM payments ORDER BY created_at DESC");
      return NextResponse.json({ payments: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database payments fetch error:", err.message);
    return NextResponse.json(
      { error: "Database payments fetch failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Payments were not loaded.", detail: status.error, code: status.code, mockMode: false },
    { status: 503 }
  );
}

export async function POST(req: Request) {
  const connected = await isDbConnected();
  const body = await req.json();
  const { id, user_email, amount, plan, billing, status, payment_method, transaction_ref } = body;

  try {
    if (connected) {
      if (id) {
        // Update existing transaction status
        await query(
          "UPDATE payments SET status = ? WHERE id = ?",
          [status || "verified", id]
        );

        // Also if verified, sync and update the user plan inside `users` table
        if (status === "verified") {
          await query(
            "UPDATE users SET plan = ?, billing = ? WHERE email = ?",
            [plan || "pro", billing || "monthly", user_email]
          );
        }
      } else {
        // Insert a new manual payment
        await query(
          "INSERT INTO payments (user_email, amount, plan, billing, status, payment_method, transaction_ref) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [user_email, amount || 0, plan || "pro", billing || "monthly", status || "pending", payment_method || "bank_transfer", transaction_ref || ""]
        );

        if (status === "verified" && user_email) {
          await query(
            `INSERT INTO users (email, name, plan, billing)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE plan = VALUES(plan), billing = VALUES(billing)`,
            [user_email, user_email.split("@")[0] || "นักลงทุน", plan || "pro", billing || "monthly"]
          );
        }
      }
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database payments write error:", err.message);
    return NextResponse.json(
      { error: "Database payment write failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Payment was not saved.", mockMode: false },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
  const connected = await isDbConnected();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query("DELETE FROM payments WHERE id = ?", [id]);
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database payment delete error:", err.message);
    return NextResponse.json(
      { error: "Database payment delete failed", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Payment was not deleted.", mockMode: false },
    { status: 503 }
  );
}
