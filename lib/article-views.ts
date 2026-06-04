import { getDbConnectionStatus, query } from "@/lib/db";

export type ArticleViewCounts = Record<string, number>;

function normalizeSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 255);
}

function normalizeVisitorId(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 96);
}

export async function ensureArticleViewsTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS article_view_counts (
      slug VARCHAR(255) PRIMARY KEY,
      views INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS article_view_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL,
      visitor_id VARCHAR(96) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_article_visitor (slug, visitor_id),
      INDEX idx_article_view_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function getArticleViewCounts(slugs: string[]): Promise<ArticleViewCounts> {
  const normalized = Array.from(new Set(slugs.map(normalizeSlug).filter(Boolean)));
  const base = Object.fromEntries(normalized.map((slug) => [slug, 0]));
  if (!normalized.length) return base;

  const status = await getDbConnectionStatus();
  if (!status.connected) return base;

  await ensureArticleViewsTables();
  const placeholders = normalized.map(() => "?").join(",");
  const rows = await query<Array<{ slug: string; views: number }>>(
    `SELECT slug, views FROM article_view_counts WHERE slug IN (${placeholders})`,
    normalized,
  );

  rows.forEach((row) => {
    base[row.slug] = Number(row.views || 0);
  });

  return base;
}

export async function recordArticleView(slugValue: unknown, visitorValue: unknown) {
  const slug = normalizeSlug(slugValue);
  const visitorId = normalizeVisitorId(visitorValue);
  if (!slug || !visitorId) {
    return { slug, views: 0, counted: false, error: "Invalid slug or visitor id" };
  }

  const status = await getDbConnectionStatus();
  if (!status.connected) {
    return { slug, views: 0, counted: false, error: status.error || "Database is not connected" };
  }

  await ensureArticleViewsTables();

  const result: any = await query(
    "INSERT IGNORE INTO article_view_events (slug, visitor_id) VALUES (?, ?)",
    [slug, visitorId],
  );
  const counted = Number(result?.affectedRows || 0) > 0;

  if (counted) {
    await query(
      `INSERT INTO article_view_counts (slug, views)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE views = views + 1`,
      [slug],
    );
  }

  const counts = await getArticleViewCounts([slug]);
  return { slug, views: counts[slug] || 0, counted };
}
