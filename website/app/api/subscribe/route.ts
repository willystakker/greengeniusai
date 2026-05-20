import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

const PRICE_IDS: Record<string, string | undefined> = {
  analyst: process.env.STRIPE_PRICE_ANALYST,
  genius:  process.env.STRIPE_PRICE_GENIUS,
  elite:   process.env.STRIPE_PRICE_ELITE,
};

export async function POST(req: NextRequest) {
  // Rate limit: 5 checkout attempts per IP per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`subscribe:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email       = sanitizeEmail(body.email);
  const name        = sanitizeString(body.name, 100);
  const plan        = sanitizeString(body.plan, 20) || "genius";
  const discountPct = typeof body.discountPct === "number"
    ? Math.min(100, Math.max(0, Math.round(body.discountPct)))
    : 0;

  if (!email) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  if (!["analyst", "genius", "elite"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const session = sessionToken ? verifySessionToken(sessionToken) : null;
  const customerEmail = session?.email || email;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId   = PRICE_IDS[plan];

  if (!stripeKey || !priceId) {
    // Stripe not yet configured — send straight to onboarding
    return NextResponse.json({ url: `/onboarding?plan=${plan}&mock=true` });
  }

  try {
    const stripe = new Stripe(stripeKey);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://greengeniusai.app";

    // Build optional discount: create a one-time coupon on the fly if discount was earned via spin wheel
    let discounts: { coupon: string }[] | undefined;
    if (discountPct > 0) {
      const coupon = await stripe.coupons.create({
        percent_off: discountPct,
        duration: "once",
        name: `Spin Wheel ${discountPct}% Off`,
      });
      discounts = [{ coupon: coupon.id }];
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: discountPct > 0 ? 0 : 7 },
      ...(discounts ? { discounts } : {}),
      success_url: `${siteUrl}/onboarding?plan=${plan}&subscribed=true`,
      cancel_url:  `${siteUrl}/checkout?plan=${plan}&cancelled=true`,
      metadata: { name, plan, userId: session?.id ?? "", discountPct: String(discountPct) },
      billing_address_collection: "auto",
      phone_number_collection: { enabled: plan === "elite" },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (err: any) {
    console.error("Stripe error:", err?.message);
    return NextResponse.json({ error: "Payment system error. Please try again." }, { status: 500 });
  }
}
