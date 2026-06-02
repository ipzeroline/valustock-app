"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import {
  Mail,
  Shield,
  Sparkles,
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Calculator,
  Wallet,
} from "@/lib/icons";

const SUPPORT_EMAIL = "support.valustock@gmail.com";

export default function ContactPage() {
  const { lang } = useTranslation();
  const mailSubject = encodeURIComponent(lang === "th" ? "สอบถามการใช้งาน ValuStock" : "ValuStock Support Inquiry");
  const mailBody = encodeURIComponent(
    lang === "th"
      ? "สวัสดีทีมงาน ValuStock,\n\nต้องการสอบถามเรื่อง:\n\nอีเมลบัญชีที่ใช้งาน:\nหน้าที่พบปัญหา:\nรายละเอียดเพิ่มเติม:\n"
      : "Hello ValuStock Team,\n\nI would like to ask about:\n\nAccount email:\nPage or feature:\nDetails:\n"
  );
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "ติดต่อทีมงาน ValuStock",
      url: "https://valustock.com/contact",
      description:
        "ช่องทางติดต่อทีมงาน ValuStock สำหรับคำถามเกี่ยวกับเครื่องมือวิเคราะห์หุ้น DCF Calculator, Stock Screener, Portfolio Tracker และการชำระเงิน",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ValuStock",
      url: "https://valustock.com",
      email: SUPPORT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        email: SUPPORT_EMAIL,
        contactType: "customer support",
        availableLanguage: ["Thai", "English"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "ติดต่อทีมงาน ValuStock ได้ที่ไหน?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `สามารถติดต่อทีมงาน ValuStock ได้ที่อีเมล ${SUPPORT_EMAIL}`,
          },
        },
        {
          "@type": "Question",
          name: "ValuStock support ช่วยเรื่องอะไรได้บ้าง?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ทีมงานช่วยตอบคำถามเรื่องการใช้งาน DCF Calculator, Stock Screener, Portfolio Tracker, Watchlist, แพ็กเกจสมาชิก และการชำระเงิน",
          },
        },
      ],
    },
  ];

  const supportTopics = [
    {
      icon: Calculator,
      title: lang === "th" ? "เครื่องมือประเมินมูลค่าหุ้น" : "Valuation Tools",
      desc:
        lang === "th"
          ? "สอบถามการใช้งาน DCF Calculator, Intrinsic Value, Graham Number และ Margin of Safety"
          : "Questions about DCF Calculator, Intrinsic Value, Graham Number, and Margin of Safety.",
    },
    {
      icon: Wallet,
      title: lang === "th" ? "พอร์ตลงทุนและ Watchlist" : "Portfolio & Watchlist",
      desc:
        lang === "th"
          ? "แจ้งปัญหาการบันทึกพอร์ต รายการซื้อขาย แจ้งเตือนราคา หรือชุดเปรียบเทียบหุ้น"
          : "Help with portfolio records, transactions, price alerts, watchlists, or comparison sets.",
    },
    {
      icon: Shield,
      title: lang === "th" ? "สมาชิกและการชำระเงิน" : "Membership & Billing",
      desc:
        lang === "th"
          ? "สอบถามแพ็กเกจ Pro, Premium, Lifetime, Stripe Checkout และสถานะบัญชีสมาชิก"
          : "Support for Pro, Premium, Lifetime, Stripe Checkout, and account status.",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="space-y-6">
          <div>
            <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold">
              <Mail className="h-3.5 w-3.5" />
              {lang === "th" ? "ติดต่อทีมงาน ValuStock" : "Contact ValuStock Support"}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-ink md:text-5xl">
              {lang === "th" ? "ติดต่อสอบถามทีมงาน ValuStock" : "Contact the ValuStock Team"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-muted md:text-base">
              {lang === "th"
                ? "หากมีคำถามเกี่ยวกับการใช้งานระบบวิเคราะห์หุ้น เครื่องมือคำนวณ DCF การบันทึกพอร์ต แพ็กเกจสมาชิก หรือการชำระเงิน ส่งอีเมลถึงทีมงานได้โดยตรง"
                : "Questions about stock valuation tools, DCF workflows, portfolio tracking, membership plans, or billing can be sent directly to our support team."}
            </p>
          </div>

          <Card className="border border-line bg-surface/40 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wide text-muted">
                  {lang === "th" ? "อีเมลฝ่ายสนับสนุน" : "Support Email"}
                </div>
                <a
                  href={mailto}
                  className="mt-1 block break-all font-display text-xl font-black text-brand hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">
                  {lang === "th"
                    ? "แนะนำให้แนบอีเมลบัญชีที่ใช้งาน ลิงก์หน้าที่พบปัญหา และภาพหน้าจอถ้ามี เพื่อให้ทีมงานตรวจสอบได้เร็วขึ้น"
                    : "Include your account email, affected page URL, and screenshots if available so the team can investigate faster."}
                </p>
              </div>
              <a href={mailto} className="shrink-0">
                <Button size="lg" className="w-full sm:w-auto">
                  <Mail className="h-4 w-4" />
                  {lang === "th" ? "ส่งอีเมล" : "Send Email"}
                </Button>
              </a>
            </div>
          </Card>

          <section className="grid gap-4 md:grid-cols-3">
            {supportTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <Card key={topic.title} className="border border-line bg-surface/35 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-display text-base font-black text-ink">{topic.title}</h2>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{topic.desc}</p>
                </Card>
              );
            })}
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-black text-ink">
                  {lang === "th" ? "ข้อมูลที่ควรแนบมา" : "What to Include"}
                </h2>
                <p className="text-xs font-semibold text-muted">
                  {lang === "th" ? "ช่วยให้ตรวจสอบเร็วและตรงจุด" : "Helps us respond accurately."}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                lang === "th" ? "อีเมลบัญชี ValuStock ที่ใช้งาน" : "Your ValuStock account email",
                lang === "th" ? "หน้าหรือฟีเจอร์ที่ต้องการสอบถาม" : "The page or feature involved",
                lang === "th" ? "รายละเอียดปัญหาและขั้นตอนที่ทำก่อนพบปัญหา" : "Issue details and steps before it happened",
                lang === "th" ? "ภาพหน้าจอหรือไฟล์ประกอบถ้ามี" : "Screenshots or supporting files if available",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-muted">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border border-line bg-elevate/35 p-5">
            <div className="flex items-center gap-2 font-display text-sm font-black text-ink">
              <FileText className="h-4.5 w-4.5 text-brand" />
              {lang === "th" ? "ลิงก์ช่วยเหลือที่เกี่ยวข้อง" : "Helpful Links"}
            </div>
            <div className="mt-4 space-y-2">
              {[
                { href: "/methodology", label: lang === "th" ? "สูตรและวิธีคำนวณ" : "Valuation Methodology" },
                { href: "/pricing", label: lang === "th" ? "แพ็กเกจและราคา" : "Plans and Pricing" },
                { href: "/privacy", label: lang === "th" ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy" },
                { href: "/disclaimer", label: lang === "th" ? "ข้อชี้แจงการลงทุน" : "Investment Disclaimer" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </Card>

          <div className="rounded-xl border border-line bg-surface/35 px-4 py-3 text-[11px] font-semibold leading-relaxed text-muted">
            <Sparkles className="mr-1 inline h-3.5 w-3.5 text-brand" />
            {lang === "th"
              ? "ValuStock เป็นเครื่องมือช่วยวิเคราะห์และเรียนรู้ ไม่ใช่บริการให้คำแนะนำการลงทุนเฉพาะบุคคล"
              : "ValuStock is a research and education tool, not personalized investment advice."}
          </div>
        </aside>
      </section>
    </main>
  );
}
