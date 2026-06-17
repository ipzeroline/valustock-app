import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";
import { shouldRefreshToken, signToken, verifyToken } from "@/lib/auth";
import { normalizeMemberEmail } from "@/lib/member-identity";
import { getMemberSessionToken, setMemberSessionCookie } from "@/lib/member-session-cookie";
import { validateActiveSession } from "@/lib/sessions";

export async function GET(req: Request) {
  const token = getMemberSessionToken(req);
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (!(await isDbConnected())) {
    return NextResponse.json({ error: "Database is not connected" }, { status: 503 });
  }

  const loginEmail = payload.email;
  const email = normalizeMemberEmail(payload.email);
  const active = await validateActiveSession("member", loginEmail, payload.sessionId) ||
    await validateActiveSession("member", email, payload.sessionId);
  if (!active) {
    return NextResponse.json({ authenticated: false, code: "SESSION_REPLACED" }, { status: 401 });
  }

  const rows = await query<{ email: string; name: string; plan: string; billing: string }[]>(
    "SELECT email, name, plan, billing FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const user = rows[0] || {
    email,
    name: payload.name,
    plan: "free",
    billing: "monthly",
  };
  const refreshedToken = shouldRefreshToken(payload.exp)
    ? signToken({ email, name: user.name, sessionId: payload.sessionId })
    : null;

  const response = NextResponse.json({
    authenticated: true,
    email,
    name: user.name,
    plan: user.plan,
    billing: user.billing,
    token: refreshedToken || token,
  });
  if (refreshedToken) setMemberSessionCookie(response, refreshedToken);
  return response;
}
