"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import { Shield, Sparkles } from "@/lib/icons";

export default function PrivacyPage() {
  const { lang } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
      {/* BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Shield className="h-3 w-3" /> Secure Data Standards
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? "นโยบายความเป็นส่วนตัว (Privacy Policy)" : "Privacy Policy & Data Security"}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? "แนวทางการปกป้องและรักษาความปลอดภัยข้อมูลส่วนบุคคลของผู้ใช้แพลตฟอร์ม ValuStock"
            : "How we secure, encrypt, and handle user credentials and portfolio watchlists on ValuStock."}
        </p>
      </div>

      <Card className="border border-line p-6 bg-surface/30 space-y-6 text-xs sm:text-sm leading-relaxed text-muted font-semibold">
        {/* SECTION 1 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "1. ข้อมูลที่เราเก็บรวบรวม (Data We Collect)" : "1. Data We Collect"}
          </h3>
          <p>
            {lang === "th"
              ? "เพื่อให้บริการจัดพอร์ตโฟลิโอ รายการเฝ้าติดตาม และการสื่อสารบทวิเคราะห์ได้อย่างเต็มประสิทธิภาพ ระบบจะเก็บข้อมูลเท่าที่จำเป็น เช่น ชื่อ อีเมล แผนสมาชิก หลักทรัพย์ที่เพิ่มใน Watchlist รายการพอร์ต การแจ้งเตือน และอีเมลที่สมัครรับ Newsletter"
              : "To serve portfolios, watchlists, and research communication, we store only necessary data such as name, email address, membership plan, watchlist assets, portfolio entries, alerts, and newsletter subscription emails."}
          </p>
        </div>

        {/* SECTION 2 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "2. ความปลอดภัยด้านธุรกรรมและบัตรเครดิต (Payment & Subscription Security)" : "2. Payment Security"}
          </h3>
          <p>
            {lang === "th"
              ? "ระบบชำระเงินสำหรับการอัปเกรดแพ็กเกจพรีเมียม ประมวลผลผ่านผู้ให้บริการทางการเงินมาตรฐานความปลอดภัยสูงสุด (Stripe) โดย ValuStock ไม่มีนโยบายจัดเก็บและไม่มีทางสืบค้นเลขบัตรเครดิตและรหัสหลังบัตรของผู้ใช้งานอย่างเด็ดขาด"
              : "All premium plan subscription transactions are processed via secure Stripe APIs. ValuStock never accesses or stores credit card numbers, CVVs, or bank credentials. Our billing architecture complies with strict PCI-DSS regulations."}
          </p>
        </div>

        {/* SECTION 3 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "3. การเข้ารหัสและคุ้มครองข้อมูล (Data Encryption Standards)" : "3. Data Encryption Standards"}
          </h3>
          <p>
            {lang === "th"
              ? "รหัสผ่านของผู้ใช้และเซสชันการล็อกอินจะถูกแฮชและเข้ารหัสอย่างถาวรในฐานข้อมูล ข้อมูลถูกส่งผ่านโปรโตคอล HTTPS ที่มีการเข้ารหัส 256-bit SSL ตลอดการใช้งานซอฟต์แวร์"
              : "Passwords and login sessions are cryptographically hashed and isolated in our database. All data in transit is protected using 256-bit Secure Sockets Layer (SSL) encryption through the HTTPS protocol."}
          </p>
        </div>
      </Card>
    </div>
  );
}
