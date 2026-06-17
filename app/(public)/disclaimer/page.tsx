"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { Shield, Info, Sparkles } from "@/lib/icons";

export default function DisclaimerPage() {
  const { lang } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 animate-fade-up px-4 sm:px-6">
      {/* BANNER */}
      <div className="surface rounded-2xl p-6 border border-line bg-surface/40 backdrop-blur-md relative overflow-hidden">
        <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold mb-2 inline-flex items-center gap-1">
          <Shield className="h-3 w-3" /> E-E-A-T Safety Signals
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink leading-tight">
          {lang === "th" ? "ข้อปฏิเสธความรับผิดชอบ (Disclaimer)" : "Disclaimer & Terms of Financial Use"}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 font-semibold leading-relaxed">
          {lang === "th"
            ? "ประกาศชี้แจงสถานะของข้อมูล การจำลองทางการเงิน และความเสี่ยงในการลงทุนบนแพลตฟอร์ม ValuStock"
            : "Official statements regarding data simulation, pricing risk buffers, and financial information scope on ValuStock."}
        </p>
      </div>

      <Card className="border border-line p-6 bg-surface/30 space-y-6 text-xs sm:text-sm leading-relaxed text-muted font-semibold">
        {/* SECTION 1 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "1. ข้อมูลทางการเงินเพื่อการศึกษาและการจำลอง (Educational & Simulation Scope)" : "1. Educational & Simulation Scope"}
          </h3>
          <p>
            {lang === "th"
              ? "การประเมินมูลค่าเหมาะสม (Fair Value) อัตราส่วนทางการเงิน และแบบจำลองกระแสเงินสดคิดลด (DCF) ทั้งหมดในแอปพลิเคชันนี้ เป็นการประมวลผลทางทฤษฎีการเงินเพื่อประกอบการนำเสนอซอฟต์แวร์และการเรียนรู้เท่านั้น ไม่ใช่ชุดข้อมูลการการเงินที่ได้รับใบอนุญาตชี้แนะชักชวนให้เข้าทำรายการตราสารทางการเงิน"
              : "All intrinsic target valuations (Fair Value), PE ratio evaluations, and DCF calculators provided on this platform are computed using automated financial math formulas. They represent simulated modeling results designed for software showcases and educational support only."}
          </p>
        </div>

        {/* SECTION 2 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "2. ความเสี่ยงในการจัดสรรเงินทุน (Capital Allocation Risks)" : "2. Capital Allocation Risks"}
          </h3>
          <p>
            {lang === "th"
              ? "มูลค่าในอดีตและประสิทธิภาพการเติบโตย้อนหลังของกิจการไม่ได้สะท้อนถึงการเติบโตจริงในอนาคต ข้อมูลคาดการณ์การจ่ายปันผลอาจผันแปรได้ตามสภาพตลาดและมติผู้ถือหุ้น ระบบ ValuStock ไม่รับประกันผลประโยชน์ อัตราตอบแทน หรือพ้นภัยจากวิกฤตราคาตกต่ำใด ๆ ทั้งสิ้น"
              : "Past performance records, simulated backtesting results, and historical free cash flows do not guarantee future profitability tracks. Dividend payment trends may shrink based on market volatility and management capital decisions. Users bear sole liability for allocations."}
          </p>
        </div>

        {/* SECTION 3 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "3. ความรับผิดชอบด้านการตัดสินใจ (User Liability)" : "3. User Fiduciary Responsibility"}
          </h3>
          <p>
            {lang === "th"
              ? "นักลงทุนมีหน้าที่รับผิดชอบอย่างเต็มรูปแบบในการรวบรวมข้อมูลเพิ่มเติม ตรวจสอบความถูกต้องของงบการเงิน และวิเคราะห์ความสามารถในการชำระหนี้สินของกิจการก่อนที่จะจัดพอร์ตลงทุน แนะนำปรึกษาผู้แนะนำการลงทุนหรือสถาบันการเงินที่ได้รับการรับรอง"
              : "Investors have the ultimate responsibility to compile secondary resources, verify audited financial statements, and execute solvency checks on individual securities prior to committing capital. We highly advise consulting certified financial advisors."}
          </p>
        </div>

        {/* SECTION 4 */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">
            {lang === "th" ? "4. ความสมบูรณ์ของข้อมูล (Accuracy of Data Feeds)" : "4. Accuracy of Data Feeds"}
          </h3>
          <p>
            {lang === "th"
              ? "แม้ระบบของเราจะพยายามคัดกรองข้อมูลจาก SEC EDGAR และตลาดหลักทรัพย์โดยมีมาตรฐานความล่าช้าต่ำสุด แต่เราไม่รับประกันความผิดพลาดทางเทคนิคที่อาจทำให้ตัวเลขทางการเงินสูญเสียหรือเกิดความคาดเคลื่อนจากสัญญาณตัวรับสัญญาณข้อมูลภายนอก"
              : "While our system strives to sync financial data directly from regulatory SEC EDGAR and exchange datasets with minimal latency, we do not warrant the absolute accuracy, completeness, or timeliness of third-party api feeds."}
          </p>
        </div>
      </Card>

      {/* CALL TO ACTION */}
      <div className="flex justify-center gap-4">
        <Link href="/methodology">
          <Button variant="ghost" size="sm">
            {lang === "th" ? "ดูระเบียบวิธีการคำนวณ" : "Review Our Valuation Formula"}
          </Button>
        </Link>
        <Link href="/pricing">
          <Button size="sm">
            {lang === "th" ? "สำรวจแผนบริการพรีเมียม" : "Explore Premium Features"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
