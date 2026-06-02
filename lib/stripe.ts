import crypto from "crypto";
import { isDbConnected, query } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { PlanId } from "@/lib/types";

export type BillingInterval = "monthly" | "yearly";

type StripeSession = {
  id: string;
  object: "checkout.session";
  status?: string;
  payment_status?: string;
  url?: string;
  amount_total?: number;
  currency?: string;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  client_reference_id?: string | null;
  subscription?: string | { id?: string } | null;
  payment_intent?: string | null;
  metadata?: Record<string, string>;
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const PAID_PLANS: PlanId[] = ["pro", "premium"];

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
}

export function isPaidPlan(plan: PlanId): plan is "pro" | "premium" {
  return PAID_PLANS.includes(plan);
}

export function getPlanPrice(planId: PlanId, billing: BillingInterval) {
  const plan = getPlan(planId);
  return billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
}

function stripeHeaders() {
  return {
    Authorization: `Bearer ${getStripeSecretKey()}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function getSubscriptionId(session: StripeSession) {
  if (!session.subscription) return session.id;
  return typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id || session.id;
}

export async function createCheckoutSession({
  origin,
  email,
  name,
  planId,
  billing,
}: {
  origin: string;
  email: string;
  name?: string;
  planId: PlanId;
  billing: BillingInterval;
}) {
  if (!isPaidPlan(planId)) {
    throw new Error("Only paid plans can create checkout sessions");
  }

  const amount = getPlanPrice(planId, billing);
  if (!amount || amount < 10) {
    throw new Error("Invalid checkout amount");
  }

  const plan = getPlan(planId);
  const interval = billing === "monthly" ? "month" : "year";
  const normalizedEmail = email.trim().toLowerCase();
  const successUrl = `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/pricing/cancel`;

  const body = new URLSearchParams({
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: normalizedEmail,
    client_reference_id: normalizedEmail,
    allow_promotion_codes: "true",
    "metadata[email]": normalizedEmail,
    "metadata[name]": name || normalizedEmail.split("@")[0] || "นักลงทุน",
    "metadata[plan]": planId,
    "metadata[billing]": billing,
    "subscription_data[metadata][email]": normalizedEmail,
    "subscription_data[metadata][name]": name || normalizedEmail.split("@")[0] || "นักลงทุน",
    "subscription_data[metadata][plan]": planId,
    "subscription_data[metadata][billing]": billing,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "thb",
    "line_items[0][price_data][unit_amount]": String(amount * 100),
    "line_items[0][price_data][recurring][interval]": interval,
    "line_items[0][price_data][product_data][name]": `ValuStock ${plan.name}`,
    "line_items[0][price_data][product_data][description]": plan.tagline,
  });

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: stripeHeaders(),
    body,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Stripe checkout session failed");
  }

  return payload as StripeSession;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const params = new URLSearchParams({
    "expand[]": "subscription",
  });
  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}?${params}`, {
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Stripe session retrieval failed");
  }

  return payload as StripeSession;
}

export async function syncStripeCheckoutSession(session: StripeSession) {
  const plan = session.metadata?.plan as PlanId | undefined;
  const billing = session.metadata?.billing as BillingInterval | undefined;
  const email = (
    session.metadata?.email ||
    session.customer_details?.email ||
    session.customer_email ||
    session.client_reference_id ||
    ""
  ).trim().toLowerCase();
  const name = session.metadata?.name || email.split("@")[0] || "นักลงทุน";

  if (!email || !plan || !billing || !isPaidPlan(plan)) {
    throw new Error("Stripe session metadata is incomplete");
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error("Stripe session is not paid yet");
  }

  const amount = typeof session.amount_total === "number"
    ? session.amount_total / 100
    : getPlanPrice(plan, billing);
  const transactionRef = getSubscriptionId(session);
  const connected = await isDbConnected();

  if (connected) {
    const existing = await query<any[]>(
      "SELECT id FROM payments WHERE transaction_ref = ? LIMIT 1",
      [transactionRef]
    );

    if (!existing.length) {
      await query(
        "INSERT INTO payments (user_email, amount, plan, billing, status, payment_method, transaction_ref) VALUES (?, ?, ?, ?, 'verified', 'stripe', ?)",
        [email, amount, plan, billing, transactionRef]
      );
    }

    await query(
      `INSERT INTO users (email, name, plan, billing)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), plan = VALUES(plan), billing = VALUES(billing)`,
      [email, name, plan, billing]
    );
  }

  return {
    email,
    name,
    plan,
    billing,
    amount,
    transactionRef,
    dbSynced: connected,
  };
}

export function verifyStripeWebhookSignature({
  payload,
  signatureHeader,
  secret,
}: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
}) {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, item) => {
    const [key, value] = item.split("=");
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] || []), value];
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return signatures.some((signature) => {
    const left = Buffer.from(signature, "hex");
    const right = Buffer.from(expected, "hex");
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  });
}
