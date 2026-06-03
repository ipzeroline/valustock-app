import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { validateActiveSession } from "@/lib/sessions";
import { normalizeMemberEmail } from "@/lib/member-identity";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  const [type, token] = header.split(" ");
  return type?.toLowerCase() === "bearer" && token ? token : "";
}

export async function requireMember(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return {
      error: NextResponse.json({ error: "Member authentication required" }, { status: 401 }),
      member: null,
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Invalid or expired member token" }, { status: 401 }),
      member: null,
    };
  }

  const normalizedEmail = normalizeMemberEmail(payload.email);
  const active = await validateActiveSession("member", payload.email, payload.sessionId) ||
    await validateActiveSession("member", normalizedEmail, payload.sessionId);
  if (!active) {
    return {
      error: NextResponse.json({ error: "Session was replaced by a newer login", code: "SESSION_REPLACED" }, { status: 401 }),
      member: null,
    };
  }

  return {
    error: null,
    member: {
      email: normalizedEmail,
      name: payload.name,
      sessionId: payload.sessionId,
    },
  };
}
