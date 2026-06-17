import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";
import { shouldRefreshToken, signToken, verifyToken } from "@/lib/auth";
import { validateActiveSession } from "@/lib/sessions";
import { normalizeMemberEmail } from "@/lib/member-identity";
import { getMemberSessionToken, setMemberSessionCookie } from "@/lib/member-session-cookie";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || getMemberSessionToken(req);

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const loginEmail = payload.email;
    const email = normalizeMemberEmail(payload.email);
    const sessionId = payload.sessionId;
    let name = payload.name;
    let plan = "free";
    let billing = "monthly";

    // Fetch the latest registration info from database if available
    const dbConnected = await isDbConnected();
    if (dbConnected) {
      try {
        const active = await validateActiveSession("member", loginEmail, sessionId) ||
          await validateActiveSession("member", email, sessionId);
        if (!active) {
          return NextResponse.json(
            { error: "Session was replaced by a newer login", code: "SESSION_REPLACED" },
            { status: 401 }
          );
        }

        const rows = await query(
          "SELECT email, name, plan, billing FROM users WHERE email = ? LIMIT 1",
          [email]
        );
        if (rows && rows.length > 0) {
          const userDb = rows[0];
          name = userDb.name || name;
          plan = userDb.plan || "free";
          billing = userDb.billing || "monthly";
        }
      } catch (dbErr: any) {
        console.error("Database query failed during verification:", dbErr.message);
      }
    } else {
      return NextResponse.json(
        { error: "Database is not connected. Session cannot be verified." },
        { status: 503 }
      );
    }

    const refreshedToken = shouldRefreshToken(payload.exp)
      ? signToken({ email, name, sessionId })
      : null;

    const response = NextResponse.json({
      success: true,
      email,
      name,
      plan,
      billing,
      sessionId,
      token: refreshedToken || token,
      tokenRefreshed: Boolean(refreshedToken),
    });
    if (refreshedToken) setMemberSessionCookie(response, refreshedToken);
    return response;
  } catch (err: any) {
    console.error("Token verification exception:", err.message);
    return NextResponse.json({ error: "Server error during verification" }, { status: 500 });
  }
}
