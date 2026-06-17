import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg px-5 py-12 text-ink">
      <section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          ลิงก์นี้อาจถูกย้ายหรือไม่มีอยู่ในระบบ ValuStock
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-bold text-bg transition hover:bg-brand/90"
        >
          กลับหน้าแรก
        </Link>
      </section>
    </main>
  );
}
