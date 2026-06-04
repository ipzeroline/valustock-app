import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { createSingleActiveSession } from "@/lib/sessions";
import { normalizeMemberEmail } from "@/lib/member-identity";
import { getRequestOrigin } from "@/lib/request-origin";

function getCookieValue(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const loginPageUrl = getRequestOrigin(req, "/login");

  if (!code) {
    console.error("Google Callback Error: Missing auth code");
    return NextResponse.redirect(`${loginPageUrl}?error=missing_code`);
  }

  try {
    const storedState = getCookieValue(req, "valustock_google_oauth_state");
    if (!state || !storedState || state !== storedState) {
      throw new Error("OAuth state mismatch");
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("OAuth credentials not configured properly");
    }

    const redirectUri = getRequestOrigin(req, "/api/auth/google/callback");

    // 1. Exchange OAuth code for Google tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // 2. Fetch user information using access token
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userinfoResponse.ok) {
      throw new Error("Failed to fetch Google userinfo");
    }

    const googleUser = await userinfoResponse.json();
    const googleEmail = googleUser.email?.toLowerCase().trim();
    const email = googleEmail ? normalizeMemberEmail(googleEmail) : "";
    const name = googleUser.name || email.split("@")[0] || "นักลงทุน";

    if (!googleEmail || !email) {
      throw new Error("Google userinfo did not contain email address");
    }

    // 3. Register or log in the user in the production data store.
    const dbConnected = await isDbConnected();
    if (!dbConnected) {
      throw new Error("Data service is offline. User login was not saved.");
    }

    try {
      await query(
        `INSERT INTO users (email, name, plan, billing)
         VALUES (?, ?, 'free', 'monthly')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [email, name]
      );
    } catch (dbErr: any) {
      console.error("User upsert failure:", dbErr.message);
      throw new Error("User upsert failed");
    }

    // 4. Create a single active member session. New login replaces older devices.
    const sessionId = await createSingleActiveSession("member", email);
    const token = signToken({ email, name, sessionId });

    // 5. Redirect back to client callback route with the signed token
    const callbackTargetUrl = `${getRequestOrigin(req, "/login/callback")}?token=${encodeURIComponent(token)}`;
    const response = NextResponse.redirect(callbackTargetUrl);
    response.cookies.set("valustock_google_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: callbackTargetUrl.startsWith("https://"),
      path: "/",
      maxAge: 0,
    });
    return response;

  } catch (err: any) {
    console.error("Google Auth Callback Exception:", err.message);
    return NextResponse.redirect(`${loginPageUrl}?error=oauth_failed`);
  }
}
