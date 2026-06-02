"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { LineChart, AlertTriangle } from "@/lib/icons";
import { useTranslation } from "@/lib/translations";
import Link from "next/link";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, lang } = useStore();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const verifyCalled = useRef(false);

  useEffect(() => {
    // Prevent duplicate verification in React StrictMode
    if (verifyCalled.current) return;
    verifyCalled.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError(
        lang === "th"
          ? "ไม่พบรหัสยืนยันตัวตนสำหรับการล็อกอิน"
          : "Authentication token was not found"
      );
      return;
    }

    // Verify token with server
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Verification response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.email) {
          // Log in user on client with backend verified data
          login(data.email, data.name, data.plan, data.billing, token);
          
          // Smooth redirect to dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
        } else {
          setError(
            lang === "th"
              ? "การยืนยันโทเค็นไม่สำเร็จ โปรดลองใหม่อีกครั้ง"
              : "Token verification failed. Please try again."
          );
        }
      })
      .catch((err) => {
        console.error("Token verification error:", err);
        setError(
          lang === "th"
            ? "การเชื่อมต่อกับระบบเซิร์ฟเวอร์ล้มเหลว"
            : "Failed to connect to authentication server"
        );
      });
  }, [searchParams, login, router, lang]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center">
      <div className="aurora absolute inset-0 -z-10 opacity-70 animate-pulse" />
      <div className="grid-lines absolute inset-0 -z-10 opacity-50" />
      
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-5">
        <div className="surface rounded-3xl p-10 w-full shadow-card border border-line bg-elevate/45 backdrop-blur-xl animate-fade-up text-center flex flex-col items-center">
          
          {!error ? (
            <>
              {/* Spinner Container with Dynamic Gradient Glow */}
              <div className="relative flex items-center justify-center h-24 w-24">
                <div className="absolute inset-0 rounded-full border-4 border-brand/20 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-t-4 border-brand animate-spin" />
                <div className="absolute -inset-1 rounded-full bg-brand/10 filter blur-sm animate-pulse" />
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-bg shadow-glow relative z-10">
                  <LineChart className="h-7 w-7 animate-bounce" strokeWidth={2.5} />
                </span>
              </div>
              
              <h2 className="mt-8 font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-ink to-ink/75 bg-clip-text text-transparent">
                {lang === "th" ? "กำลังตรวจสอบความปลอดภัย..." : "Verifying credentials..."}
              </h2>
              <p className="mt-2 text-sm text-muted animate-pulse">
                {lang === "th"
                  ? "ยินดีต้อนรับสู่ระบบประเมินหุ้น ValuStock"
                  : "Welcome to ValuStock Valuation Network"}
              </p>
            </>
          ) : (
            <>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="h-8 w-8" />
              </div>
              
              <h2 className="mt-6 font-display text-xl font-bold text-ink">
                {lang === "th" ? "การเข้าสู่ระบบล้มเหลว" : "Authentication Failed"}
              </h2>
              <p className="mt-2 text-sm text-rose-400 font-medium px-4">
                {error}
              </p>
              
              <div className="mt-8 w-full flex flex-col gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-brand text-bg font-semibold hover:brightness-110 shadow-glow transition-all w-full"
                >
                  {lang === "th" ? "กลับไปหน้าล็อกอิน" : "Back to Login"}
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-line text-muted font-semibold hover:text-ink hover:bg-elevate transition-all w-full"
                >
                  {lang === "th" ? "← กลับหน้าแรก" : "← Back to Homepage"}
                </Link>
              </div>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center">
        <div className="aurora absolute inset-0 -z-10 opacity-70 animate-pulse" />
        <div className="grid-lines absolute inset-0 -z-10 opacity-50" />
        <div className="text-muted animate-pulse">Verifying Google authentication...</div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
