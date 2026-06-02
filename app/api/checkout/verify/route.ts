import { NextResponse } from "next/server";
import { retrieveCheckoutSession, syncStripeCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { sessionId, email } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Stripe session ID is required" }, { status: 400 });
    }

    const session = await retrieveCheckoutSession(sessionId);
    const synced = await syncStripeCheckoutSession(session);
    const requestedEmail = String(email || "").trim().toLowerCase();

    if (requestedEmail && requestedEmail !== synced.email) {
      return NextResponse.json({ error: "Checkout session belongs to another email" }, { status: 403 });
    }

    return NextResponse.json({ success: true, ...synced });
  } catch (err: any) {
    console.error("Stripe checkout verify error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unable to verify Stripe Checkout" },
      { status: 500 }
    );
  }
}
