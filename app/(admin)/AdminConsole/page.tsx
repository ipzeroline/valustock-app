"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import {
  Shield,
  User,
  Layers,
  Crown,
  Sparkles,
  Info,
  ArrowRight,
  BarChart3,
  MessageSquare,
  FileText,
  Mail,
  Star,
  Wallet,
  Database,
} from "@/lib/icons";

type DataCacheStatus = {
  connected?: boolean;
  configured?: boolean;
  error?: string;
  code?: string;
  collections?: {
    quoteCache?: number;
    quoteSnapshots?: number;
    marketApiEvents?: number;
    historicalBars?: number;
    externalAssets?: number;
    setSecurities?: number;
    marketIntelligence?: number;
  };
  latest?: {
    quoteCache?: { symbol?: string; source?: string; fetchedAt?: string | null; expiresAt?: string | null; staleUntil?: string | null } | null;
    quoteSnapshot?: { symbol?: string; source?: string; fetchedAt?: string | null } | null;
    historicalBars?: { symbol?: string; range?: string; provider?: string; fetchedAt?: string | null; expiresAt?: string | null } | null;
    externalAsset?: { symbol?: string; source?: string; updatedAt?: string | null; expiresAt?: string | null } | null;
    marketIntelligence?: { symbol?: string; fetchedAt?: string | null; expiresAt?: string | null } | null;
    marketApiEvent?: { provider?: string; symbol?: string; ok?: boolean; source?: string; createdAt?: string | null } | null;
    setSecurity?: { symbol?: string; market?: string; updatedAt?: string | null } | null;
    setSyncEvent?: { type?: string; ok?: boolean; count?: number; createdAt?: string | null } | null;
  };
  cachePolicy?: {
    quoteCache?: { refresh?: string; freshForSeconds?: number; staleForSeconds?: number; deleteAfter?: string };
    quoteSnapshots?: { refresh?: string; deleteAfterDays?: number };
    marketUniverse?: { refresh?: string; freshForSeconds?: number; staleForSeconds?: number; deleteAfter?: string };
    historicalBars?: { refresh?: string; freshForSeconds?: number; deleteAfter?: string };
    externalAssets?: { refresh?: string; freshForSeconds?: number; deleteAfter?: string };
    marketIntelligence?: { refresh?: string; freshForSeconds?: number; deleteAfter?: string };
    marketApiEvents?: { refresh?: string; deleteAfterDays?: number };
    setSecurities?: { refresh?: string; deleteAfter?: string };
  };
};

const quickNavItems = [
  {
    href: "/AdminConsole/users",
    icon: User,
    title: "Members",
    desc: "Plans and accounts",
  },
  {
    href: "/AdminConsole/payments",
    icon: Wallet,
    title: "Payments",
    desc: "Invoices and revenue",
  },
  {
    href: "/AdminConsole/articles",
    icon: FileText,
    title: "Content",
    desc: "Articles and guides",
  },
  {
    href: "/AdminConsole/reviews",
    icon: Star,
    title: "Reviews",
    desc: "Approval queue",
  },
  {
    href: "/AdminConsole/newsletter",
    icon: Mail,
    title: "Newsletter",
    desc: "Email funnel",
  },
  {
    href: "/AdminConsole/staff",
    icon: Shield,
    title: "Staff",
    desc: "Roles and access",
  },
];

