import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Map plan slugs → Stripe price IDs (set each in Vercel env vars)
const PRICE_IDS: Record<string, string | undefined> = {
  analyst: process.env.STRIPE_PRICE_ANALYST,
  genius:  process.env.STRIPE_PRICE_GENIUS,
  elite:   process.env.STRIPE_PRICE_ELITE,
};

export async function POST(req: NextRequest) {
  // ── Rate limiting: 5 checkout attempts per IP per hour ───────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`subscribe:${ip}`, 5, 60 * 60 * 1000);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // ── Parse + sanitize ──────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = sanitizeEmail(body.email);
  const name  = sanitizeString(body.name, 100);
  const plan  = sanitizeString(body.plan, 20) || "genius";

  if (!email) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!["analyst", "genius", "elite"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // ── Optional: verify session cookie to associate checkout with real user ──
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const session = sessionToken ? verifySessionToken(sessionToken) : null;
  const customerEmail = session?.email || email;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId   = PRICE_IDS[plan];

  // If Stripe isn't configured yet, fall through to dashboard
  if (!stripeKey || !priceId) {
    return NextResponse.json({ url: "/dashboard?subscribed=true", mock: true });
  }

  const stripe = require("stripe")(stripeKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://greengeniusai.app";

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${siteUrl}/dashboard?subscribed=true&plan=${plan}`,
    cancel_url:  `${siteUrl}/checkout?plan=${plan}&cancelled=true`,
    metadata: { name, plan, userId: session?.id ?? "" },
    // Collect billing address for fraud prevention
    billing_address_collection: "auto",
    // Require phone for high-value plans (extra identity verification)
    phone_number_collection: { enabled: plan === "elite" },
  });

  return NextResponse.json({ url: stripeSession.url });
}
