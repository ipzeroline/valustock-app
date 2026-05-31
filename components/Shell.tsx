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
} from "@/lib/icons";
import { Button } from "./ui/Button";

const MARKETING = ["/", "/pricing", "/login"];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
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
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#features" className="hover:text-ink">{t("common.features")}</Link>
          <Link href="/stocks" className="hover:text-ink">{t("common.searchStocks")}</Link>
          <Link href="/pricing" className="hover:text-ink">{t("common.pricing")}</Link>
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
            <Link href="/pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{t("common.pricing")}</Link>
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-elevate">{t("common.logIn")}</Link>
          </div>
        </div>
      )}
    </header>
  );
}

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: BarChart3 },
  { href: "/stocks", key: "searchStocks", icon: Search },
  { href: "/portfolio", key: "portfolio", icon: Wallet },
  { href: "/insights", key: "insights", icon: Sparkles },
  { href: "/watchlist", key: "watchlist", icon: Star },
  { href: "/compare", key: "compare", icon: Layers },
  { href: "/pricing", key: "pricing", icon: Crown },
  { href: "/account", key: "account", icon: User },
];

function AppSidebar({ pathname }: { pathname: string }) {
  const plan = useCurrentPlan();
  const { t } = useTranslation();
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
              {t(`common.${item.key}`)}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl border border-line bg-elevate p-3.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Crown className="h-3.5 w-3.5 text-gold" /> {t("common.currentPlan")}
        </div>
        <div className="mt-1 font-display font-semibold">{plan.name}</div>
        {plan.id !== "premium" && (
          <Link href="/pricing">
            <Button variant="gold" size="sm" className="mt-3 w-full">
              {t("common.upgrade")}
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}

function AppMobileNav({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  const items = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[6]]; // Dashboard, Search, Insights, Watchlist, Account
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
            {t(`common.${item.key}`)}
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
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/80 px-5 backdrop-blur-xl lg:px-8">
      <div className="lg:hidden">
        <Logo compact />
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2.5">
        <LangToggle />
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2.5">
            <Link
              href="/account"
              className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2"
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

  // Completely isolate and bypass the client member shell for the Admin Console
  if (pathname.startsWith("/AdminConsole")) {
    return <>{children}</>;
  }

  const isMarketing = MARKETING.includes(pathname);

  if (isMarketing) {
    return (
      <div className="min-h-screen">
        <MarketingHeader />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 px-5 pb-24 pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
        <AppMobileNav pathname={pathname} />
      </div>
    </div>
  );
}
