import { NextResponse } from "next/server";
import { isDbConnected, initDatabase } from "@/lib/db";

export async function GET() {
  const connected = await isDbConnected();
  
  if (connected) {
    // Dynamically trigger schema initializer if tables are missing
    await initDatabase();
  }

  return NextResponse.json({
    connected,
    host: process.env.DB_HOST || "165.22.247.92",
    database: process.env.DB_NAME || "vscpost_db",
    user: process.env.DB_USER || "vscpost_db",
    port: 3306,
  });
}
