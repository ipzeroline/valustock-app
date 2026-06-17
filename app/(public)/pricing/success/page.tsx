"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PLAN_TRANS } from "@/components/PlanCard";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";
import { CheckCircle, Crown, AlertTriangle, ArrowRight } from "@/lib/icons";
import { PlanId } from "@/lib/types";

function SuccessContent() {
  const params = useSearchParams();
  const { user, login } = useStore();
  const { lang } = useTranslation();
  const sessionId = params.get("session_id");
  const called = useRef(false);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!sessionId) {
      setState("error");
      setMessage(lang === "th" ? "ไม่พบรหัสรายการชำระเงิน" : "Checkout session was not found.");
      return;
    }

    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, email: user?.email }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.success) {
          throw new Error(data.error || "Unable to verify payment");
        }

        login(data.email, data.name, data.plan, data.billing);
        setPlanName(PLAN_TRANS[lang][data.plan as PlanId].name);
        setMessage(
          data.dbSynced
            ? (lang === "th" ? "ระบบบันทึกการชำระเงินและอัปเกรดบัญชีแล้ว" : "Payment recorded and your account is upgraded.")
            : (lang === "th" ? "ชำระเงินสำเร็จ แต่ฐานข้อมูลยังเชื่อมต่อไม่ได้ ระบบจะปลดล็อกบนเครื่องนี้ก่อน" : "Payment succeeded, but the database is offline. Access is unlocked locally for now.")
        );
        setState("success");
      })
      .catch((err) => {
        setState("error");
        setMessage(err.message || (lang === "th" ? "ตรวจสอบการชำระเงินไม่สำเร็จ" : "Payment verification failed."));
      });
  }, [lang, login, sessionId, user?.email]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center px-5 py-14">
      <Card className="w-full border-line bg-surface p-7 text-center shadow-card">
        {state === "loading" ? (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Crown className="h-8 w-8 animate-pulse" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
              {lang === "th" ? "กำลังตรวจสอบการชำระเงิน..." : "Verifying payment..."}
            </h1>
            <p className="mt-2 text-sm font-semibold text-muted">
              {lang === "th" ? "รอสักครู่ ระบบกำลังยืนยันกับ Stripe" : "Please wait while Stripe confirms your checkout."}
            </p>
          </>
        ) : state === "success" ? (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-8 w-8" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
              {lang === "th" ? `อัปเกรดเป็น ${planName} แล้ว` : `${planName} Activated`}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{message}</p>
            <Link href="/dashboard" className="mt-6 block">
              <Button size="lg" className="w-full">
                {lang === "th" ? "ไปที่ Dashboard" : "Go to Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-8 w-8" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
              {lang === "th" ? "ตรวจสอบไม่สำเร็จ" : "Verification Failed"}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">{message}</p>
            <Link href="/pricing" className="mt-6 block">
              <Button size="lg" variant="outline" className="w-full">
                {lang === "th" ? "กลับไปหน้าแพ็กเกจ" : "Back to Pricing"}
              </Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
