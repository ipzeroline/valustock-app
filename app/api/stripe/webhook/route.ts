import { NextResponse } from "next/server";
import {
  retrieveCheckoutSession,
  syncStripeCheckoutSession,
  verifyStripeWebhookSignature,
} from "@/lib/stripe";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const signatureHeader = req.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature({ payload, signatureHeader, secret: webhookSecret })) {
    return NextResponse.json({ error: "Invalid Stripe webhook signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      const sessionId = event.data?.object?.id;
      if (sessionId) {
        const session = await retrieveCheckoutSession(sessionId);
        await syncStripeCheckoutSession(session);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
