import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "ggai_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "ggai-dev-secret-change-in-production";

/** Verify HMAC-SHA256 token using Web Crypto API (Edge-compatible). */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const data = token.slice(0, dot);
    const sig  = token.slice(dot + 1);

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false, ["verify"]
    );
    const sigBytes = new Uint8Array((sig.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)));
    return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
  } catch {
    return false;
  }
}

// ── Security headers applied to every response ────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  // Enforce HTTPS for 1 year, include subdomains
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Prevent clickjacking via iframes
  "X-Frame-Options": "DENY",
  // Stop browsers from MIME-sniffing the content type
  "X-Content-Type-Options": "nosniff",
  // Limit referrer info sent to third parties
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Disable browser features we don't use
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  // Basic XSS protection for older browsers
  "X-XSS-Protection": "1; mode=block",
  // Content Security Policy — restricts where resources can load from
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://*.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

// ── Routes that require an authenticated session ──────────────────────────────
const PROTECTED_ROUTES = ["/dashboard"];

// ── Routes that logged-in users should be redirected away from ────────────────
const AUTH_ROUTES = ["/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const authenticated = sessionToken ? await verifyToken(sessionToken) : false;

  // Redirect unauthenticated users away from protected pages
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!authenticated) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect already-logged-in users away from auth page
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && authenticated) {
    const next = req.nextUrl.searchParams.get("next") || "/dashboard";
    return NextResponse.redirect(new URL(next, req.url));
  }

  // Apply security headers to all responses
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
