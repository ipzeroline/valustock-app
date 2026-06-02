import { NextResponse } from "next/server";
import {
  clearAdminCookie,
  createAdminSession,
  isAdminAuthConfigured,
  setAdminCookie,
  validateAdminCredentials,
  verifyAdminRequest,
} from "@/lib/admin-auth";

export async function GET(req: Request) {
  return NextResponse.json({
    authenticated: await verifyAdminRequest(req),
    configured: isAdminAuthConfigured(),
  });
}

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin auth is not configured" }, { status: 503 });
  }

  if (!validateAdminCredentials(String(username || ""), String(password || ""))) {
    return NextResponse.json({ error: "Invalid admin username or password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  setAdminCookie(response, await createAdminSession(String(username)));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAdminCookie(response);
  return response;
}
