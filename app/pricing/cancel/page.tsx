"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import { AlertTriangle, ArrowRight } from "@/lib/icons";

export default function StripeCancelPage() {
  const { lang } = useTranslation();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center px-5 py-14">
      <Card className="w-full border-line bg-surface p-7 text-center shadow-card">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold/10 text-gold">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">
          {lang === "th" ? "ยังไม่ได้ชำระเงิน" : "Checkout Cancelled"}
        </h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
          {lang === "th"
            ? "คุณยกเลิกขั้นตอนชำระเงิน ยังไม่มีการอัปเกรดแพ็กเกจหรือหักเงิน"
            : "No payment was taken and your plan has not changed."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/pricing" className="flex-1">
            <Button size="lg" className="w-full">
              {lang === "th" ? "เลือกแพ็กเกจอีกครั้ง" : "Choose a Plan"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button size="lg" variant="outline" className="w-full">
              Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
