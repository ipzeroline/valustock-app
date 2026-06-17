"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/translations";
import { LineChart, Shield, AlertTriangle } from "@/lib/icons";

function LoginContent() {
  const { login } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const { t, lang } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const demoAuthEnabled = process.env.NODE_ENV !== "production";

  const submit = async () => {
    if (!demoAuthEnabled) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setFormError(lang === "th" ? "กรุณากรอกอีเมลให้ถูกต้อง" : "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          name: mode === "register" ? name : undefined,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.detail || payload?.error || "Login failed");
      }

      const payload = await res.json();
      login(payload.email || normalizedEmail, payload.name || (mode === "register" ? name : undefined), payload.plan, payload.billing);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setFormError(
        lang === "th"
          ? `เข้าสู่ระบบไม่สำเร็จ: ${message}`
          : `Login failed: ${message}`,
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  };

  const startGoogleLogin = async () => {
    setIsSubmitting(true);
    setFormError("");
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="aurora absolute inset-0 -z-10 opacity-70" />
      <div className="grid-lines absolute inset-0 -z-10 opacity-50" />
      <div className="mx-auto flex max-w-md flex-col justify-center px-5 py-16">
        <div className="surface rounded-3xl p-8 shadow-card animate-fade-up">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-bg shadow-glow">
            <LineChart className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">
            {mode === "login" ? t("common.logIn") : t("common.signUp")}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {mode === "login"
              ? (lang === "th" ? "ยินดีต้อนรับกลับสู่ ValuStock" : "Welcome back to ValuStock")
              : (lang === "th" ? "เริ่มประเมินมูลค่าหุ้นได้ฟรีทันที" : "Start evaluating global stock valuations instantly")}
          </p>

          {/* OAuth Error Notification */}
          {errorParam && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>
                {errorParam === "oauth_failed"
                  ? (lang === "th" ? "การยืนยันตัวตนผ่าน Google ล้มเหลว กรุณาลองใหม่อีกครั้ง" : "Google authentication failed. Please try again.")
                  : errorParam === "google_not_configured"
                  ? (lang === "th" ? "ยังไม่ได้ตั้งค่า Google OAuth สำหรับระบบเข้าสู่ระบบ" : "Google OAuth is not configured for sign-in.")
                  : errorParam === "missing_code"
                  ? (lang === "th" ? "ไม่พบรหัสยืนยันตัวตนจาก Google" : "Authorization code from Google was missing.")
                  : (lang === "th" ? "เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองใหม่อีกครั้ง" : "An authentication error occurred. Please try again.")}
              </span>
            </div>
          )}

          {formError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {demoAuthEnabled && (
              <>
                {mode === "register" && (
                  <Field label={lang === "th" ? "ชื่อของคุณ" : "Full Name"}>
                    <input
                      className="input-base"
                      placeholder={lang === "th" ? "ชื่อผู้ใช้" : "John Doe"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                )}
                <Field label={lang === "th" ? "อีเมล" : "Email Address"}>
                  <input
                    className="input-base"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label={lang === "th" ? "รหัสผ่าน" : "Password"}>
                  <input
                    className="input-base"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Button className="w-full text-white bg-brand hover:bg-brand/90" onClick={submit} size="lg" disabled={isSubmitting}>
                  {isSubmitting
                    ? lang === "th"
                      ? "กำลังเข้าสู่ระบบ..."
                      : "Signing in..."
                    : mode === "login"
                    ? t("common.logIn")
                    : t("common.signUp")}
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-line"></div>
                  <span className="flex-shrink mx-4 text-xs text-muted uppercase tracking-wider font-semibold">
                    {lang === "th" ? "หรือ" : "or"}
                  </span>
                  <div className="flex-grow border-t border-line"></div>
                </div>
              </>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={startGoogleLogin}
              type="button"
              disabled={isSubmitting}
              className="w-full h-12 px-6 text-sm font-semibold rounded-xl border border-line bg-elevate hover:bg-line/40 text-ink transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.45 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.98 -3.3,0.98 -2.34,0 -4.33,-1.58 -5.03,-3.7H2.93v2.7C4.42,18.78 8.02,20.6 12,20.6z" fill="#34A853" />
                  <path d="M6.97,13.08a5.13,5.13 0 0 1 0,-3.16V7.22H2.93a8.99,8.99 0 0 0 0,9.56l4.04,-3.7z" fill="#FBBC05" />
                  <path d="M12,7.38c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,4.72 14.43,3.9 12,3.9c-3.98,0 -7.58,1.82 -9.07,4.82l4.04,3.16c0.7,-2.12 2.69,-3.7 5.03,-3.7z" fill="#EA4335" />
                </g>
              </svg>
              <span>
                {mode === "login"
                  ? (lang === "th" ? "เข้าสู่ระบบด้วย Google" : "Sign in with Google")
                  : (lang === "th" ? "สมัครสมาชิกด้วย Google" : "Sign up with Google")}
              </span>
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-elevate px-3 py-2.5 text-xs text-muted">
            <Shield className="h-4 w-4 shrink-0 text-brand" />
            {demoAuthEnabled
              ? lang === "th"
                ? "เดโม: สามารถเข้าสู่ระบบด้วยบัญชีใดก็ได้ หรือคลิกปุ่มด้านบนเพื่อเชื่อมต่อบัญชี Google ของคุณ"
                : "Demo Mode: type any email to test, or click above to link your real Google account."
              : lang === "th"
                ? "Production: เข้าสู่ระบบด้วย Google OAuth เท่านั้น เพื่อยืนยันตัวตนและออก session token ที่ปลอดภัย"
                : "Production: sign in with Google OAuth only, so ValuStock can issue a verified secure session token."}
          </div>

          {demoAuthEnabled && (
            <p className="mt-5 text-center text-sm text-muted">
              {mode === "login" 
                ? (lang === "th" ? "ยังไม่มีบัญชี?" : "Don't have an account?") 
                : (lang === "th" ? "มีบัญชีอยู่แล้ว?" : "Already have an account?")}{" "}
              <button
                className="font-semibold text-brand hover:underline"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? (lang === "th" ? "สมัครฟรี" : "Sign Up Free") : t("common.logIn")}
              </button>
            </p>
          )}
        </div>
        <Link
          href="/"
          className="mt-6 text-center text-sm text-muted hover:text-ink transition"
        >
          {lang === "th" ? "← กลับหน้าแรก" : "← Back to Homepage"}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center">
        <div className="aurora absolute inset-0 -z-10 opacity-70" />
        <div className="grid-lines absolute inset-0 -z-10 opacity-50" />
        <div className="text-muted animate-pulse">Loading login screen...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
