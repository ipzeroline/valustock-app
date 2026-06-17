import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { isDbConnected } from "@/lib/db";
import { clearActiveSession } from "@/lib/sessions";
import { clearMemberSessionCookie, getMemberSessionToken } from "@/lib/member-session-cookie";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || getMemberSessionToken(req);

    if (!token) {
      const response = NextResponse.json({ success: true });
      clearMemberSessionCookie(response);
      return response;
    }

    const payload = verifyToken(token);
    if (!payload) {
      const response = NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      clearMemberSessionCookie(response);
      return response;
    }

    if (!(await isDbConnected())) {
      return NextResponse.json(
        { error: "Database is not connected. Session was not cleared." },
        { status: 503 }
      );
    }

    await clearActiveSession("member", payload.email, payload.sessionId);

    const response = NextResponse.json({
      success: true,
      email: payload.email,
      sessionId: payload.sessionId,
    });
    clearMemberSessionCookie(response);
    return response;
  } catch (err: any) {
    console.error("Logout exception:", err.message);
    return NextResponse.json({ error: "Server error during logout" }, { status: 500 });
  }
}