function formatCacheTime(value?: string | null, lang: "th" | "en" = "en") {
  if (!value) return lang === "th" ? "ยังไม่มีข้อมูล" : "No data yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return lang === "th" ? "ข้อมูลเวลาไม่ถูกต้อง" : "Invalid timestamp";
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function secondsLabel(seconds?: number, lang: "th" | "en" = "en") {
  if (!seconds) return "";
  if (seconds < 60) return lang === "th" ? `${seconds} วินาที` : `${seconds}s`;
  if (seconds < 3600) return lang === "th" ? `${Math.round(seconds / 60)} นาที` : `${Math.round(seconds / 60)} min`;
  return lang === "th" ? `${Math.round(seconds / 3600)} ชั่วโมง` : `${Math.round(seconds / 3600)} hr`;
}

export default function AdminOverview() {
  const { lang } = useTranslation();
  const [dbConnected, setDbConnected] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [userCount, setUserCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [newsletterCount, setNewsletterCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [dataCache, setDataCache] = useState<DataCacheStatus | null>(null);

  useEffect(() => {
    fetch("/api/admin/db-status")
      .then((res) => res.json())
      .then((data) => {
        setDbConnected(data.connected);
        setDbInfo(data);
        setDataCache(data.dataCache || null);
      })
      .catch((err) => console.error(err));

    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUserCount(data.users.length))
      .catch((err) => console.error(err));

    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => setArticleCount(data.articles.length))
      .catch((err) => console.error(err));

    fetch("/api/admin/payments")
      .then((res) => res.json())
      .then((data) => setPayments(data.payments || []))
      .catch((err) => console.error(err));

    fetch("/api/admin/staff")
      .then((res) => res.json())
      .then((data) => setStaffCount(data.staff ? data.staff.length : 0))
      .catch((err) => console.error(err));

    fetch("/api/admin/newsletter")
      .then((res) => res.json())
      .then((data) => setNewsletterCount(data.subscribers ? data.subscribers.filter((item: any) => item.status === "subscribed").length : 0))
      .catch((err) => console.error(err));

    fetch("/api/admin/reviews?status=pending")
      .then((res) => res.json())
      .then((data) => setPendingReviewCount(data.reviews ? data.reviews.length : 0))
      .catch((err) => console.error(err));
  }, []);

  // Compute payment metrics
  const totalVolume = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const dataCacheCollections = dataCache?.collections || {};
  const mongoRecordCount = Object.values(dataCacheCollections).reduce((sum, value) => sum + Number(value || 0), 0);
  const dataCacheConfigured = Boolean(dataCache?.configured);
  const dataCacheConnected = Boolean(dataCache?.connected);
  const dataCacheStatus = !dataCacheConfigured ? "Not Configured" : dataCacheConnected ? "Active" : "Offline";
  const latest = dataCache?.latest || {};
  const cachePolicy = dataCache?.cachePolicy || {};

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 1. Page Title */}
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
          <Shield className="h-7 w-7 text-brand" /> 
          {lang === "th" ? "แดชบอร์ดความคุ้มครองระบบควบคุม" : "Command Console Dashboard"}
        </h1>
        <p className="text-xs text-muted mt-1.5">
          {lang === "th"
            ? "ภาพรวมการเชื่อมโยงระบบฐานข้อมูล สมาชิก ธุรกรรมชำระเงิน บทความเผยแพร่ และบุคลากรปฏิบัติการ"
            : "Live operational hub for data services, members, transaction flows, editorial content, and staff."}
        </p>
      </div>

      {/* 2. Diagnostic grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MonitorCard
          title={lang === "th" ? "สถานะข้อมูลระบบ" : "Data Service Status"}
          value={dbConnected ? "Active" : "Sandbox Mode"}
          desc={dbConnected ? "Production data service is connected" : "Data service offline - Sandbox Active"}
          connected={dbConnected}
        />
        <MonitorCard
          title={lang === "th" ? "สมาชิกทั้งหมด" : "Total Users"}
          value={`${userCount} Accounts`}
          desc="Registered investment profiles"
          connected={true}
        />
        <MonitorCard
          title={lang === "th" ? "บทความและคู่มือ" : "Investment Articles"}
          value={`${articleCount} Published`}
          desc="Live knowledgebase handbook"
          connected={true}
        />
        <MonitorCard
          title={lang === "th" ? "ธุรกรรมรวม (Verified)" : "Total Revenue (Verified)"}
          value={`${totalVolume.toLocaleString()} THB`}
          desc="Net premium subscriptions volume"
          connected={true}
        />
        <MonitorCard
          title={lang === "th" ? "รายการรอตรวจสอบ" : "Pending Invoices"}
          value={`${pendingPayments} Payments`}
          desc="Manual transfer verifications pending"
          connected={pendingPayments > 0 ? false : true}
          isAlert={pendingPayments > 0}
        />
        <MonitorCard
          title={lang === "th" ? "เจ้าหน้าที่ปฏิบัติการ" : "Operations Staff"}
          value={`${staffCount} Personnel`}
          desc="Authorized administration profiles"
          connected={true}
        />
        <MonitorCard
          title={lang === "th" ? "Newsletter Active" : "Newsletter Active"}
          value={`${newsletterCount} Emails`}
          desc="Marketing subscribers captured from public funnel"
          connected={true}
        />
        <MonitorCard
          title={lang === "th" ? "รีวิวรออนุมัติ" : "Pending Reviews"}
          value={`${pendingReviewCount} Reviews`}
          desc="User testimonials waiting for publication"
          connected={pendingReviewCount === 0}
          isAlert={pendingReviewCount > 0}
        />
        <MonitorCard
          title="MongoDB Cache"
          value={dataCacheStatus}
          desc={
            dataCacheConnected
              ? `${mongoRecordCount.toLocaleString()} cached market records`
              : dataCache?.error || "Market data cache is unavailable"
          }
          connected={dataCacheConnected}
          isAlert={dataCacheConfigured && !dataCacheConnected}
        />
      </div>

      {/* 3. Server Configuration Diagnostic */}
      <Card className={`relative overflow-hidden border ${dbConnected ? "border-brand/30 bg-brand/5" : "border-gold/30 bg-gold/5"} p-6`}>
        <div className="aurora absolute inset-0 -z-10 opacity-30" />
        <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-gold shrink-0 animate-pulse" />
          {lang === "th" ? "ระบบจัดการข้อมูล Production" : "Production Data Diagnostics"}
        </h3>
        <p className="text-xs text-muted leading-relaxed mt-2.5 max-w-4xl">
          {dbConnected
            ? "ระบบข้อมูล production พร้อมใช้งานสำหรับธุรกรรม สมาชิก watchlists บทความ และสิทธิ์เจ้าหน้าที่"
            : `ระบบข้อมูลยังเชื่อมต่อไม่ได้ (${dbInfo?.code || "UNKNOWN"}): ${dbInfo?.error || "ตรวจสอบ environment และสิทธิ์การเข้าถึงบน server"}`}
        </p>

        {!dbConnected && (
          <div className="mt-4 pt-4 border-t border-line/50 space-y-2">
            <span className="text-xs font-bold text-ink block">🔗 แนวทางตรวจสอบฐานข้อมูล:</span>
            <div className="rounded-xl border border-line bg-bg p-3.5 text-xs font-mono text-ink leading-relaxed select-all">
              1. ตรวจสอบค่า environment ของระบบข้อมูลบน production<br />
              2. ตรวจสอบสิทธิ์บัญชีบริการให้เข้าถึง data store ที่กำหนด<br />
              3. รัน migration/init เฉพาะผ่าน server shell หรือ deployment job ที่ปลอดภัย
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-muted">
              ใช้รหัสผ่านจริงจาก environment บน server เท่านั้น อย่าแสดงรหัสผ่านในหน้าเว็บหรือ commit ลง git
            </p>
          </div>
        )}
      </Card>

      <Card className={`relative overflow-hidden border ${dataCacheConnected ? "border-brand/30 bg-brand/5" : "border-gold/30 bg-gold/5"} p-6`}>
        <div className="aurora absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-brand shrink-0" />
              MongoDB Market Data Cache
            </h3>
            <p className="mt-2 max-w-4xl text-xs font-semibold leading-relaxed text-muted">
              {dataCacheConnected
                ? "MongoDB is connected and storing quote cache, snapshots, historical bars, server request logs, external assets, and SET reference data."
                : dataCacheConfigured
                ? `MongoDB is configured but unavailable${dataCache?.code ? ` (${dataCache.code})` : ""}: ${dataCache?.error || "connection failed"}`
                : "MongoDB is not configured. Market data cache and SET sync persistence are disabled."}
            </p>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black ${dataCacheConnected ? "border-brand/30 bg-brand/10 text-brand" : "border-gold/30 bg-gold/10 text-gold"}`}>
            {dataCacheStatus}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Quote Cache", dataCacheCollections.quoteCache],
            ["Quote Snapshots", dataCacheCollections.quoteSnapshots],
            ["Historical Bars", dataCacheCollections.historicalBars],
            ["Request Events", dataCacheCollections.marketApiEvents],
            ["External Assets", dataCacheCollections.externalAssets],
            ["SET Securities", dataCacheCollections.setSecurities],
            ["Market Intelligence", dataCacheCollections.marketIntelligence],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-line bg-bg/70 p-3">
              <div className="text-[10px] font-black uppercase tracking-wide text-muted">{label}</div>
              <div className="num mt-1 font-display text-xl font-bold text-ink">
                {Number(value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {dataCacheConnected && (
          <div className="mt-5 space-y-4 border-t border-line/60 pt-5">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wide text-ink">
                {lang === "th" ? "เวลา Cache ล่าสุด" : "Latest Cache Activity"}
              </h4>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-muted">
                {lang === "th"
                  ? "เวลาทั้งหมดแสดงตามเวลาไทย ระบบจะเขียน cache เมื่อมี request ที่ต้องดึงข้อมูลสด หรือเมื่อ cron sync ทำงาน"
                  : "All times are shown in Bangkok time. Cache is written on live data requests or scheduled sync jobs."}
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <CacheDetail
                title="Quote Cache"
                primary={`${latest.quoteCache?.symbol || "-"}${latest.quoteCache?.source ? ` · ${latest.quoteCache.source}` : ""}`}
                rows={[
                  [lang === "th" ? "บันทึกล่าสุด" : "Fetched", formatCacheTime(latest.quoteCache?.fetchedAt, lang)],
                  [lang === "th" ? "สดถึง" : "Fresh until", formatCacheTime(latest.quoteCache?.expiresAt, lang)],
                  [lang === "th" ? "ใช้แบบ stale ได้ถึง" : "Stale until", formatCacheTime(latest.quoteCache?.staleUntil, lang)],
                ]}
              />
              <CacheDetail
                title="Quote Snapshot"
                primary={`${latest.quoteSnapshot?.symbol || "-"}${latest.quoteSnapshot?.source ? ` · ${latest.quoteSnapshot.source}` : ""}`}
                rows={[[lang === "th" ? "snapshot ล่าสุด" : "Latest snapshot", formatCacheTime(latest.quoteSnapshot?.fetchedAt, lang)]]}
              />
              <CacheDetail
                title="Historical Bars"
                primary={`${latest.historicalBars?.symbol || "-"}${latest.historicalBars?.range ? ` · ${latest.historicalBars.range}` : ""}`}
                rows={[
                  [lang === "th" ? "บันทึกล่าสุด" : "Fetched", formatCacheTime(latest.historicalBars?.fetchedAt, lang)],
                  [lang === "th" ? "หมดอายุ" : "Expires", formatCacheTime(latest.historicalBars?.expiresAt, lang)],
                ]}
              />
              <CacheDetail
                title="External Assets"
                primary={`${latest.externalAsset?.symbol || "-"}${latest.externalAsset?.source ? ` · ${latest.externalAsset.source}` : ""}`}
                rows={[
                  [lang === "th" ? "อัปเดตล่าสุด" : "Updated", formatCacheTime(latest.externalAsset?.updatedAt, lang)],
                  [lang === "th" ? "หมดอายุ" : "Expires", formatCacheTime(latest.externalAsset?.expiresAt, lang)],
                ]}
              />
              <CacheDetail
                title="Market Intelligence"
                primary={latest.marketIntelligence?.symbol || "-"}
                rows={[
                  [lang === "th" ? "บันทึกล่าสุด" : "Fetched", formatCacheTime(latest.marketIntelligence?.fetchedAt, lang)],
                  [lang === "th" ? "หมดอายุ" : "Expires", formatCacheTime(latest.marketIntelligence?.expiresAt, lang)],
                ]}
              />
              <CacheDetail
                title="SET Reference"
                primary={`${latest.setSecurity?.symbol || "-"}${latest.setSecurity?.market ? ` · ${latest.setSecurity.market}` : ""}`}
                rows={[
                  [lang === "th" ? "หลักทรัพย์อัปเดตล่าสุด" : "Latest security update", formatCacheTime(latest.setSecurity?.updatedAt, lang)],
                  [lang === "th" ? "sync ล่าสุด" : "Latest sync", formatCacheTime(latest.setSyncEvent?.createdAt, lang)],
                ]}
              />
            </div>

            <div className="rounded-xl border border-line bg-bg/70 p-4">
              <h4 className="text-xs font-black uppercase tracking-wide text-ink">
                {lang === "th" ? "Cache เมื่อไหร่ และลบเมื่อไหร่" : "When Cache Is Written And Deleted"}
              </h4>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {[
                  [
                    "Quote Cache",
                    lang === "th"
                      ? `ดึงสดเมื่อ quote เกิน ${secondsLabel(cachePolicy.quoteCache?.freshForSeconds, lang)} แล้วมีคนเปิดดูหุ้น; ใช้ stale ได้ถึง ${secondsLabel(cachePolicy.quoteCache?.staleForSeconds, lang)}; ลบด้วย MongoDB TTL หลัง staleUntil`
                      : `Refreshes on quote requests after ${secondsLabel(cachePolicy.quoteCache?.freshForSeconds, lang)}; stale allowed until ${secondsLabel(cachePolicy.quoteCache?.staleForSeconds, lang)}; deleted by MongoDB TTL after staleUntil.`,
                  ],
                  [
                    "Quote Snapshots",
                    lang === "th"
                      ? `เพิ่มทุกครั้งที่มี quote สดใหม่ และลบอัตโนมัติหลัง ${cachePolicy.quoteSnapshots?.deleteAfterDays || 90} วัน`
                      : `Inserted whenever a fresh quote is saved and automatically deleted after ${cachePolicy.quoteSnapshots?.deleteAfterDays || 90} days.`,
                  ],
                  [
                    "Historical Bars",
                    lang === "th"
                      ? `ดึงใหม่เมื่อข้อมูลกราฟเกิน ${secondsLabel(cachePolicy.historicalBars?.freshForSeconds, lang)} แล้วมี request และลบด้วย TTL หลัง expiresAt`
                      : `Refreshes on chart/history requests after ${secondsLabel(cachePolicy.historicalBars?.freshForSeconds, lang)} and is deleted by TTL after expiresAt.`,
                  ],
                  [
                    "External Assets",
                    lang === "th"
                      ? `เก็บเมื่อ resolve symbol ภายนอก สำรอง ${secondsLabel(cachePolicy.externalAssets?.freshForSeconds, lang)} และลบด้วย TTL หลัง expiresAt`
                      : `Saved when an external symbol is resolved, kept for ${secondsLabel(cachePolicy.externalAssets?.freshForSeconds, lang)}, then deleted by TTL.`,
                  ],
                  [
                    "Market Intelligence",
                    lang === "th"
                      ? `ดึงใหม่เมื่อ intelligence เกิน ${secondsLabel(cachePolicy.marketIntelligence?.freshForSeconds, lang)} แล้วมี request และลบด้วย TTL หลัง expiresAt`
                      : `Refreshes on intelligence requests after ${secondsLabel(cachePolicy.marketIntelligence?.freshForSeconds, lang)} and is deleted by TTL after expiresAt.`,
                  ],
                  [
                    "System Events / SET Reference",
                    lang === "th"
                      ? `Request logs ลบหลัง ${cachePolicy.marketApiEvents?.deleteAfterDays || 30} วัน; SET reference อัปเดตทับเมื่อ cron sync ทำงานและไม่มี TTL อัตโนมัติ`
                      : `Request logs are deleted after ${cachePolicy.marketApiEvents?.deleteAfterDays || 30} days; SET reference is updated by cron and has no automatic TTL.`,
                  ],
                ].map(([label, detail]) => (
                  <div key={label} className="rounded-lg border border-line/70 bg-surface/50 p-3">
                    <div className="text-[11px] font-black text-ink">{label}</div>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-muted">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-semibold leading-relaxed text-muted">
                {lang === "th"
                  ? "หมายเหตุ: MongoDB TTL monitor ลบข้อมูลแบบอัตโนมัติหลังหมดอายุ แต่อาจช้ากว่าเวลาที่กำหนดเล็กน้อย ไม่ใช่ realtime ตรงวินาที"
                  : "Note: MongoDB TTL monitor deletes expired documents automatically, but not exactly at the expiration second."}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Quick Navigation Matrix */}
      <div className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {quickNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block min-w-0">
              <div className="surface group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-line p-4 transition hover:border-brand/40">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate whitespace-nowrap font-display text-sm font-semibold leading-none text-ink transition group-hover:text-brand">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 truncate whitespace-nowrap text-[11px] font-semibold leading-none text-muted">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CacheDetail({
  title,
  primary,
  rows,
}: {
  title: string;
  primary: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wide text-muted">{title}</div>
          <div className="mt-1 text-sm font-bold text-ink">{primary}</div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="font-semibold text-muted">{label}</span>
            <span className="text-right font-bold text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitorCard({
  title,
  value,
  desc,
  connected,
  isAlert = false,
}: {
  title: string;
  value: string;
  desc: string;
  connected: boolean;
  isAlert?: boolean;
}) {
  return (
    <Card className="p-5 border border-line relative overflow-hidden">
      {isAlert && <div className="absolute top-0 right-0 left-0 h-1 bg-down" />}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-semibold">{title}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${isAlert ? "bg-down animate-ping" : connected ? "bg-brand animate-pulse" : "bg-gold animate-bounce"}`} />
      </div>
      <div className="num mt-4 font-display text-2xl font-bold text-ink">{value}</div>
      <p className="text-xs text-muted mt-1">{desc}</p>
    </Card>
  );
}
