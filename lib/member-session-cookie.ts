import { NextResponse } from "next/server";
import { getSessionDurationMs } from "@/lib/auth";

export const MEMBER_SESSION_COOKIE = "valustock_member_session";

export function getCookieValue(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getMemberSessionToken(req: Request) {
  const raw = getCookieValue(req, MEMBER_SESSION_COOKIE);
  return raw ? decodeURIComponent(raw) : "";
}

export function setMemberSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(MEMBER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(getSessionDurationMs() / 1000),
  });
}

export function clearMemberSessionCookie(response: NextResponse) {
  response.cookies.set(MEMBER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
