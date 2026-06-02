import crypto from "crypto";
import { query } from "@/lib/db";

export type SessionAccountType = "member" | "staff";

function normalizeKey(accountKey: string) {
  return accountKey.trim().toLowerCase();
}

async function ensureActiveSessionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      account_type VARCHAR(20) NOT NULL,
      account_key VARCHAR(255) NOT NULL,
      session_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (account_type, account_key),
      INDEX idx_active_session_id (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function createSingleActiveSession(accountType: SessionAccountType, accountKey: string) {
  await ensureActiveSessionsTable();
  const sessionId = crypto.randomUUID();
  await query(
    `INSERT INTO active_sessions (account_type, account_key, session_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), updated_at = CURRENT_TIMESTAMP`,
    [accountType, normalizeKey(accountKey), sessionId]
  );
  return sessionId;
}

export async function validateActiveSession(accountType: SessionAccountType, accountKey: string, sessionId: string) {
  await ensureActiveSessionsTable();
  const rows = await query<any[]>(
    `SELECT session_id
     FROM active_sessions
     WHERE account_type = ? AND account_key = ?
     LIMIT 1`,
    [accountType, normalizeKey(accountKey)]
  );
  return rows[0]?.session_id === sessionId;
}

export async function clearActiveSession(accountType: SessionAccountType, accountKey: string, sessionId?: string) {
  await ensureActiveSessionsTable();
  if (sessionId) {
    await query(
      "DELETE FROM active_sessions WHERE account_type = ? AND account_key = ? AND session_id = ?",
      [accountType, normalizeKey(accountKey), sessionId]
    );
    return;
  }

  await query(
    "DELETE FROM active_sessions WHERE account_type = ? AND account_key = ?",
    [accountType, normalizeKey(accountKey)]
  );
}
