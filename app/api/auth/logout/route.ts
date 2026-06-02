import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { isDbConnected } from "@/lib/db";
import { clearActiveSession } from "@/lib/sessions";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    if (!(await isDbConnected())) {
      return NextResponse.json(
        { error: "Database is not connected. Session was not cleared." },
        { status: 503 }
      );
    }

    await clearActiveSession("member", payload.email, payload.sessionId);

    return NextResponse.json({
      success: true,
      email: payload.email,
      sessionId: payload.sessionId,
    });
  } catch (err: any) {
    console.error("Logout exception:", err.message);
    return NextResponse.json({ error: "Server error during logout" }, { status: 500 });
  }
}
