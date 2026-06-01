import crypto from "crypto";

const SECRET = process.env.GOOGLE_CLIENT_SECRET || "valustock-secret-key-321-google-auth-fallback";

export interface AuthTokenPayload {
  email: string;
  name: string;
  exp: number;
}

/**
 * Signs a payload with a cryptographic HMAC signature.
 * Returns a URL-safe token.
 */
export function signToken(payload: Omit<AuthTokenPayload, "exp"> & { exp?: number }): string {
  const exp = payload.exp || Date.now() + 1000 * 60 * 15; // default 15 minutes
  const fullPayload: AuthTokenPayload = { ...payload, exp };
  
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
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
      .createHmac("sha256", SECRET)
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
