import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, initDatabase } from "@/lib/db";

export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const status = await getDbConnectionStatus();
  
  if (status.connected) {
    // Dynamically trigger schema initializer if tables are missing
    await initDatabase();
  }

  return NextResponse.json({
    connected: status.connected,
    error: status.error,
    code: status.code,
    host: process.env.DB_HOST || "not configured",
    database: process.env.DB_NAME || "not configured",
    user: process.env.DB_USER || "not configured",
    port: Number(process.env.DB_PORT || 3306),
  });
}
