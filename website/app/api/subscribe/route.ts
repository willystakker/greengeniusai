import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  // If Stripe isn't configured yet, return a mock checkout URL
  if (!stripeKey || !priceId) {
    return NextResponse.json({
      url: "/dashboard?subscribed=true",
      mock: true,
    });
  }

  // Real Stripe checkout session
  const stripe = require("stripe")(stripeKey);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout?cancelled=true`,
    metadata: { name },
  });

  return NextResponse.json({ url: session.url });
}
