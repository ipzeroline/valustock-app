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
} from "@/lib/icons";

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

  useEffect(() => {
    fetch("/api/admin/db-status")
      .then((res) => res.json())
      .then((data) => {
        setDbConnected(data.connected);
        setDbInfo(data);
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

      {/* 4. Quick Navigation Matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Link href="/AdminConsole/users">
          <div className="surface rounded-2xl border border-line p-4.5 hover:border-brand/40 transition cursor-pointer flex justify-between items-center group">
            <div>
              <h3 className="font-display font-semibold text-xs text-ink group-hover:text-brand transition">👥 จัดการสมาชิก</h3>
              <p className="text-[10px] text-muted mt-1">อัปเกรดแผน หรือปรับแต่งบัญชี</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/AdminConsole/payments">
          <div className="surface rounded-2xl border border-line p-4.5 hover:border-brand/40 transition cursor-pointer flex justify-between items-center group">
            <div>
              <h3 className="font-display font-semibold text-xs text-ink group-hover:text-brand transition">💳 ตรวจสอบการชำระเงิน</h3>
              <p className="text-[10px] text-muted mt-1">อนุมัติบิลและบันทึกรายรับ</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/AdminConsole/articles">
          <div className="surface rounded-2xl border border-line p-4.5 hover:border-brand/40 transition cursor-pointer flex justify-between items-center group">
            <div>
              <h3 className="font-display font-semibold text-xs text-ink group-hover:text-brand transition">✍️ เขียนบทความและเนื้อหา</h3>
              <p className="text-[10px] text-muted mt-1">บทวิเคราะห์และคู่มือความรู้</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/AdminConsole/reviews">
          <div className="surface rounded-2xl border border-line p-4.5 hover:border-brand/40 transition cursor-pointer flex justify-between items-center group">
            <div>
              <h3 className="font-display font-semibold text-xs text-ink group-hover:text-brand transition">⭐ อนุมัติรีวิว</h3>
              <p className="text-[10px] text-muted mt-1">รีวิวผู้ใช้งานและ SEO schema</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/AdminConsole/newsletter">
          <div className="surface rounded-2xl border border-line p-4.5 hover:border-brand/40 transition cursor-pointer flex justify-between items-center group">
            <div>
              <h3 className="font-display font-semibold text-xs text-ink group-hover:text-brand transition">📩 Newsletter</h3>
              <p className="text-[10px] text-muted mt-1">รายชื่ออีเมลจาก funnel</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/AdminConsole/staff">
          <div className="surface rounded-2xl border border-line p-4.5 hover:border-brand/40 transition cursor-pointer flex justify-between items-center group">
            <div>
              <h3 className="font-display font-semibold text-xs text-ink group-hover:text-brand transition">🛡️ จัดการบทบาทเจ้าหน้าที่</h3>
              <p className="text-[10px] text-muted mt-1">กำหนดสิทธิ์ทีมงานและ Staff</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
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
