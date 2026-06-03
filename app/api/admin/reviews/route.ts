import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, query } from "@/lib/db";
import {
  ReviewRow,
  ReviewStatus,
  ensureReviewsTable,
  sanitizeReviewText,
} from "@/lib/reviews";

function normalizeStatus(value: unknown): ReviewStatus | "" {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "";
}

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const statusFilter = normalizeStatus(searchParams.get("status"));
  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code, reviews: [], mockMode: false },
      { status: 503 }
    );
  }

  try {
    await ensureReviewsTable();

    const where = statusFilter ? "WHERE status = ?" : "";
    const params = statusFilter ? [statusFilter] : [];
    const rows = await query<ReviewRow[]>(
      `SELECT id, user_email, user_name, rating, title, content, status, admin_note, approved_at, created_at, updated_at
       FROM reviews
       ${where}
       ORDER BY FIELD(status, 'pending', 'approved', 'rejected'), updated_at DESC
       LIMIT 200`,
      params
    );

    return NextResponse.json({ reviews: rows, mockMode: false });
  } catch (err: any) {
    console.error("Admin reviews fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load reviews from database", detail: err.message, reviews: [], mockMode: false },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const nextStatus = normalizeStatus(body.status);
  const adminNote = sanitizeReviewText(body.adminNote, 500);

  if (!Number.isInteger(id) || id <= 0 || !nextStatus) {
    return NextResponse.json({ error: "Valid review id and status are required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Review was not updated.", detail: status.error, code: status.code, mockMode: false },
      { status: 503 }
    );
  }

  try {
    await ensureReviewsTable();

    await query(
      `UPDATE reviews
       SET status = ?,
           admin_note = ?,
           approved_at = CASE WHEN ? = 'approved' THEN COALESCE(approved_at, CURRENT_TIMESTAMP) ELSE NULL END
       WHERE id = ?`,
      [nextStatus, adminNote || null, nextStatus, id]
    );

    return NextResponse.json({ success: true, mockMode: false });
  } catch (err: any) {
    console.error("Admin review update error:", err.message);
    return NextResponse.json(
      { error: "Could not update review", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Valid review id is required" }, { status: 400 });
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Review was not deleted.", detail: status.error, code: status.code, mockMode: false },
      { status: 503 }
    );
  }

  try {
    await ensureReviewsTable();

    await query("DELETE FROM reviews WHERE id = ?", [id]);
    return NextResponse.json({ success: true, mockMode: false });
  } catch (err: any) {
    console.error("Admin review delete error:", err.message);
    return NextResponse.json(
      { error: "Could not delete review", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }
}
