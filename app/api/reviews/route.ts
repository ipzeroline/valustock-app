import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDbConnectionStatus, query } from "@/lib/db";
import {
  ReviewRow,
  ensureReviewsTable,
  isValidReviewEmail,
  maskReviewEmail,
  normalizeRating,
  normalizeReviewEmail,
  sanitizeReviewText,
} from "@/lib/reviews";
import { validateActiveSession } from "@/lib/sessions";

function toPublicReview(row: ReviewRow) {
  return {
    id: row.id,
    name: row.user_name,
    emailMask: maskReviewEmail(row.user_email),
    rating: Number(row.rating),
    title: row.title || "",
    content: row.content,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

function toMyReview(row: ReviewRow | null) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.user_name,
    rating: Number(row.rating),
    title: row.title || "",
    content: row.content,
    status: row.status,
    adminNote: row.admin_note || "",
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") || 9)));

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected", detail: status.error, code: status.code, reviews: [], mockMode: false },
      { status: 503 }
    );
  }

  try {
    await ensureReviewsTable();

    const reviews = await query<ReviewRow[]>(
      `SELECT id, user_email, user_name, rating, title, content, status, admin_note, approved_at, created_at, updated_at
       FROM reviews
       WHERE status = 'approved'
       ORDER BY approved_at DESC, created_at DESC
       LIMIT ${limit}`
    );

    let myReview: ReviewRow | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
    const payload = token ? verifyToken(token) : null;
    const email = payload ? normalizeReviewEmail(payload.email) : "";
    if (payload && email && isValidReviewEmail(email)) {
      const active = await validateActiveSession("member", email, payload.sessionId);
      if (!active) {
        return NextResponse.json(
          { error: "Session was replaced by a newer login", code: "SESSION_REPLACED" },
          { status: 401 }
        );
      }

      const rows = await query<ReviewRow[]>(
        `SELECT id, user_email, user_name, rating, title, content, status, admin_note, approved_at, created_at, updated_at
         FROM reviews
         WHERE user_email = ?
         LIMIT 1`,
        [email]
      );
      myReview = rows[0] || null;
    }

    return NextResponse.json({
      reviews: reviews.map(toPublicReview),
      myReview: toMyReview(myReview),
      aggregate: {
        count: reviews.length,
        averageRating: reviews.length
          ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
          : 0,
      },
      mockMode: false,
    });
  } catch (err: any) {
    console.error("Public reviews fetch error:", err.message);
    return NextResponse.json(
      { error: "Could not load reviews from database", detail: err.message, reviews: [], mockMode: false },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return NextResponse.json(
      { error: "Database is not connected. Review was not saved.", detail: status.error, code: status.code, mockMode: false },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const payload = verifyToken(String(body.token || ""));
  if (!payload) {
    return NextResponse.json({ error: "Member login is required to write a review" }, { status: 401 });
  }

  const email = normalizeReviewEmail(payload.email);
  const rating = normalizeRating(body.rating);
  const title = sanitizeReviewText(body.title, 160);
  const content = sanitizeReviewText(body.content, 1200);

  if (!isValidReviewEmail(email)) {
    return NextResponse.json({ error: "Valid member login is required" }, { status: 401 });
  }

  if (content.length < 20) {
    return NextResponse.json({ error: "Review content must be at least 20 characters" }, { status: 400 });
  }

  try {
    await ensureReviewsTable();

    const active = await validateActiveSession("member", email, payload.sessionId);
    if (!active) {
      return NextResponse.json(
        { error: "Session was replaced by a newer login", code: "SESSION_REPLACED" },
        { status: 401 }
      );
    }

    const users = await query<{ name: string | null }[]>(
      "SELECT name FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const member = users[0];
    if (!member) {
      return NextResponse.json({ error: "Only registered members can write reviews" }, { status: 403 });
    }
    const name = sanitizeReviewText(member.name, 255) || sanitizeReviewText(payload.name, 255) || "นักลงทุน ValuStock";

    await query(
      `INSERT INTO reviews (user_email, user_name, rating, title, content, status, admin_note, approved_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL)
       ON DUPLICATE KEY UPDATE
         user_name = VALUES(user_name),
         rating = VALUES(rating),
         title = VALUES(title),
         content = VALUES(content),
         status = 'pending',
         admin_note = NULL,
         approved_at = NULL`,
      [email, name, rating, title || null, content]
    );

    return NextResponse.json({ success: true, status: "pending", mockMode: false });
  } catch (err: any) {
    console.error("Review save error:", err.message);
    return NextResponse.json(
      { error: "Could not save review to database", detail: err.message, mockMode: false },
      { status: 500 }
    );
  }
}
