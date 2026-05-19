import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(`✅ Checkout complete — customer: ${session.customer_email}, plan: ${session.metadata?.plan}`);
        // TODO: activate subscription in Supabase for session.customer_email
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log(`💰 Payment received — customer: ${(invoice as any).customer_email}, amount: $${((invoice as any).amount_paid / 100).toFixed(2)}`);
        // TODO: extend subscription period in Supabase
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.error(`❌ Payment failed — customer: ${(invoice as any).customer_email}`);
        // TODO: send dunning email, flag account in Supabase
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        console.log(`🔄 Subscription updated — status: ${(sub as any).status}, customer: ${(sub as any).customer}`);
        // TODO: update subscription status in Supabase
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        console.log(`🚫 Subscription cancelled — customer: ${(sub as any).customer}`);
        // TODO: deactivate account in Supabase, turn off bot
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
