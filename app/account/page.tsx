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
  ArrowRight,
} from "@/lib/icons";

type TelegramState = {
  connected: boolean;
  status: string;
  telegramUsername: string | null;
  chatIdMask: string | null;
  notificationsEnabled: boolean;
  watchlistDigestEnabled: boolean;
  watchlistDigestFrequency: "daily" | "weekly";
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

  const sendWatchlistSummary = async () => {
    if (!authToken) return;
    setTelegramLoading(true);
    setTelegramMessage("");
    try {
      const res = await fetch("/api/account/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action: "watchlist_summary" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Watchlist summary failed");
      setTelegramMessage(lang === "th" ? "ส่งสรุปรายการโปรดเข้า Telegram แล้ว" : "Watchlist summary sent to Telegram.");
      await loadTelegram();
    } catch (err) {
      setTelegramMessage(err instanceof Error ? err.message : "Watchlist summary failed");
    } finally {
      setTelegramLoading(false);
    }
  };

  const updateTelegramDigest = async (enabled: boolean, frequency: "daily" | "weekly" = telegram?.watchlistDigestFrequency || "daily") => {
    if (!authToken) return;
    setTelegramLoading(true);
    setTelegramMessage("");
    try {
      const res = await fetch("/api/account/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          action: "update_preferences",
          watchlistDigestEnabled: enabled,
          watchlistDigestFrequency: frequency,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to update Telegram preferences");
      setTelegram(data.telegram);
      setTelegramMessage(lang === "th" ? "บันทึกการตั้งค่า Telegram แล้ว" : "Telegram preferences saved.");
    } catch (err) {
      setTelegramMessage(err instanceof Error ? err.message : "Unable to update Telegram preferences");
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
                        ? "เชื่อม Telegram ส่วนตัวครั้งเดียว เพื่อรับสรุป Watchlist, Portfolio, Compare Alert และใช้ Mini App โดยไม่ต้องล็อกอินเว็บซ้ำ"
                        : "Connect your personal Telegram account once to receive Watchlist summaries, Portfolio updates, Compare Alerts, and use the Mini App without logging into the web again."}
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
                    <div className="mt-3 rounded-xl border border-line/70 bg-bg/35 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-sky-300">
                        {lang === "th" ? "ข้อมูลที่ ValuStock ใช้" : "Data ValuStock Uses"}
                      </div>
                      <div className="mt-2 grid gap-2 text-[11px] font-semibold leading-relaxed text-muted sm:grid-cols-3">
                        <span>{lang === "th" ? "อีเมลสมาชิก" : "Member email"}</span>
                        <span>{lang === "th" ? "Telegram chat id" : "Telegram chat ID"}</span>
                        <span>{lang === "th" ? "สถานะเปิดแจ้งเตือน" : "Alert status"}</span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-relaxed text-muted">
                        {lang === "th"
                          ? "ข้อมูลนี้ใช้เฉพาะสำหรับส่งแจ้งเตือนจาก ValuStock Bot ไปยังบัญชี Telegram ของคุณเท่านั้น ไม่แสดง chat id เต็มบนหน้าเว็บ และยกเลิกการเชื่อมต่อได้ทุกเมื่อ"
                          : "This data is used only to deliver ValuStock Bot alerts to your Telegram account. Full chat IDs are hidden on the web and can be disconnected anytime."}
                      </p>
                    </div>
                    <div className="mt-3 rounded-xl border border-sky-400/25 bg-sky-400/10 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[10px] font-black uppercase tracking-wide text-sky-300">
                          {lang === "th" ? "วิธีเชื่อมต่อแบบง่าย" : "Simple Connection Flow"}
                        </div>
                        {telegram?.connected && (
                          <Badge tone="up">{lang === "th" ? "เชื่อมแล้ว ไม่ต้องทำซ้ำ" : "Connected once"}</Badge>
                        )}
                      </div>
                      <div className="mt-3 grid gap-2 text-[11px] font-semibold leading-relaxed text-muted md:grid-cols-3">
                        {[
                          {
                            step: "1",
                            title: lang === "th" ? "กดเชื่อมต่อ" : "Click Connect",
                            desc:
                              lang === "th"
                                ? "ระบบจะสร้างคำสั่ง /start พร้อมโค้ดเฉพาะสมาชิก"
                                : "ValuStock creates a /start command with your one-time member code.",
                          },
                          {
                            step: "2",
                            title: lang === "th" ? "ส่งให้ Bot" : "Send to Bot",
                            desc:
                              lang === "th"
                                ? "กดเปิด Telegram หรือคัดลอกคำสั่งไปส่งในแชทส่วนตัวของ Bot"
                                : "Open Telegram or copy the command into the bot's private chat.",
                          },
                          {
                            step: "3",
                            title: lang === "th" ? "รอสถานะเชื่อมต่อ" : "Wait for Connected",
                            desc:
                              lang === "th"
                                ? "กลับมาหน้านี้ รอ 5 วินาที หรือกดรีเฟรชจนขึ้นเชื่อมต่อแล้ว"
                                : "Return here, wait a few seconds, or click refresh until Connected appears.",
                          },
                        ].map((item) => (
                          <div key={item.step} className="rounded-lg border border-line/60 bg-bg/35 p-2">
                            <div className="flex items-center gap-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-400/20 text-[10px] font-black text-sky-300">
                                {item.step}
                              </span>
                              <span className="font-black text-ink">{item.title}</span>
                            </div>
                            <p className="mt-1 text-muted">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-relaxed text-muted">
                        {telegram?.connected
                          ? lang === "th"
                            ? "เมื่อเชื่อมต่อแล้ว สถานะจะค้างอยู่ในระบบ ไม่ต้องเชื่อมซ้ำ ยกเว้นคุณกดยกเลิกเชื่อมต่อหรือเปลี่ยนบัญชี Telegram"
                            : "Once connected, the status stays linked. You only need to reconnect if you disconnect or change Telegram accounts."
                          : lang === "th"
                            ? "สำคัญ: ส่งคำสั่งในแชทส่วนตัวกับ Bot เท่านั้น ไม่ควรส่งโค้ดในกลุ่ม และโค้ดหมดอายุภายใน 10 นาที"
                            : "Important: send the command only in a private bot chat. Do not post the code in groups. Codes expire in 10 minutes."}
                      </p>
                    </div>
                    <div className="mt-3 rounded-xl border border-brand/25 bg-brand/10 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-brand">
                        {lang === "th" ? "Telegram จะส่งอะไรให้สมาชิก" : "What Telegram Sends"}
                      </div>
                      <div className="mt-2 grid gap-2 text-[11px] font-semibold leading-relaxed text-muted sm:grid-cols-2">
                        <div className="rounded-lg border border-line/60 bg-bg/35 p-2">
                          <span className="block font-black text-ink">{lang === "th" ? "Alert ทันที" : "Instant alerts"}</span>
                          {lang === "th" ? "ราคาถึงเป้า, MOS เข้าเกณฑ์, หุ้นที่ตั้ง alert ไว้" : "Target price hits, MOS conditions, configured alert symbols"}
                        </div>
                        <div className="rounded-lg border border-line/60 bg-bg/35 p-2">
                          <span className="block font-black text-ink">{lang === "th" ? "สรุปรายการโปรด" : "Watchlist summary"}</span>
                          {lang === "th" ? "ส่งครบทุกตัวใน Watchlist และแบ่งข้อความให้อ่านง่าย" : "All Watchlist stocks, split into readable message batches"}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-relaxed text-muted">
                        {lang === "th"
                          ? "ทุกตัวจะมีราคา, Fair Value, MOS, Dividend Yield, เหตุผลที่ติดตาม และลิงก์กลับไปหน้าหุ้น โดยใช้คำว่าเข้าโซนติดตาม ไม่ใช่คำแนะนำซื้อขาย"
                          : "Every stock includes price, fair value, MOS, dividend yield, reason, and a stock link. Messages are watch signals, not buy/sell advice."}
                      </p>
                    </div>
                    <div className="mt-3 rounded-xl border border-gold/30 bg-gold/10 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-wide text-gold">
                            {lang === "th" ? "Telegram Mini App" : "Telegram Mini App"}
                          </div>
                          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-muted">
                            {lang === "th"
                              ? "Mini App ไม่ต้อง login เว็บซ้ำ ระบบใช้ Telegram ที่เชื่อมจากหน้านี้เป็นกุญแจยืนยันตัวตน แล้วดึงข้อมูลสมาชิกจากบัญชีที่ผูกไว้เท่านั้น"
                              : "The Mini App does not require another web login. It uses this connected Telegram account as the identity key and only loads data for the linked member account."}
                          </p>
                          <div className="mt-2 grid gap-2 text-[11px] font-semibold leading-relaxed text-muted sm:grid-cols-2">
                            {[
                              lang === "th" ? "Portfolio summary" : "Portfolio summary",
                              lang === "th" ? "Compare Sets ที่บันทึกไว้" : "Saved Compare Sets",
                              lang === "th" ? "Watchlist แบบย่อ" : "Compact Watchlist",
                              lang === "th" ? "ส่ง Watchlist Summary" : "Send Watchlist Summary",
                              lang === "th" ? "ส่ง Compare Alert รายชุด" : "Send Compare Set Alerts",
                            ].map((item) => (
                              <span key={item} className="rounded-lg border border-line/60 bg-bg/35 px-2 py-1">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {telegram?.botUsername && (
                            <a href={`https://t.me/${telegram.botUsername}`} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="gold" disabled={!telegram?.connected}>
                                {lang === "th" ? "เปิด Bot" : "Open Bot"}
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          <Link href="/telegram">
                            <Button size="sm" variant="outline">
                              {lang === "th" ? "ดูหน้า Mini App" : "Preview"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {!telegram?.connected && (
                        <p className="mt-2 text-[11px] font-bold text-gold">
                          {lang === "th"
                            ? "ต้องเชื่อม Telegram ก่อน Mini App จึงจะดึง Portfolio, Compare และ Watchlist ได้"
                            : "Connect Telegram first before the Mini App can load Portfolio, Compare, and Watchlist data."}
                        </p>
                      )}
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wide text-sky-300">
                        {lang === "th" ? "ขั้นตอนถัดไป: ส่งคำสั่งนี้ใน Telegram" : "Next step: send this command in Telegram"}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-muted">
                        {lang === "th"
                          ? "ให้กดปุ่ม เปิด Telegram หรือคัดลอกคำสั่งด้านล่างไปส่งในแชทส่วนตัวของ Bot ภายใน 10 นาที ระบบจะผูก Telegram นี้กับบัญชีสมาชิกที่ล็อกอินอยู่"
                          : "Click Open Telegram or copy the command below into the bot's private chat within 10 minutes. ValuStock will link that Telegram account to the logged-in member."}
                      </p>
                      <div className="mt-2 rounded-xl border border-line bg-bg px-3 py-2 font-mono text-sm font-black text-ink [overflow-wrap:anywhere]">
                        {telegramCode.command}
                      </div>
                      <div className="mt-2 grid gap-2 text-[11px] font-semibold leading-relaxed text-muted sm:grid-cols-2">
                        <span className="rounded-lg border border-line/60 bg-bg/50 px-2 py-1">
                          {lang === "th" ? `Bot: @${telegramCode.botUsername}` : `Bot: @${telegramCode.botUsername}`}
                        </span>
                        <span className="rounded-lg border border-line/60 bg-bg/50 px-2 py-1">
                          {lang === "th" ? "หลังส่งแล้ว หน้านี้จะรีเฟรชสถานะอัตโนมัติ" : "After sending, this page refreshes status automatically."}
                        </span>
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
                      ? "Premium/Lifetime สามารถส่งข้อความทดสอบและรับแจ้งเตือนจริงเมื่อราคาหรือ MOS เข้าเงื่อนไขที่ตั้งไว้"
                      : "Premium/Lifetime can send test messages and receive real alerts when price or MOS conditions match."
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

              <div className="border-t border-line/60 bg-bg/25 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black text-ink">
                      {lang === "th" ? "สรุปรายการโปรดผ่าน Telegram" : "Telegram Watchlist Summary"}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-muted">
                      {lang === "th"
                        ? "ส่งสรุปหุ้นครบทุกตัวจาก Watchlist ของคุณ โดยจัดอันดับจาก MOS, Dividend Yield และการเปลี่ยนแปลงราคา หากมีหลายตัวระบบจะแบ่งเป็นหลายข้อความ"
                        : "Send every stock in your Watchlist, ranked by MOS, dividend yield, and price movement. Large lists are split into multiple messages."}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={telegram?.watchlistDigestEnabled ? "primary" : "outline"}
                      onClick={() => updateTelegramDigest(!telegram?.watchlistDigestEnabled)}
                      disabled={telegramLoading || !authToken}
                    >
                      {telegram?.watchlistDigestEnabled
                        ? lang === "th" ? "เปิด Digest" : "Digest on"
                        : lang === "th" ? "ปิด Digest" : "Digest off"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTelegramDigest(true, telegram?.watchlistDigestFrequency === "weekly" ? "daily" : "weekly")}
                      disabled={telegramLoading || !authToken}
                    >
                      {telegram?.watchlistDigestFrequency === "weekly"
                        ? lang === "th" ? "รายสัปดาห์" : "Weekly"
                        : lang === "th" ? "รายวัน" : "Daily"}
                    </Button>
                    <Button size="sm" variant="gold" onClick={sendWatchlistSummary} disabled={telegramLoading || !telegram?.connected || !plan.limits.alerts}>
                      {lang === "th" ? "ส่งสรุปทดสอบ" : "Send summary"}
                    </Button>
                  </div>
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
          router.push("/login");
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
