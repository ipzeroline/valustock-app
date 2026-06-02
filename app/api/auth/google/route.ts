import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google Client ID is not configured" }, { status: 500 });
  }

  // Dynamically determine redirect URI based on the request host
  const host = req.headers.get("host") || "localhost:7887";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  const state = crypto.randomUUID();

  // Create Google OAuth Auth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  // Redirect the browser to Google
  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set("valustock_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: protocol === "https",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
