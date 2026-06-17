"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route render error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-bg px-5 py-12 text-ink">
      <section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">System status</p>
        <h1 className="mt-3 font-display text-2xl font-bold">ไม่สามารถแสดงข้อมูลได้ในขณะนี้</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          ระบบพบปัญหาระหว่างประมวลผลข้อมูล กรุณาลองใหม่อีกครั้ง
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-bg transition hover:bg-brand/90"
        >
          โหลดข้อมูลอีกครั้ง
        </button>
      </section>
    </main>
  );
}
