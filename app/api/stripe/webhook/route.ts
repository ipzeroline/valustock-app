import { NextResponse } from "next/server";
import {
  retrieveCheckoutSession,
  syncStripeCheckoutSession,
  verifyStripeWebhookSignature,
} from "@/lib/stripe";
import { sendTelegramMessage } from "@/lib/telegram";

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
        const result = await syncStripeCheckoutSession(session);

        sendTelegramMessage({
          text: `💰 <b>ผู้ใช้สมัครแพ็กเกจพรีเมียม (Stripe)</b>\n\n👤 ชื่อ: ${result.name}\n✉️ อีเมล: ${result.email}\n🏷️ แพ็กเกจ: ${result.plan.toUpperCase()} (${result.billing})\n💵 ยอดเงิน: ฿${result.amount.toLocaleString()}\n🔢 Ref: <code>${result.transactionRef}</code>\n📅 เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} น.`,
        }).catch((err) => {
          console.error("Failed to send Stripe Telegram notification:", err);
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
