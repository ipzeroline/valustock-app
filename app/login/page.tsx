"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/translations";
import { LineChart, Shield } from "@/lib/icons";

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!email.includes("@")) return;
    login(email, mode === "register" ? name : undefined);
    router.push("/dashboard");
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

          <div className="mt-6 space-y-4">
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
            <Button className="w-full text-white bg-brand hover:bg-brand/90" onClick={submit} size="lg">
              {mode === "login" ? t("common.logIn") : t("common.signUp")}
            </Button>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-elevate px-3 py-2.5 text-xs text-muted">
            <Shield className="h-4 w-4 shrink-0 text-brand" />
            {lang === "th" 
              ? "เดโม: ระบบล็อกอินจำลอง (เก็บข้อมูลในเครื่อง) — สามารถเชื่อมต่อ OAuth / NextAuth ได้ทีหลัง"
              : "Demo Mode: local sandboxed credentials saved to memory. Supports OAuth integrations."}
          </div>

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
