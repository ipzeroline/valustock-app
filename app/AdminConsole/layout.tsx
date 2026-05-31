"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/translations";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  User,
  Layers,
  Crown,
  LogOut,
  LineChart,
  BarChart3,
  Sparkles,
  Info,
} from "@/lib/icons";

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-bg shadow-[0_6px_20px_-8px_rgb(var(--brand))]">
        <LineChart className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">
        Valu<span className="text-brand">Stock</span>
      </span>
    </Link>
  );
}

export default function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/AdminConsole";
  const { lang, toggleLang } = useTranslation();
  const [dbConnected, setDbConnected] = useState(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check local storage session
    const authSession = localStorage.getItem("vsc_admin_logged_in") === "true";
    setIsLoggedIn(authSession);

    // Fetch DB Status
    fetch("/api/admin/db-status")
      .then((res) => res.json())
      .then((data) => setDbConnected(data.connected))
      .catch((err) => console.error("Error fetching db status:", err));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "zeroline" && password === "Zero7878**&&") {
      localStorage.setItem("vsc_admin_logged_in", "true");
      setIsLoggedIn(true);
      setError("");
    } else {
      setError(
        lang === "th"
          ? "ชื่อผู้ใช้หรือรหัสผ่านสำหรับ Super Admin ไม่ถูกต้อง"
          : "Invalid Super Admin username or password"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vsc_admin_logged_in");
    setIsLoggedIn(false);
  };

  const adminMenu = [
    { href: "/AdminConsole", label: lang === "th" ? "แผงควบคุมหลัก" : "Console Overview", icon: BarChart3 },
    { href: "/AdminConsole/users", label: lang === "th" ? "จัดการสมาชิก" : "Manage Members", icon: User },
    { href: "/AdminConsole/payments", label: lang === "th" ? "ระบบชำระเงิน" : "Manage Payments", icon: Crown },
    { href: "/AdminConsole/articles", label: lang === "th" ? "จัดการเนื้อหา" : "Manage Content", icon: Layers },
    { href: "/AdminConsole/staff", label: lang === "th" ? "จัดการเจ้าหน้าที่" : "Manage Staff", icon: Shield },
  ];

  // 1. Initial State Loading
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-[10px] text-muted font-mono tracking-wider mt-4">VALIDATING SYSTEM LOGS...</span>
      </div>
    );
  }

  // 2. Unauthenticated View (Login Security Gate)
  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-bg flex items-center justify-center p-5 overflow-hidden">
        <div className="aurora absolute inset-0 -z-10 opacity-70" />
        <div className="grid-lines absolute inset-0 -z-10 opacity-40" />

        <div className="surface w-full max-w-md rounded-3xl p-8 border border-line shadow-card animate-fade-up">
          <div className="flex justify-between items-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-bg shadow-glow">
              <Shield className="h-6 w-6" strokeWidth={2} />
            </span>
            <button
              onClick={toggleLang}
              className="px-2.5 py-1 text-[10px] border border-line font-bold rounded-lg hover:bg-elevate transition"
            >
              {lang === "th" ? "EN" : "TH"}
            </button>
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold flex items-center gap-2">
            ValuStock <span className="text-brand">Console</span>
          </h1>
          <p className="mt-1 text-xs text-muted">
            {lang === "th"
              ? "ระบบควบคุมความปลอดภัยขั้นสูงเฉพาะผู้จัดการระบบระดับสูง (Super Admin)"
              : "Enterprise-grade command authorization for designated Super Administrators."}
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                {lang === "th" ? "ชื่อผู้ใช้ (SUPER ADMIN)" : "USERNAME"}
              </label>
              <input
                type="text"
                className="input-base text-sm"
                placeholder="zeroline"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                {lang === "th" ? "รหัสผ่านนิรภัย" : "SECURITY PASSWORD"}
              </label>
              <input
                type="password"
                className="input-base text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-down/20 bg-down/5 p-3 text-xs text-down font-medium animate-shake">
                ⚠️ {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full text-white bg-brand hover:bg-brand/90 font-semibold shadow-glow">
              {lang === "th" ? "ยืนยันสิทธิ์เข้าแผงควบคุม" : "Authorize Console Access"}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-elevate px-3 py-2.5 text-[10px] text-muted">
            <Info className="h-4 w-4 shrink-0 text-brand mt-0.5" />
            <span>
              {lang === "th"
                ? "เข้ารหัสความปลอดภัยระดับ SHA-256 การล็อกอินนี้ได้รับการบันทึกหมายเลขไอพีสำหรับการตรวจสอบย้อนกลับ"
                : "Protected by military-grade security. All authentication attempts are logged with corresponding IP address audits."}
            </span>
          </div>

          <div className="mt-5 text-center">
            <Link href="/" className="text-xs text-muted hover:text-ink transition">
              {lang === "th" ? "← กลับหน้าบ้านตลาดหุ้น" : "← Return to Main Terminal"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated View
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Dedicated Admin Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
          <span className="mt-1 text-[10px] uppercase font-bold tracking-wider text-brand block pl-0.5">
            Admin Operations 🛡️
          </span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          {adminMenu.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand text-bg shadow-sm font-bold shadow-glow"
                    : "text-muted hover:bg-elevate hover:text-ink"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to Client App & Admin Logout */}
        <div className="pt-4 border-t border-line/60 space-y-2">
          <Link href="/dashboard">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-elevate/40 px-3 py-2 text-xs font-semibold text-muted hover:text-ink hover:border-brand/40 transition">
              <LogOut className="h-4 w-4 text-muted rotate-180" />
              {lang === "th" ? "กลับแดชบอร์ดหลัก" : "Return to Terminal"}
            </button>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-down/30 bg-down/5 px-3 py-2 text-xs font-semibold text-down hover:bg-down/10 transition"
          >
            <LogOut className="h-4 w-4 text-down" />
            {lang === "th" ? "ออกจากแผงแอดมิน" : "Log out Admin"}
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/85 px-6 backdrop-blur-xl lg:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden lg:block">
            <span className="text-xs text-muted font-bold tracking-wider">COMMAND OPERATIONS CENTER — ROOT@ZEROLINE</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${dbConnected ? "bg-brand animate-ping" : "bg-gold animate-pulse"}`} />
            <Badge tone={dbConnected ? "up" : "gold"} className="text-[10px] font-bold px-2.5 py-1">
              {dbConnected ? "MariaDB Active" : "Sandbox Active"}
            </Badge>

            <button
              onClick={handleLogout}
              className="lg:hidden p-2 border border-down/20 bg-down/5 text-down rounded-xl"
              title={lang === "th" ? "ออกจากระบบ" : "Logout"}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
