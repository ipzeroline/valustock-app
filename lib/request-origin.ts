export function getRequestOrigin(req: Request, fallbackPath = "") {
  const host = req.headers.get("host");
  const isLocalhost = host?.includes("localhost") || host?.includes("127.0.0.1");
  if (!isLocalhost) {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (configured) return `${configured}${fallbackPath}`;
  }

  if (!host) return fallbackPath || "/";

  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}${fallbackPath}`;
}
