"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, useCurrentPlan } from "@/lib/store";
import { useTranslation } from "@/lib/translations";
import {
  LineChart,
  Search,
  Star,
  Layers,
  Crown,
  User,
  Sun,
  Moon,
  Menu,
  X,
  BarChart3,
  LogOut,
  Sparkles,
  Shield,
  Wallet,
  Mail,
  MessageSquare,
} from "@/lib/icons";
import { Button } from "./ui/Button";

const MARKETING = ["/", "/about", "/pricing", "/login", "/contact", "/member-reviews"];
function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-bg shadow-[0_6px_20px_-8px_rgb(var(--brand))]">
        <LineChart className="h-5 w-5" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight">
          Valu<span className="text-brand">Stock</span>
        </span>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useStore();
  const { t } = useTranslation();
  return (
    <button
      onClick={toggleTheme}
      aria-label={t("common.toggleTheme")}
      title={t("common.toggleTheme")}
      className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted transition hover:text-ink"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5" />
      ) : (
        <Moon className="h-4.5 w-4.5" />
      )}
    </button>
  );
}

function LangToggle() {
  const { lang, toggleLang } = useStore();
  return (
    <button
      onClick={toggleLang}
      className="flex h-10 px-3 items-center justify-center rounded-xl border border-line text-xs font-bold text-muted transition hover:text-ink hover:bg-elevate whitespace-nowrap"
    >
      {lang === "th" ? "EN" : "TH"}
    </button>
  );
}

