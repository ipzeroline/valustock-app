import crypto from "crypto";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or GOOGLE_CLIENT_SECRET is required in production");
  }
  return secret || "valustock-dev-auth-secret";
}

export interface AuthTokenPayload {
  email: string;
  name: string;
  sessionId: string;
  exp: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function getSessionDays() {
  const raw = Number(process.env.AUTH_SESSION_DAYS || 30);
  if (!Number.isFinite(raw)) return 30;
  return Math.min(Math.max(Math.floor(raw), 1), 90);
}

export function getSessionDurationMs() {
  return getSessionDays() * DAY_MS;
}

export function shouldRefreshToken(exp: number) {
  return exp - Date.now() < 7 * DAY_MS;
}

/**
 * Signs a payload with a cryptographic HMAC signature.
 * Returns a URL-safe token.
 */
export function signToken(payload: Omit<AuthTokenPayload, "exp"> & { exp?: number }): string {
  const exp = payload.exp || Date.now() + getSessionDurationMs();
  const fullPayload: AuthTokenPayload = { ...payload, exp };
  
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payloadStr)
    .digest("base64url");
    
  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a token's signature and expiration.
 * Returns the decoded payload if valid, otherwise null.
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const [payloadStr, signature] = token.split(".");
    if (!payloadStr || !signature) return null;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", getAuthSecret())
      .update(payloadStr)
      .digest("base64url");
      
    if (signature !== expectedSignature) {
      console.warn("Auth: Invalid token signature");
      return null;
    }
    
    // Decode and parse payload
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8")) as AuthTokenPayload;
    
    // Check expiration
    if (Date.now() > payload.exp) {
      console.warn("Auth: Token has expired");
      return null;
    }
    
    return payload;
  } catch (err: any) {
    console.error("Auth: Token verification error:", err.message);
    return null;
  }
}
