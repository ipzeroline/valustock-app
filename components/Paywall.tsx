"use client";
import Link from "next/link";
import { PlanId } from "@/lib/types";
import { Lock, Crown } from "@/lib/icons";
import { Button } from "./ui/Button";
import { useTranslation } from "@/lib/translations";
import { PLAN_TRANS } from "./PlanCard";

export function LockedCard({
  required,
  title,
  desc,
}: {
  required: PlanId;
  title: string;
  desc: string;
}) {
  const { lang } = useTranslation();
  const planName = PLAN_TRANS[lang || "th"][required].name;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
      <div className="absolute inset-0 grid-lines opacity-40" />
      <div className="relative">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold">
          <Lock className="h-5 w-5" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{desc}</p>
        <Link href="/pricing">
          <Button variant="gold" className="mt-5">
            <Crown className="h-4 w-4" /> {lang === "th" ? `อัปเกรดเป็น ${planName}` : `Upgrade to ${planName} Plan`}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function InlineLock({ required }: { required: PlanId }) {
  const { lang } = useTranslation();
  const planName = PLAN_TRANS[lang || "th"][required].name;

  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold"
    >
      <Lock className="h-3 w-3" /> {planName}
    </Link>
  );
}