function MarketingHeader() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const { t, lang } = useTranslation();
  const pricingLabel =
    user?.plan === "lifetime" || user?.billing === "lifetime"
      ? lang === "th"
        ? "สถานะสมาชิก"
        : "Membership"
      : t("common.pricing");
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#features" className="hover:text-ink">{t("common.features")}</Link>
          <Link href="/stocks" className="hover:text-ink">{t("common.searchStocks")}</Link>
          <Link href="/member-reviews" className="hover:text-ink">{lang === "th" ? "รีวิวจากสมาชิก" : "Member Reviews"}</Link>
          <Link href="/about" className="hover:text-ink">{lang === "th" ? "เกี่ยวกับเรา" : "About"}</Link>
          <Link href="/pricing" className="hover:text-ink">{pricingLabel}</Link>
          <Link href="/contact" className="hover:text-ink">ติดต่อทีมงาน</Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <LangToggle />
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">{t("common.dashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">{t("common.logIn")}</Button>
              </Link>
              <Link href="/pricing">
                <Button size="sm">{t("common.startFree")}</Button>
              </Link>
            </>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-line md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="เมนู"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line px-5 py-3 md:hidden">
          <div className="flex flex-col gap-1 text-sm">
            <Link href="/#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{t("common.features")}</Link>
            <Link href="/stocks" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{t("common.searchStocks")}</Link>
            <Link href="/member-reviews" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{lang === "th" ? "รีวิวจากสมาชิก" : "Member Reviews"}</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{lang === "th" ? "เกี่ยวกับเรา" : "About"}</Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{pricingLabel}</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">ติดต่อทีมงาน</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{t("common.logIn")}</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const { lang } = useTranslation();
  const year = new Date().getFullYear();
  const groups = [
    {
      title: lang === "th" ? "เครื่องมือวิเคราะห์หุ้น" : "Stock Tools",
      links: [
        { href: "/stocks", label: lang === "th" ? "โปรแกรมคัดกรองหุ้น" : "Stock Screener" },
        { href: "/undervalued-stocks", label: lang === "th" ? "หุ้น Undervalue" : "Undervalued Stocks" },
        { href: "/dividend-stocks", label: lang === "th" ? "หุ้นปันผลสูง" : "Dividend Stocks" },
        { href: "/dcf-calculator", label: "DCF Calculator" },
        { href: "/compare", label: lang === "th" ? "เปรียบเทียบหุ้น" : "Compare Stocks" },
      ],
    },
    {
      title: lang === "th" ? "บทความ SEO ยอดนิยม" : "Popular Research",
      links: [
        { href: "/blog/best-stocks-to-buy-thailand-2026", label: lang === "th" ? "หุ้นตัวไหนดี 2569" : "Best Thai Stocks 2026" },
        { href: "/blog/high-dividend-stocks-thailand-2026", label: lang === "th" ? "หุ้นปันผลสูง 2569" : "High Dividend Stocks" },
        { href: "/blog/tisco-stock-worth-buying", label: "TISCO" },
        { href: "/blog/kbank-stock-worth-buying", label: "KBANK" },
        { href: "/blog/pttep-stock-worth-buying", label: "PTTEP" },
      ],
    },
    {
      title: lang === "th" ? "หุ้นอเมริกาและ ETF" : "US Stocks & ETFs",
      links: [
        { href: "/blog/how-to-invest-sp500-thailand", label: "S&P 500" },
        { href: "/blog/how-to-invest-nasdaq-thailand", label: "Nasdaq" },
        { href: "/blog/how-to-buy-nasdaq-100-etf", label: "Nasdaq-100 ETF" },
        { href: "/stocks/spy", label: "SPY" },
        { href: "/stocks/qqq", label: "QQQ" },
      ],
    },
    {
      title: lang === "th" ? "บริษัทและความปลอดภัย" : "Company & Trust",
      links: [
        { href: "/about", label: lang === "th" ? "เกี่ยวกับ ValuStock" : "About ValuStock" },
        { href: "/member-reviews", label: lang === "th" ? "รีวิวจากสมาชิก" : "Member Reviews" },
        { href: "/methodology", label: lang === "th" ? "วิธีคำนวณมูลค่า" : "Methodology" },
        { href: "/disclaimer", label: lang === "th" ? "ข้อปฏิเสธความรับผิด" : "Disclaimer" },
        { href: "/privacy", label: lang === "th" ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy" },
        { href: "/contact", label: lang === "th" ? "ติดต่อทีมงาน" : "Contact" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-xs font-semibold leading-relaxed text-muted">
              {lang === "th"
                ? "ValuStock คือเครื่องมือวิเคราะห์หุ้นสำหรับนักลงทุนไทย ช่วยประเมินมูลค่าหุ้นไทย หุ้นอเมริกา ETF ด้วย DCF, Fair Value, Margin of Safety และหุ้นปันผลสูง"
                : "ValuStock helps Thai investors analyze Thai stocks, U.S. stocks, ETFs, DCF, fair value, margin of safety and dividend opportunities."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["DCF", "Fair Value", "Undervalue", "Dividend", "ETF"].map((item) => (
                <span key={item} className="rounded-full border border-line bg-bg px-2.5 py-1 text-[10px] font-bold text-muted">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="font-display text-sm font-black text-ink">{group.title}</h2>
                <div className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className="block text-xs font-semibold text-muted hover:text-brand">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-5 text-[11px] font-semibold leading-relaxed text-muted">
          <p>
            {lang === "th"
              ? "ข้อมูลบน ValuStock จัดทำเพื่อการศึกษาและการวิเคราะห์เท่านั้น ไม่ใช่คำแนะนำซื้อ ขาย หรือถือหลักทรัพย์ นักลงทุนควรตรวจสอบข้อมูลล่าสุดและประเมินความเสี่ยงด้วยตนเองก่อนตัดสินใจลงทุน"
              : "ValuStock content is for education and research only. It is not personalized investment advice. Investors should verify current data and assess risk before making decisions."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© {year} ValuStock</span>
            <Link href="/terms" className="hover:text-brand">{lang === "th" ? "เงื่อนไข" : "Terms"}</Link>
            <Link href="/privacy" className="hover:text-brand">{lang === "th" ? "ความเป็นส่วนตัว" : "Privacy"}</Link>
            <Link href="/disclaimer" className="hover:text-brand">{lang === "th" ? "ข้อชี้แจง" : "Disclaimer"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: BarChart3 },
  { href: "/stocks", key: "searchStocks", icon: Search },
  { href: "/portfolio", key: "portfolio", icon: Wallet },
  { href: "/insights", key: "insights", icon: Sparkles },
  { href: "/watchlist", key: "watchlist", icon: Star },
  { href: "/reviews", icon: MessageSquare, labelTh: "เขียนรีวิว", labelEn: "Write Review" },
  { href: "/compare", key: "compare", icon: Layers },
  { href: "/pricing", key: "pricing", icon: Crown },
  { href: "/contact", key: "contact", icon: Mail },
  { href: "/account", key: "account", icon: User },
];

function AppSidebar({ pathname }: { pathname: string }) {
  const plan = useCurrentPlan();
  const { t, lang } = useTranslation();
  const pricingLabel = plan.id === "lifetime" ? (lang === "th" ? "สถานะสมาชิก" : "Membership") : t("common.pricing");
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-elevate hover:text-ink"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.href === "/pricing" ? pricingLabel : "key" in item ? t(`common.${item.key}`) : lang === "th" ? item.labelTh : item.labelEn}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl border border-line bg-elevate p-3.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Crown className="h-3.5 w-3.5 text-gold" /> {t("common.currentPlan")}
        </div>
        <div className="mt-1 font-display font-semibold">{plan.name}</div>
        {plan.id !== "premium" && plan.id !== "lifetime" && (
          <Link href="/pricing">
            <Button variant="gold" size="sm" className="mt-3 w-full">
              {t("common.upgrade")}
            </Button>
          </Link>
        )}
      </div>
      <div className="mt-4 px-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted font-bold tracking-tight">
        <Link href="/methodology" className="hover:text-brand transition">{lang === "th" ? "สูตรคำนวณ" : "Methodology"}</Link>
        <span>•</span>
        <Link href="/disclaimer" className="hover:text-brand transition">{lang === "th" ? "ข้อชี้แจง" : "Disclaimer"}</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-brand transition">{lang === "th" ? "ส่วนตัว" : "Privacy"}</Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-brand transition">{lang === "th" ? "เงื่อนไข" : "Terms"}</Link>
        <span>•</span>
        <Link href="/contact" className="hover:text-brand transition">{lang === "th" ? "ติดต่อ" : "Contact"}</Link>
      </div>
    </aside>
  );
}

function AppMobileNav({ pathname }: { pathname: string }) {
  const { t, lang } = useTranslation();
  const items = [NAV[0], NAV[1], NAV[2], NAV[5], NAV[9]]; // Dashboard, Search, Portfolio, Reviews, Account
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-2.5 text-xs ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <Icon className="h-5 w-5" />
            {"key" in item ? t(`common.${item.key}`) : lang === "th" ? item.labelTh : item.labelEn}
          </Link>
        );
      })}
    </nav>
  );
}

function AppTopbar() {
  const { user, logout } = useStore();
  const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/80 px-3 backdrop-blur-xl sm:px-5 lg:px-8">
      <div className="shrink-0 lg:hidden">
        <Logo />
      </div>
      <div className="hidden lg:block" />
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <LangToggle />
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl border border-line px-2 py-2 sm:gap-2.5 sm:px-3"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm font-medium sm:block">
                {user.name}
              </span>
            </Link>
            <button
              onClick={logout}
              aria-label={t("common.logOut")}
              title={t("common.logOut")}
              className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted hover:text-down"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link href="/login">
            <Button size="sm">{t("common.logIn")}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  // Completely isolate surfaces that should not inherit the member web shell.
  if (pathname.startsWith("/AdminConsole") || pathname.startsWith("/telegram")) {
    return <>{children}</>;
  }

  const isMarketing = MARKETING.includes(pathname);

  if (isMarketing) {
    return (
      <div className="min-h-screen">
        <MarketingHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden px-3 pb-24 pt-5 sm:px-5 sm:pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
        <AppMobileNav pathname={pathname} />
      </div>
    </div>
  );
}
