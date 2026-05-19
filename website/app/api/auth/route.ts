import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizePassword, sanitizeString } from "@/lib/sanitize";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  // ── Rate limiting: 10 auth attempts per IP per 15 minutes ─────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);

  if (!rl.allowed) {
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

  // ── Parse + sanitize input ─────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { mode } = body;
  const email = sanitizeEmail(body.email);
  const password = sanitizePassword(body.password);
  const name = sanitizeString(body.name, 100);
  const riskProfile = sanitizeString(body.riskProfile, 20) || "moderate";

  if (!email) {
    return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!["signup", "signin"].includes(String(mode))) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  // ── User resolution (replace with Supabase query in production) ───────────
  const user = {
    id: `user_${Buffer.from(email).toString("base64url").slice(0, 12)}`,
    name: name || email.split("@")[0],
    email,
    riskProfile,
    plan: "genius",
    botActive: true,
    subscriptionStatus: mode === "signup" ? "trialing" : "active",
    trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // ── Issue HTTP-only session cookie ────────────────────────────────────────
  const res = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      riskProfile: user.riskProfile,
      botActive: user.botActive,
      subscriptionStatus: user.subscriptionStatus,
      trialEnds: user.trialEnds,
    },
  });

  setSessionCookie(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    iat: Date.now(),
  });

  return res;
}

// ── Sign out: clear the session cookie ────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ggai_session", "", { maxAge: 0, path: "/" });
  return res;
}
