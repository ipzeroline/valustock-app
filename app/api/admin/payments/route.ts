import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";

// Pre-populated mock transactions for sandboxed workspace mode
const MOCK_PAYMENTS = [
  {
    id: 1,
    user_email: "kitti.value@gmail.com",
    amount: 290.0,
    plan: "pro",
    billing: "monthly",
    status: "verified",
    payment_method: "promptpay",
    transaction_ref: "TXN987654321",
    created_at: "2026-05-20T10:15:00Z",
  },
  {
    id: 2,
    user_email: "pitcha.dividend@outlook.com",
    amount: 590.0,
    plan: "premium",
    billing: "monthly",
    status: "verified",
    payment_method: "credit_card",
    transaction_ref: "TXN123456789",
    created_at: "2026-05-28T09:10:00Z",
  },
  {
    id: 3,
    user_email: "suradech.grow@yahoo.com",
    amount: 2900.0,
    plan: "pro",
    billing: "yearly",
    status: "verified",
    payment_method: "bank_transfer",
    transaction_ref: "TXN555444333",
    created_at: "2026-05-29T16:45:00Z",
  },
  {
    id: 4,
    user_email: "somchai.trade@hotmail.com",
    amount: 590.0,
    plan: "premium",
    billing: "monthly",
    status: "pending",
    payment_method: "bank_transfer",
    transaction_ref: "TXN777888999",
    created_at: "2026-05-30T01:20:00Z",
  },
];

export async function GET() {
  const connected = await isDbConnected();

  try {
    if (connected) {
      const rows = await query("SELECT id, user_email, amount, plan, billing, status, payment_method, transaction_ref, created_at FROM payments ORDER BY created_at DESC");
      
      // If table is empty, seed it with mock payments
      if (rows.length === 0) {
        for (const p of MOCK_PAYMENTS) {
          await query(
            "INSERT INTO payments (user_email, amount, plan, billing, status, payment_method, transaction_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [p.user_email, p.amount, p.plan, p.billing, p.status, p.payment_method, p.transaction_ref, new Date(p.created_at)]
          );
        }
        const seeded = await query("SELECT id, user_email, amount, plan, billing, status, payment_method, transaction_ref, created_at FROM payments ORDER BY created_at DESC");
        return NextResponse.json({ payments: seeded, mockMode: false });
      }

      return NextResponse.json({ payments: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database payments fetch error:", err.message);
  }

  // Fallback to sandboxed data
  return NextResponse.json({ payments: MOCK_PAYMENTS, mockMode: true });
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
      }
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database payments write error:", err.message);
  }

  return NextResponse.json({ success: true, mockMode: true });
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
  }

  return NextResponse.json({ success: true, mockMode: true });
}
