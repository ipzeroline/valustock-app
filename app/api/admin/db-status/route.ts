import { NextResponse } from "next/server";
import { getDbConnectionStatus, initDatabase } from "@/lib/db";

export async function GET() {
  const status = await getDbConnectionStatus();
  
  if (status.connected) {
    // Dynamically trigger schema initializer if tables are missing
    await initDatabase();
  }

  return NextResponse.json({
    connected: status.connected,
    error: status.error,
    code: status.code,
    host: process.env.DB_HOST || "165.22.247.92",
    database: process.env.DB_NAME || "vscpost_db",
    user: process.env.DB_USER || "vscpost_db",
    port: 3306,
  });
}
