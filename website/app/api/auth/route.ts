import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizePassword, sanitizeString } from "@/lib/sanitize";
import { setSessionCookie } from "@/lib/session";
import { isValidEmail, isStrongPassword, logSecurityEvent } from "@/lib/security";

// ── Brute-force: track failed login attempts per email ────────────────────────
interface FailEntry { count: number; lockedUntil: number }
const failMap = new Map<string, FailEntry>();
const MAX_FAILURES  = 5;
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes

function recordFailure(email: string): void {
  const now  = Date.now();
  const entry = failMap.get(email);
  if (!entry || now > entry.lockedUntil) {
    failMap.set(email, { count: 1, lockedUntil: 0 });
  } else {
    entry.count++;
    if (entry.count >= MAX_FAILURES) {
      entry.lockedUntil = now + LOCKOUT_MS;
    }
  }
}

function isLocked(email: string): boolean {
  const entry = failMap.get(email);
  if (!entry) return false;
  if (Date.now() > entry.lockedUntil && entry.lockedUntil !== 0) {
    failMap.delete(email); // lock expired
    return false;
  }
  return entry.count >= MAX_FAILURES && entry.lockedUntil > Date.now();
}

function clearFailures(email: string): void {
  failMap.delete(email);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    // ── Rate limiting: 5 auth attempts per IP per minute ──────────────────────
    const rl = checkRateLimit(`auth:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      logSecurityEvent("AUTH_RATE_LIMITED", ip);
      return NextResponse.json(
        { error: "Too many attempts. Please wait before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { mode } = body;
    if (!["signup", "signin"].includes(String(mode))) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // ── Sanitize + validate input ──────────────────────────────────────────────
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const email    = sanitizeEmail(rawEmail);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
    }

    const password   = sanitizePassword(body.password);
    const name       = sanitizeString(body.name, 100);
    const riskProfile = sanitizeString(body.riskProfile, 20) || "moderate";

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Password strength check on signup
    if (mode === "signup" && !isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and contain at least one number" },
        { status: 400 }
      );
    }

    // ── Brute-force check ──────────────────────────────────────────────────────
    if (isLocked(email)) {
      logSecurityEvent("AUTH_LOCKED", ip, `email=${email}`);
      return NextResponse.json(
        { error: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // ── User resolution (replace with Supabase query in production) ───────────
    // Simulate auth — in production this would query your DB and verify password hash
    const signInSuccess = true; // placeholder
    if (!signInSuccess) {
      recordFailure(email);
      logSecurityEvent("AUTH_FAILURE", ip, `email=${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Clear failure count on successful auth
    clearFailures(email);

    const user = {
      id:                 `user_${Buffer.from(email).toString("base64url").slice(0, 12)}`,
      name:               name || email.split("@")[0],
      email,
      riskProfile,
      plan:               "genius",
      botActive:          true,
      subscriptionStatus: mode === "signup" ? "trialing" : "active",
      trialEnds:          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // ── Issue HTTP-only session cookie ────────────────────────────────────────
    const res = NextResponse.json({
      user: {
        id:                 user.id,
        name:               user.name,
        email:              user.email,
        riskProfile:        user.riskProfile,
        botActive:          user.botActive,
        subscriptionStatus: user.subscriptionStatus,
        trialEnds:          user.trialEnds,
      },
    });

    // Secure cookie: HttpOnly, Secure, SameSite=strict, 7-day max age
    res.cookies.set("ggai_session", "", { maxAge: 0 }); // clear first
    setSessionCookie(res, {
      id:    user.id,
      email: user.email,
      name:  user.name,
      plan:  user.plan,
      iat:   Date.now(),
    });

    return res;

  } catch (err) {
    // Never expose stack traces to the client
    logSecurityEvent("AUTH_ERROR", ip, String(err instanceof Error ? err.message : err));
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// ── Sign out: clear the session cookie ────────────────────────────────────────
export async function DELETE() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("ggai_session", "", {
      httpOnly: true,
      secure:   true,
      sameSite: "strict",
      maxAge:   0,
      path:     "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Sign out failed" }, { status: 500 });
  }
}
