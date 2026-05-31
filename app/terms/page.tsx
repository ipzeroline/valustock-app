"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import { Shield, Sparkles } from "@/lib/icons";

export default function TermsPage() {
  const { lang } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
      {/* BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Shield className="h-3 w-3" /> User Agreement
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? "ข้อตกลงการใช้งาน (Terms of Service)" : "Terms of Service & Usage"}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? "เงื่อนไข ข้อตกลง และขอบเขตการเข้าถึงซอฟต์แวร์ประเมินมูลค่าหุ้น ValuStock"
            : "Platform usage rules, subscription limits, and acceptable software behaviors on ValuStock."}
        </p>
      </div>

      <Card className="border border-line p-6 bg-surface/30 space-y-6 text-xs sm:text-sm leading-relaxed text-muted font-semibold">
        {/* SECTION 1 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "1. ข้อตกลงใบอนุญาตใช้งานระบบ (Acceptable Software Use)" : "1. Acceptable Software Use"}
          </h3>
          <p>
            {lang === "th"
              ? "ValuStock มอบสิทธิ์ในการเข้าถึงและใช้งานซอฟต์แวร์คัดกรองหุ้น คำนวณ DCF และบันทึกพอร์ตโฟลิโอแก่บัญชีส่วนบุคคล ห้ามมิให้ดึงข้อมูลในระบบด้วยสคริปต์อัตโนมัติ (Web Scraping) หรือนำผลลัพธ์ประมาณการไปแสวงหารายได้ทางการค้าโดยไม่ได้รับอนุญาต"
              : "ValuStock grants registered accounts access to stock screeners, intrinsic DCF calculation engines, and simulated portfolio tracking. Automated scraping of financial multiples or commercial distribution of platform outputs without explicit permission is strictly prohibited."}
          </p>
        </div>

        {/* SECTION 2 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "2. การจำกัดขอบเขตตามแพ็กเกจ (Subscription & Billing Terms)" : "2. Subscription & Billing Terms"}
          </h3>
          <p>
            {lang === "th"
              ? "บัญชีผู้ใช้แต่ละประเภท (Free, Premium) มีข้อจำกัดในการเข้าใช้งานฟังก์ชันของระบบที่แตกต่างกัน (เช่น ความสามารถในการเปรียบเทียบหุ้นคู่มวย ความรวดเร็วในการแสดงดัชนี) โดยเงื่อนไขค่าบริการและการยกเลิกจะถูกเรียกเก็บรอบบิลตรงตามระบบ Stripe"
              : "Access tiers (Free vs. Premium Plans) command different resource constraints (such as peer-to-peer comparisons, watchlists, or indexing updates). Subscription fees, renewals, and cancellations operate directly through Stripe billing rules."}
          </p>
        </div>

        {/* SECTION 3 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "3. การดัดแปลงและข้อจำกัดความเสียหาย (Limitation of Liability)" : "3. Limitation of Liability"}
          </h3>
          <p>
            {lang === "th"
              ? "บริษัทไม่รับผิดชอบต่อความเสียหายใด ๆ ที่เกิดขึ้นจากการตัดสินใจลงทุนที่อิงจากการคาดการณ์มูลค่าเหมาะสมในซอฟต์แวร์นี้ การใช้ประโยชน์จากตราสารใด ๆ เป็นการตัดสินความเสี่ยงโดยอิสระตามความเหมาะสมของตัวผู้ใช้เอง"
              : "ValuStock holds zero liability for capital losses, trading errors, or financial damages arising from valuation projections modeled on this website. Users interact with financial securities solely at their own financial risk."}
          </p>
        </div>
      </Card>
    </div>
  );
}
