import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSingleActiveSession, validateActiveSession } from "@/lib/sessions";

const ADMIN_COOKIE = "valustock_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || (isProduction() ? "" : "valustock-dev-admin-session");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function getCookieValue(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminUsername() && getAdminPassword() && getSessionSecret());
}

export function validateAdminCredentials(username: string, password: string) {
  if (!isAdminAuthConfigured()) return false;
  return safeEqual(username, getAdminUsername()) && safeEqual(password, getAdminPassword());
}

export async function createAdminSession(username: string) {
  const sessionId = await createSingleActiveSession("staff", username);
  const payload = Buffer.from(JSON.stringify({
    username,
    sessionId,
    exp: Date.now() + SESSION_TTL_MS,
  })).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export async function verifyAdminRequest(req: Request) {
  if (!isAdminAuthConfigured()) return false;

  const token = getCookieValue(req, ADMIN_COOKIE);
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username?: string;
      sessionId?: string;
      exp?: number;
    };
    if (parsed.username !== getAdminUsername()) return false;
    if (!parsed.sessionId || typeof parsed.exp !== "number" || Date.now() > parsed.exp) return false;
    return validateActiveSession("staff", parsed.username, parsed.sessionId);
  } catch {
    return false;
  }
}

export async function requireAdmin(req: Request) {
  if (await verifyAdminRequest(req)) return null;
  return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
  });
}
