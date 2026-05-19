import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "./lib/session";

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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const session = sessionToken ? verifySessionToken(sessionToken) : null;

  // Redirect unauthenticated users away from protected pages
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect already-logged-in users away from auth page
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && session) {
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
