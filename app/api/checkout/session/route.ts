import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { PlanId } from "@/lib/types";

function getOrigin(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  if (protocol === "http") return `${protocol}://${host}`;

  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");

  return `${protocol}://${host}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = body.plan as PlanId;
    const billing = plan === "lifetime" || body.billing === "lifetime"
      ? "lifetime"
      : body.billing === "yearly"
        ? "yearly"
        : "monthly";
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const session = await createCheckoutSession({
      origin: getOrigin(req),
      email,
      name,
      planId: plan,
      billing,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Stripe checkout session error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unable to start Stripe Checkout" },
      { status: 500 }
    );
  }
}
