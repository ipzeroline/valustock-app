"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore, useCurrentPlan } from "@/lib/store";
import { PLANS } from "@/lib/plans";
import { num } from "@/lib/format";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { PLAN_TRANS } from "@/components/PlanCard";
import {
  Crown,
  User,
  Sun,
  Moon,
  LogOut,
  Check,
  Bell,
  Download,
  Shield,
  MessageSquare,
  Key,
} from "@/lib/icons";

type TelegramState = {
  connected: boolean;
  status: string;
  telegramUsername: string | null;
  chatIdMask: string | null;
  notificationsEnabled: boolean;
  connectedAt: string | null;
  lastTestAt: string | null;
  botUsername: string | null;
};

type TelegramConnectCode = {
  code: string;
  command: string;
  deepLink: string;
  botUsername: string;
  expiresInSeconds: number;
};

export default function AccountPage() {
  const { user, authToken, logout, theme, toggleTheme, setPlan } = useStore();
  const plan = useCurrentPlan();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const showLocalPlanControls = process.env.NODE_ENV !== "production";
  const [telegram, setTelegram] = useState<TelegramState | null>(null);
  const [telegramCode, setTelegramCode] = useState<TelegramConnectCode | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState("");

  const loadTelegram = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/account/telegram", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load Telegram status");
      setTelegram(data.telegram);
      if (data.telegram?.connected) setTelegramCode(null);
    } catch (err) {
      setTelegramMessage(err instanceof Error ? err.message : "Unable to load Telegram status");
    }
  };

  useEffect(() => {
    if (!user?.email || !authToken) return;
    loadTelegram();
  }, [user?.email, authToken]);

  useEffect(() => {
    if (!telegramCode || telegram?.connected || !authToken) return;
    const timer = window.setInterval(loadTelegram, 5000);
    return () => window.clearInterval(timer);
  }, [telegramCode, telegram?.connected, authToken]);

  const startTelegramConnect = async () => {
    if (!authToken) return;
    setTelegramLoading(true);
    setTelegramMessage("");
    try {
      const res = await fetch("/api/account/telegram/connect-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to create Telegram code");
      setTelegramCode(data);
      setTelegramMessage(lang === "th" ? "สร้างโค้ดแล้ว ส่งคำสั่งนี้ให้ Telegram Bot ภายใน 10 นาที" : "Code created. Send the command to the Telegram Bot within 10 minutes.");
    } catch (err) {
      setTelegramMessage(err instanceof Error ? err.message : "Unable to create Telegram code");
    } finally {
      setTelegramLoading(false);
    }
  };

  const copyTelegramCommand = async () => {
    if (!telegramCode?.command) return;
    await navigator.clipboard.writeText(telegramCode.command).catch(() => undefined);
    setTelegramMessage(lang === "th" ? "คัดลอกคำสั่งแล้ว" : "Command copied.");
  };

  const testTelegram = async () => {
    if (!authToken) return;
    setTelegramLoading(true);
    setTelegramMessage("");
    try {
      const res = await fetch("/api/account/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Telegram test failed");
      setTelegramMessage(lang === "th" ? "ส่งข้อความทดสอบเข้า Telegram แล้ว" : "Telegram test message sent.");
      await loadTelegram();
    } catch (err) {
      setTelegramMessage(err instanceof Error ? err.message : "Telegram test failed");
    } finally {
      setTelegramLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    if (!authToken) return;
    setTelegramLoading(true);
    setTelegramMessage("");
    try {
      const res = await fetch("/api/account/telegram", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to disconnect Telegram");
      setTelegramCode(null);
      await loadTelegram();
      setTelegramMessage(lang === "th" ? "ยกเลิกการเชื่อมต่อ Telegram แล้ว" : "Telegram disconnected.");
    } catch (err) {
      setTelegramMessage(err instanceof Error ? err.message : "Unable to disconnect Telegram");
    } finally {
      setTelegramLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center animate-fade-up">
        <User className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 font-display text-2xl font-bold">{lang === "th" ? "ยังไม่ได้เข้าสู่ระบบ" : "Not Logged In"}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {lang === "th" ? "เข้าสู่ระบบเพื่อจัดการบัญชีและแพ็กเกจของคุณ" : "Please log in to configure your personal account details."}
        </p>
        <Link href="/login">
          <Button className="mt-5">{t("common.logIn")}</Button>
        </Link>
      </div>
    );
  }

  const isLifetimePlan = plan.id === "lifetime" || user.billing === "lifetime";
  const price = isLifetimePlan
    ? plan.priceMonthly
    : user.billing === "monthly"
      ? plan.priceMonthly
      : plan.priceYearly;

  const currentLocalPlan = PLAN_TRANS[lang || "th"][plan.id];

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <h1 className="font-display text-2xl font-bold md:text-3xl">{t("account.title")}</h1>

      {/* profile */}
      <Card>
        <CardHeader title={t("account.profileSection")} icon={<User className="h-4 w-4" />} />
        <div className="flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-bold text-brand">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="font-display text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-muted">{user.email}</div>
            <div className="num mt-0.5 text-xs text-muted">
              {lang === "th" ? "สมาชิกตั้งแต่ " : "Member since "}
              {new Date(user.joinedAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* membership */}
      <Card>
        <CardHeader
          title={t("account.planSection")}
          icon={<Crown className="h-4 w-4" />}
          right={<Badge tone="gold">{currentLocalPlan.name}</Badge>}
        />
        <div className="p-5">
          <div className="flex items-center justify-between rounded-xl border border-line bg-elevate px-4 py-3.5">
            <div>
              <div className="font-display font-semibold">{lang === "th" ? `แพ็กเกจ ${currentLocalPlan.name}` : `${currentLocalPlan.name} Tier`}</div>
              <div className="text-xs text-muted">
                {(user.email.toLowerCase().trim() === "zeroline@live.com" || user.email.toLowerCase().trim() === "tayasit.pea@gmail.com")
                  ? (lang === "th" ? "สิทธิ์พิเศษระดับผู้บริหารสูงสุดของระบบ" : "Exclusive permanent enterprise subscription tier")
                  : currentLocalPlan.tagline}
              </div>
            </div>
            <div className="text-right">
              {user.email.toLowerCase().trim() === "zeroline@live.com" || user.email.toLowerCase().trim() === "tayasit.pea@gmail.com" ? (
                <>
                  <div className="num font-display text-lg font-bold text-gold">
                    {lang === "th" ? "ไม่มีวันหมดอายุ" : "Lifetime Access"}
                  </div>
                  <div className="text-[10px] text-muted font-mono uppercase tracking-wider">
                    {lang === "th" ? "สิทธิ์การใช้งานตลอดชีพ" : "Never Expires"}
                  </div>
                </>
              ) : (
                <>
                  <div className="num font-display text-lg font-bold">
                    {price === 0 ? (lang === "th" ? "ฟรี" : "Free") : `${num(price, 0)} ${lang === "th" ? "฿" : "THB"}`}
                  </div>
                  {price > 0 && (
                    <div className="text-xs text-muted">
                      {isLifetimePlan
                        ? (lang === "th" ? "/ครั้งเดียว" : "/once")
                        : user.billing === "monthly"
                          ? (lang === "th" ? "/เดือน" : "/mo")
                          : (lang === "th" ? "/ปี" : "/yr")}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* current plan features */}
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {currentLocalPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span className="text-ink/90">{f}</span>
              </li>
            ))}
          </ul>

          {/* billing toggle for paid plans */}
          {showLocalPlanControls && plan.id !== "free" && !isLifetimePlan && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <span className="text-sm">{t("account.billingLabel")}</span>
              <div className="inline-flex items-center gap-1 rounded-full border border-line p-1">
                <button
                  onClick={() => setPlan(plan.id, "monthly")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    user.billing === "monthly" ? "bg-brand text-bg shadow-sm" : "text-muted"
                  }`}
                >
                  {lang === "th" ? "รายเดือน" : "Monthly"}
                </button>
                <button
                  onClick={() => setPlan(plan.id, "yearly")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    user.billing === "yearly" ? "bg-brand text-bg shadow-sm" : "text-muted"
                  }`}
                >
                  {lang === "th" ? "รายปี" : "Annually"}
                </button>
              </div>
            </div>
          )}
          {isLifetimePlan && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-gold/25 bg-gold/5 px-4 py-3">
              <span className="text-sm font-semibold text-ink">{t("account.billingLabel")}</span>
              <Badge tone="gold">{lang === "th" ? "จ่ายครั้งเดียว ตลอดชีพ" : "One-time Lifetime"}</Badge>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {plan.id !== "premium" && plan.id !== "lifetime" && (
              <Link href="/pricing">
                <Button variant="gold" size="sm">
                  <Crown className="h-4 w-4" /> {t("common.upgrade")}
                </Button>
              </Link>
            )}
            {showLocalPlanControls && plan.id !== "free" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlan("free", "monthly")}
              >
                {lang === "th" ? "ลดเป็นแพ็กเกจฟรี" : "Downgrade to Free Tier"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* quick plan switch (demo convenience) */}
      {showLocalPlanControls && (
        <Card>
          <CardHeader
            title={lang === "th" ? "เปลี่ยนแพ็กเกจอย่างรวดเร็ว" : "Instant Demo Role Swapper"}
            subtitle={lang === "th" ? "เดโม: ทดลองสลับสิทธิ์เพื่อดูฟีเจอร์ที่ปลดล็อก" : "Demo Mode: swap roles instantly to verify locked capabilities."}
            icon={<Shield className="h-4 w-4" />}
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => {
              const tr = PLAN_TRANS[lang || "th"][p.id];
              const nextBilling = p.id === "lifetime" ? "lifetime" : user.billing === "yearly" ? "yearly" : "monthly";
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id, nextBilling)}
                  className={`rounded-xl border p-4 text-left transition ${
                    plan.id === p.id
                      ? "border-brand bg-brand-soft"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  <div className="font-display font-semibold">{tr.name}</div>
                  <div className="num text-xs text-muted">
                    {p.priceMonthly === 0 
                      ? (lang === "th" ? "ฟรี" : "Free") 
                      : p.id === "lifetime"
                        ? `${num(p.priceMonthly, 0)} ${lang === "th" ? "฿/ครั้งเดียว" : "THB/once"}`
                        : `${num(p.priceMonthly, 0)} ${lang === "th" ? "฿/ด." : "THB/mo"}`}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* preferences */}
      <Card>
        <CardHeader title={lang === "th" ? "การตั้งค่าความพึงพอใจ" : "User Preferences"} />
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted" />
              ) : (
                <Sun className="h-5 w-5 text-muted" />
              )}
              <div>
                <div className="text-sm font-medium">{lang === "th" ? "ธีมการแสดงผล" : "Display Theme"}</div>
                <div className="text-xs text-muted">
                  {theme === "dark" 
                    ? (lang === "th" ? "โหมดมืด" : "Dark Mode") 
                    : (lang === "th" ? "โหมดสว่าง" : "Light Mode")}
                </div>
              </div>
            </div>
            <Button variant="subtle" size="sm" onClick={toggleTheme}>
              {lang === "th" 
                ? `สลับเป็น${theme === "dark" ? "สว่าง" : "มืด"}` 
                : `Switch to ${theme === "dark" ? "Light" : "Dark"}`}
            </Button>
          </div>
          <div className="p-5">
            <div className="overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-elevate to-brand/10">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-400/30 bg-sky-400/15 text-sky-300">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-black text-ink">
                        {lang === "th" ? "Telegram Alerts ส่วนตัว" : "Personal Telegram Alerts"}
                      </h3>
                      <Badge tone={telegram?.connected ? "up" : "gold"}>
                        {telegram?.connected
                          ? lang === "th" ? "เชื่อมต่อแล้ว" : "Connected"
                          : lang === "th" ? "ยังไม่เชื่อมต่อ" : "Not connected"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">
                      {lang === "th"
                        ? "เชื่อม Telegram ส่วนตัวเพื่อรับแจ้งเตือนราคาและ Margin of Safety จาก Alert Center โดยใช้ Bot กลางของ ValuStock"
                        : "Connect your personal Telegram account to receive price and Margin-of-Safety alerts from ValuStock Alert Center."}
                    </p>
                    <div className="mt-3 grid gap-2 text-[11px] font-semibold text-muted sm:grid-cols-2">
                      <div className="rounded-xl border border-line/70 bg-bg/45 px-3 py-2">
                        <span className="block text-[9px] font-black uppercase text-muted">Bot</span>
                        <span className="text-ink">{telegram?.botUsername ? `@${telegram.botUsername}` : "-"}</span>
                      </div>
                      <div className="rounded-xl border border-line/70 bg-bg/45 px-3 py-2">
                        <span className="block text-[9px] font-black uppercase text-muted">Telegram</span>
                        <span className="text-ink">
                          {telegram?.connected
                            ? telegram.telegramUsername || telegram.chatIdMask || "Connected"
                            : lang === "th" ? "รอเชื่อมต่อ" : "Waiting"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <Button size="sm" variant={telegram?.connected ? "outline" : "primary"} onClick={startTelegramConnect} disabled={telegramLoading || !authToken}>
                    <Key className="h-4 w-4" />
                    {telegram?.connected
                      ? lang === "th" ? "สร้างโค้ดใหม่" : "New code"
                      : lang === "th" ? "เชื่อมต่อ" : "Connect"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={loadTelegram} disabled={telegramLoading || !authToken}>
                    {lang === "th" ? "รีเฟรช" : "Refresh"}
                  </Button>
                </div>
              </div>

              {telegramCode && (
                <div className="border-t border-line/60 bg-bg/35 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wide text-sky-300">
                        {lang === "th" ? "ส่งคำสั่งนี้ให้ Bot ภายใน 10 นาที" : "Send this command to the bot within 10 minutes"}
                      </div>
                      <div className="mt-2 rounded-xl border border-line bg-bg px-3 py-2 font-mono text-sm font-black text-ink [overflow-wrap:anywhere]">
                        {telegramCode.command}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={copyTelegramCommand}>
                        {lang === "th" ? "คัดลอก" : "Copy"}
                      </Button>
                      <a href={telegramCode.deepLink} target="_blank" rel="noreferrer">
                        <Button size="sm">
                          {lang === "th" ? "เปิด Telegram" : "Open Telegram"}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-line/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] font-semibold leading-relaxed text-muted">
                  {plan.limits.alerts
                    ? lang === "th"
                      ? "Premium/Lifetime สามารถส่งข้อความทดสอบและรับ alert จริงเมื่อ worker ตรวจพบเงื่อนไข"
                      : "Premium/Lifetime can send test messages and receive real alerts when the alert worker detects matching conditions."
                    : lang === "th"
                      ? "เชื่อมบัญชีไว้ล่วงหน้าได้ แต่การส่ง alert ใช้งานใน Premium/Lifetime"
                      : "You can connect in advance. Alert delivery is available on Premium/Lifetime."}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant="gold" onClick={testTelegram} disabled={telegramLoading || !telegram?.connected || !plan.limits.alerts}>
                    {lang === "th" ? "ส่งทดสอบ" : "Send test"}
                  </Button>
                  {telegram?.connected && (
                    <Button size="sm" variant="outline" onClick={disconnectTelegram} disabled={telegramLoading}>
                      {lang === "th" ? "ยกเลิกเชื่อมต่อ" : "Disconnect"}
                    </Button>
                  )}
                </div>
              </div>

              {telegramMessage && (
                <div className="border-t border-line/60 bg-bg/30 px-4 py-3 text-xs font-bold text-muted">
                  {telegramMessage}
                </div>
              )}
            </div>
          </div>
          <FeatureRow
            icon={<Bell className="h-5 w-5 text-muted" />}
            title={lang === "th" ? "การแจ้งเตือนราคา" : "Price Alerts"}
            on={plan.limits.alerts}
            lang={lang}
            t={t}
          />
          <FeatureRow
            icon={<Download className="h-5 w-5 text-muted" />}
            title={lang === "th" ? "ส่งออกข้อมูล CSV" : "Export CSV Data Sheets"}
            on={plan.limits.exportData}
            lang={lang}
            t={t}
          />
        </div>
      </Card>

      <Button
        variant="outline"
        className="w-full text-down hover:bg-down/5 hover:border-down"
        onClick={() => {
          logout();
          router.push("/");
        }}
      >
        <LogOut className="h-4 w-4" /> {t("common.logOut")}
      </Button>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  on,
  lang,
  t,
}: {
  icon: React.ReactNode;
  title: string;
  on: boolean;
  lang: string;
  t: any;
}) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex items-center gap-3">
        {icon}
        <div className="text-sm font-medium">{title}</div>
      </div>
      {on ? (
        <Badge tone="up">{lang === "th" ? "เปิดใช้งาน" : "Active"}</Badge>
      ) : (
        <Link href="/pricing">
          <Badge tone="gold">{t("common.upgrade")}</Badge>
        </Link>
      )}
    </div>
  );
}
