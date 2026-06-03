import { query } from "@/lib/db";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewRow {
  id: number;
  user_email: string;
  user_name: string;
  rating: number;
  title: string | null;
  content: string;
  status: ReviewStatus;
  admin_note: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function normalizeReviewEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidReviewEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeReviewText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

export function maskReviewEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

export async function ensureReviewsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      rating TINYINT NOT NULL DEFAULT 5,
      title VARCHAR(160),
      content TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'pending',
      admin_note TEXT,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_review_user (user_email),
      INDEX idx_reviews_status_created (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}
