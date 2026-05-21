import { NextRequest, NextResponse } from "next/server";

// ── Constants ─────────────────────────────────────────────────────────────────
const COOKIE_NAME = "ggai_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "ggai-dev-secret-change-in-production";

// Blocked scanners / attack tools
const BLOCKED_UAS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
  'nuclei', 'dirbuster', 'gobuster', 'wfuzz', 'hydra',
];

// Common attack / recon paths that should never exist on a Next.js app
const BLOCKED_PATHS = [
  '/.env', '/.git', '/wp-admin', '/wp-login', '/phpMyAdmin',
  '/admin.php', '/.htaccess', '/config.php', '/server-status',
  '/actuator', '/.well-known/security.txt',
];

// Public API routes that do NOT require a session cookie
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/market', '/api/ticker', '/api/search'];

// Security headers applied to every response
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// ── In-memory rate limiter (edge-compatible) ──────────────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ── HMAC-SHA256 token verification (Web Crypto — edge-compatible) ─────────────
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
    const sigBytes = new Uint8Array(
      (sig.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
  } catch {
    return false;
  }
}

// ── Helper: apply security headers to any response ───────────────────────────
function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // 1. Block scanners / attack tools by User-Agent
  const ua = req.headers.get('user-agent')?.toLowerCase() ?? '';
  if (BLOCKED_UAS.some(b => ua.includes(b))) {
    return withSecurityHeaders(new NextResponse('Forbidden', { status: 403 }));
  }

  // 2. Block common attack paths
  if (BLOCKED_PATHS.some(p => pathname.startsWith(p))) {
    return withSecurityHeaders(new NextResponse('Not Found', { status: 404 }));
  }

  // 3. Rate limiting for sensitive routes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  if (pathname.startsWith('/api/auth')) {
    if (!rateLimit(`auth:${ip}`, 5, 60_000)) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      );
    }
  } else if (pathname.startsWith('/api/bot/run')) {
    if (!rateLimit(`bot:${ip}`, 10, 60_000)) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      );
    }
  } else if (pathname.startsWith('/api/')) {
    if (!rateLimit(`api:${ip}`, 60, 60_000)) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      );
    }
  }

  // 4. CSRF-like protection: POST/PUT/DELETE to /api must have Origin or Referer
  //    matching this site (prevents cross-site form submissions / CSRF attacks)
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(method)) {
    const origin  = req.headers.get('origin')  ?? '';
    const referer = req.headers.get('referer') ?? '';
    const host    = req.headers.get('host')    ?? '';

    const siteOrigins = [
      `https://${host}`,
      `http://${host}`,  // dev
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    const hasValidOrigin  = origin  && siteOrigins.some(o => origin.startsWith(o));
    const hasValidReferer = referer && siteOrigins.some(o => referer.startsWith(o));

    // Allow /api/auth on non-browser clients only if it's a direct API call
    // (Stripe webhooks, etc. use their own auth — exclude those)
    const isWebhook = pathname.startsWith('/api/webhooks/');

    if (!isWebhook && !hasValidOrigin && !hasValidReferer) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      );
    }
  }

  // 5. Auth checks
  const sessionToken  = req.cookies.get(COOKIE_NAME)?.value;
  const authenticated = sessionToken ? await verifyToken(sessionToken) : false;

  // Protect /dashboard — redirect to /auth if no valid session
  if (pathname.startsWith('/dashboard')) {
    if (!authenticated) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('next', pathname);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Protect /api routes that require auth (skip public prefixes)
  if (
    pathname.startsWith('/api/') &&
    !PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))
  ) {
    if (!authenticated) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
  }

  // Redirect already-logged-in users away from auth page
  if (pathname.startsWith('/auth') && authenticated) {
    const next = req.nextUrl.searchParams.get('next') || '/dashboard';
    return withSecurityHeaders(NextResponse.redirect(new URL(next, req.url)));
  }

  // 6. Apply security headers to all passing responses
  const res = NextResponse.next();
  return withSecurityHeaders(res);
}

export const config = {
  matcher: [
    // Covers all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
