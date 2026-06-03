"use client";

import { useState, useMemo, Fragment, useEffect } from "react";
import Link from "next/link";
import { useStore, useCurrentPlan } from "@/lib/store";
import { getStock } from "@/lib/stocks";
import { StockCard } from "@/components/StockCard";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/translations";
import { AssetLogo } from "@/components/AssetLogo";
import { QuoteLoadingCard } from "@/components/QuoteLoading";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { baht, dollar, pct } from "@/lib/format";
import { Stock } from "@/lib/types";
import { hasQuoteProvider, useLiveQuotes } from "@/lib/realtime-quotes";
import { 
  Star, 
  Search, 
  Crown, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar,
  Shield,
  CheckCircle,
} from "@/lib/icons";

interface IntradaySession {
  hours: string;
  nameTh: string;
  nameEn: string;
  statusTh: string;
  statusEn: string;
  score: number; // 0 to 100
  recommendationTh: string;
  recommendationEn: string;
}

interface TimingAdvice {
  bestDay: string;
  bestDayIndex: number; // 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
  bestPeriod: string;
  verdict: "Strong Buy" | "Accumulate" | "Hold" | "Avoid";
  verdictTh: "ซื้อขั้นสุด (Strong Buy)" | "ทยอยสะสม (Accumulate)" | "ถือรอจังหวะ (Hold)" | "หลีกเลี่ยง (Avoid)";
  rationale: string;
  rationaleEn: string;
  bestHoursTh: string;
  bestHoursEn: string;
  strategyTh: string;
  strategyEn: string;
  strategyDetailsTh: string;
  strategyDetailsEn: string;
  weeklyScores: number[]; // Array of 7 numbers [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  intradayTimeline: IntradaySession[];
  thaiMarketNotes: string[]; // Specific tips for Thai retail traders
}

function getTimingRecommendation(stock: Stock, mos: number, lang: string): TimingAdvice {
  let bestDay = "";
  let bestDayIndex = 0;
  let bestPeriod = "";
  let rationale = "";
  let rationaleEn = "";
  let bestHoursTh = "";
  let bestHoursEn = "";
  let weeklyScores = [50, 50, 50, 50, 50, 10, 10]; // Mon-Sun
  let intradayTimeline: IntradaySession[] = [];
  let thaiMarketNotes: string[] = [];

  const type = stock.assetType || "TH_STOCK";
  const sector = stock.sector || "";
  const market = stock.market || "SET";

  if (type === "CRYPTO") {
    bestDay = lang === "th" ? "วันอาทิตย์" : "Sunday";
    bestDayIndex = 6;
    bestPeriod = lang === "th" ? "ช่วงปรับฐาน FUD Cycles" : "Deep Correction FUD Cycles";
    rationale = "ตลาดคริปโตฯ สถิติชี้ว่าวันหยุดสุดสัปดาห์โดยเฉพาะคืนวันอาทิตย์ สภาพคล่องจะแห้งตัวลงและมักเกิดแรงตื่นตระหนกย่อย (Panic Dips) ก่อนเปิดสัปดาห์ใหม่";
    rationaleEn = "Crypto markets statistically exhibit thin liquidity on Sunday nights, often yielding temporary panic dips before the new week begins.";
    bestHoursTh = "23:00 - 04:00 น. (ช่วงดึกฝั่งตะวันตก)";
    bestHoursEn = "23:00 - 04:00 (Western Peak Hour)";
    weeklyScores = [65, 60, 55, 50, 60, 80, 95];
    intradayTimeline = [
      {
        hours: "08:00 - 10:00",
        nameTh: "เปิดตลาดเอเชียรายวัน",
        nameEn: "Daily Asian Open",
        statusTh: "ผันผวนปานกลาง",
        statusEn: "Moderate Volatility",
        score: 65,
        recommendationTh: "ทิศทางราคาเริ่มสะท้อนจากข่าวสารช่วงดึก เหมาะสำหรับการเก็บตกสั้นๆ",
        recommendationEn: "Prices reflect overnight news. Suitable for catching daily trend shifts."
      },
      {
        hours: "16:00 - 19:00",
        nameTh: "เปิดทำการตลาดยุโรป",
        nameEn: "European Session Open",
        statusTh: "สภาพคล่องคงที่",
        statusEn: "Stable Liquidity",
        score: 75,
        recommendationTh: "วอลุ่มฝั่งยุโรปและตะวันออกกลางดันดัชนีค่อนข้างเสถียร ซื้อสะสมได้เรื่อยๆ",
        recommendationEn: "European/Middle-East volumes stabilize prices, offering standard entry ranges."
      },
      {
        hours: "23:00 - 04:00",
        nameTh: "ชั่วโมงเดือดวาฬสหรัฐฯ",
        nameEn: "US Whale Dominance Session",
        statusTh: "🔥 แนะนำสูงสุด (ช้อนซื้อจุดย่อ)",
        statusEn: "Highly Recommended (Dips)",
        score: 95,
        recommendationTh: "ช่วงเวลาที่มีสภาพคล่องและวาฬฝั่งสหรัฐกดดันราคาสูงสุด เหมาะกับการดักซื้อราคาส่วนลดตาม Limit Order",
        recommendationEn: "US Whales and institutional players drive liquidity. Best for catching leverage liquidations."
      }
    ];
    thaiMarketNotes = [
      "ตลาดสินทรัพย์ดิจิทัลเปิด 24 ชม. แต่แรงดันราคาสูงสุดมักอยู่ในช่วงค่ำและกลางดึกประเทศไทยเนื่องจากแรงซื้อขายในตลาดสหรัฐอเมริกา",
      "ควรใช้กลยุทธ์ตั้งราคารับลึก (Limit Order) สองระดับ (เช่น -3% และ -5% จากราคาปัจจุบัน) ในวันหยุดสุดสัปดาห์ เพื่อเก็บตกราคาชำระบัญชีล้างเลเวอเรจ",
      "หลีกเลี่ยงการไล่ราคาในช่วงเช้าวันอังคารและพุธซึ่งมักเป็นช่วงที่มีแรงเก็งกำไรดันราคาสูงสุดของรอบสัปดาห์"
    ];
  } else if (type === "FUTURES") {
    bestDay = lang === "th" ? "วันพฤหัสบดี" : "Thursday";
    bestDayIndex = 3;
    bestPeriod = lang === "th" ? "ช่วงทำรายการส่งมอบ Rollover" : "Rollover Contract Switch";
    rationale = "ราคาสัญญาล่วงหน้ามักถูกกดดันหรือปิดความเสี่ยงปรับฐานพอร์ต (Margin Liquidation) ก่อนหยุดสุดสัปดาห์ ทำให้วันพฤหัสบดีได้เปรียบสุด";
    rationaleEn = "Futures contracts undergo risk-mitigation rebalancing before weekends, making Thursdays highly efficient for securing leveraged entries.";
    bestHoursTh = "16:00 - 16:55 น. (ก่อนปิดช่วงบ่าย) และ 20:30 - 22:30 น. (ช่วงตลาดโภคภัณฑ์อเมริกาเปิด)";
    bestHoursEn = "16:00 - 16:55 (Pre-Close) & 20:30 - 22:30 (US Commodities Open)";
    weeklyScores = [55, 65, 80, 95, 40, 10, 10];
    intradayTimeline = [
      {
        hours: "09:45 - 10:30",
        nameTh: "เปิดตลาดสัญญารอบเช้า",
        nameEn: "Morning Derivatives Open",
        statusTh: "ผันผวนตามเซนติเมนต์",
        statusEn: "Sentiment-driven Volatility",
        score: 80,
        recommendationTh: "ช่วงสำคัญในการดูปฏิกิริยาต่อราคาทองคำ/น้ำมันของต่างประเทศเมื่อคืน สะสมได้ดีหากทิศทางชัด",
        recommendationEn: "Reacts directly to overnight commodities. Good entry if clear trend emerges."
      },
      {
        hours: "16:00 - 16:55",
        nameTh: "ชั่วโมงทำราคาปิดเย็น (ATC / Rollover)",
        nameEn: "Closing & Rollover Session",
        statusTh: "💎 นาทีทองทำราคาปิด",
        statusEn: "Institutional ATC Window",
        score: 95,
        recommendationTh: "กองทุนล้างสถานะและส่งต่องวดสัญญา (Rollover) สเปรดราคาแคบ ต้นทุนเบลนด์เสถียรที่สุด",
        recommendationEn: "Funds adjust weights and rollover contracts. Offers tight spreads and reliable average cost."
      },
      {
        hours: "19:30 - 22:30",
        nameTh: "โภคภัณฑ์สหรัฐเดือด (ข่าวสหรัฐ)",
        nameEn: "US Prime Commodity Time",
        statusTh: "ผันผวนลึกเพื่อดักช้อน",
        statusEn: "Deep Volatility Dips",
        score: 90,
        recommendationTh: "ช่วงทองคำและน้ำมันดิบแกว่งตัวรุนแรงจากการประกาศตัวเลขดัชนีเศรษฐกิจสหรัฐฯ เหมาะตั้งซื้อที่แนวรับแข็งแกร่ง",
        recommendationEn: "High-impact US macro announcements. Best for executing long setups on deep local support lines."
      }
    ];
    thaiMarketNotes = [
      "หลีกเลี่ยงการถือครองสัญญาซีรี่ส์ที่จะหมดอายุในเดือนปัจจุบันในช่วง 3 วันสุดท้าย แนะนำให้เปลี่ยนไปใช้สัญญาซีรี่ส์ถัดไปล่วงหน้า",
      "การสะสมสัญญาล่วงหน้า (Futures) ควรเตรียมส่วนเผื่อเงินค้ำประกัน (Margin Reserve) อย่างน้อย 3-4 เท่าของเงินประกันขั้นต้น (IM) เพื่อป้องกันความผันผวนช่วงปลายสัปดาห์",
      "สังเกตค่าพรีเมียม / ส่วนลด (Basis) ของราคาสัญญาล่วงหน้ากับราคาสปอต เพื่อหาจุดสเปรดปิดงบที่คุ้มค่าที่สุด"
    ];
  } else if (type === "FUND" || type === "US_FUND") {
    bestDay = lang === "th" ? "วันอังคาร" : "Tuesday";
    bestDayIndex = 1;
    bestPeriod = lang === "th" ? "ช่วงทำราคาสิ้นไตรมาส (Window Dressing)" : "Quarter-End Rebalancing";
    rationale = "การซื้อกองทุนช่วงกลางสัปดาห์ช่วยหลีกเลี่ยงความผันผวนจากออร์เดอร์ค้างของต่างประเทศและเลี่ยงพฤติกรรมการแย่งซื้อของพนักงานช่วงต้น/สิ้นเดือน";
    rationaleEn = "Buying mutual funds mid-week bypasses excessive backlogs and inflated NAV entries caused by employee payroll DCA schedules.";
    bestHoursTh = "13:00 - 15:30 น. (วินาทีสุดท้ายก่อน Cut-off)";
    bestHoursEn = "13:00 - 15:30 (Final Cut-off Hour)";
    weeklyScores = [70, 95, 80, 90, 50, 10, 10];
    intradayTimeline = [
      {
        hours: "10:00 - 12:00",
        nameTh: "ส่งยอดสั่งซื้อรอบเช้า",
        nameEn: "Morning Processing Window",
        statusTh: "ดำเนินการรวดเร็ว",
        statusEn: "Fast Processing Queue",
        score: 80,
        recommendationTh: "ส่งคำสั่งช่วงเช้าลดความเสี่ยงระบบขัดข้องของธนาคาร และรับประกันการทำรายการเสร็จสิ้นในวันเดียวกัน",
        recommendationEn: "Secures prompt queue with zero system lag risk. Guarantees same-day NAV assignment."
      },
      {
        hours: "13:00 - 15:30",
        nameTh: "โค้งสุดท้ายคำนวณ NAV",
        nameEn: "Final Cut-off Golden Hour",
        statusTh: "🔥 แนะนำสูงสุด (เห็นราคาตลาดโลก)",
        statusEn: "Highly Recommended (Global Visibility)",
        score: 95,
        recommendationTh: "ชั่วโมงสุดท้ายก่อนปิดระบบ ช่วยให้ประเมินทิศทางดัชนีเอเชียและยุโรปช่วงบ่ายเพื่อกะเกณฑ์มูลค่าเหมาะสมในวันนี้",
        recommendationEn: "Assess midday global market directions before local systems shut down to secure an informed trade."
      }
    ];
    thaiMarketNotes = [
      "กองทุนรวมใช้วิธีจับราคาปิดเฉลี่ย NAV สิ้นวัน ดังนั้นจังหวะนาทีทองที่ดีที่สุดคือการรอประเมินดัชนีตลาดหุ้นเกณฑ์หลักช่วงบ่ายก่อนกดยืนยันรายการ",
      "การทำ DCA สะสมกองทุนรวมรายเดือน แนะนำตั้งเวลาในวันที่ 14-18 ของเดือน แทนการตั้งสิ้นปีหรือสิ้นเดือน เพื่อเลี่ยงจุดราคา NAV โป่งพองชั่วคราว",
      "สำหรับกองทุนต่างประเทศ (FIF) โปรดตรวจสอบวันหยุดธนาคารฝั่งต่างประเทศเพื่อหลีกเลี่ยงเหตุการณ์เงินกองทุนดองค้างและสูญเสียโอกาสเก็งกำไร"
    ];
  } else if (type === "ETF") {
    bestDay = lang === "th" ? "วันอังคาร" : "Tuesday";
    bestDayIndex = 1;
    bestPeriod = lang === "th" ? "ช่วงนอกปฏิทิน DCA หนาแน่น (15-18 ของเดือน)" : "Off-Peak DCA Calendar Window";
    rationale = "ETF ซื้อขายแบบเรียลไทม์ หลีกเลี่ยงวันจันทร์และวันศุกร์ที่มีความผันผวนของการชำระเงินของรายย่อยและนักเทรดระยะสั้นสะสมพอร์ตข้ามสัปดาห์";
    rationaleEn = "Avoid Monday open volatility and Friday close liquidations. Tuesdays offer the most stable intraday tracking accuracy.";
    bestHoursTh = "10:00 - 11:00 น. (เปิดเช้า) หรือ 16:00 - 16:30 น. (ปิดตลาดเย็น)";
    bestHoursEn = "10:00 - 11:00 (Morning Open) & 16:00 - 16:30 (Closing Auction)";
    weeklyScores = [75, 95, 85, 70, 50, 10, 10];
    intradayTimeline = [
      {
        hours: "10:00 - 11:00",
        nameTh: "เปิดตลาดและผู้ดูแลสภาพคล่องพร้อม",
        nameEn: "Market Maker Activation",
        statusTh: "🔥 แนะนำสูงสุด (สเปรดแคบ)",
        statusEn: "Highly Recommended (Tight Spreads)",
        score: 95,
        recommendationTh: "ช่วงที่ผู้ดูแลสภาพคล่อง (Market Maker) เริ่มอ้างอิงราคา NAV จริงได้ชัดเจนที่สุดและเสนอสเปรดราคาที่แคบและคุ้มค่าที่สุด",
        recommendationEn: "Market makers actively post bids matching true asset value. Offers best retail execution."
      },
      {
        hours: "11:00 - 15:30",
        nameTh: "ช่วงสยบราคาระหว่างวัน",
        nameEn: "Intraday Price Sideways",
        statusTh: "นิ่งสงบ ปริมาณการซื้อขายต่ำ",
        statusEn: "Quiet & Low Volume",
        score: 70,
        recommendationTh: "ราคาแกว่งตัวในกรอบแคบๆ ไม่ค่อยมีความเคลื่อนไหวโดดเด่น เหมาะสำหรับ Limit Order ปลายช่อง",
        recommendationEn: "Low trading activity and flat ranges. Excellent for executing resting limit orders."
      },
      {
        hours: "16:00 - 16:30",
        nameTh: "นาทีทองก่อนปิดตลาด (ATC)",
        nameEn: "Pre-Closing Auction Hour",
        statusTh: "💎 แนะนำสูงสุดสำหรับ DCA ยอดรวม",
        statusEn: "Optimal Index Average closing",
        score: 90,
        recommendationTh: "ปริมาณซื้อขายหนาแน่นช่วงท้ายวัน ช่วยให้นักลงทุนเก็บสะสมเฉลี่ยปิดได้ราคาที่ล้อตามดัชนีเกณฑ์เปรียบเทียบดีที่สุด",
        recommendationEn: "Heavy closing volumes ensure final fill prices are closely tied to the benchmark index NAV."
      }
    ];
    thaiMarketNotes = [
      "ควรหลีกเลี่ยงการส่งคำสั่งซื้อแบบรีบร้อนทันที (Market Order) ใน 15 นาทีแรกหลังจากตลาดเปิดทำการ เพราะราคาเสนอซื้อ/เสนอขายอาจจะยังไม่สมดุล",
      "ตรวจสอบปริมาณหุ้นของผู้ดูแลสภาพคล่องในกระดานเสมอ เพื่อป้องกันปัญหาสเปรดราคากระโดดสูงเกินจริงจากการไล่เคาะฝั่งขวา",
      "ETF ในกระดานไทยที่อ้างอิงดัชนีต่างประเทศ (เช่น China, US, Japan) มักมีราคาพรีเมียมจากค่าเงินและการเหลื่อมล้ำของเวลาตั้งใจดูจังหวะที่เหมาะสม"
    ];
  } else {
    // TH_STOCK (Default Equities / Thai Stocks) & US_STOCK
    const isUS = market === "NASDAQ" || market === "NYSE" || stock.currency === "USD";
    const isTech = sector.includes("เทคโนโลยี") || market === "NASDAQ";

    if (isUS) {
      if (isTech) {
        bestDay = lang === "th" ? "วันพุธ" : "Wednesday";
        bestDayIndex = 2;
        bestPeriod = lang === "th" ? "หลังประกาศงบเสร็จสิ้น (Post-Earnings)" : "Post-Earnings Season Dips";
        rationale = "หุ้นเทคโนโลยีสหรัฐมักมีความผันผวนสูง การซื้อกลางสัปดาห์หลังแรงเก็งกำไรในวันจันทร์-อังคารเบาบางลง มักได้ราคาปิดย่อที่ดีที่สุด";
        rationaleEn = "High-growth tech giants digest volatility early in the week. Mid-week (Wednesday) entries capture excellent cooling off ranges.";
        bestHoursTh = "20:30 - 21:30 น. (เปิดตลาดสหรัฐฯ)";
        bestHoursEn = "20:30 - 21:30 (US Market Open)";
        weeklyScores = [60, 75, 95, 80, 45, 10, 10];
      } else {
        bestDay = lang === "th" ? "วันอังคาร" : "Tuesday";
        bestDayIndex = 1;
        bestPeriod = lang === "th" ? "ช่วงปรับสมดุลสถาบันใหญ่" : "Institutional Flow Rebalancing";
        rationale = "หุ้นบลูชิปขนาดใหญ่ของสหรัฐฯ มักถูกสถาบันการเงินดันราคาในวันจันทร์และวันพฤหัสบดี การเข้าสะสมวันอังคารจะได้จังหวะที่แรงดันผ่อนคลาย";
        rationaleEn = "Defensive US giants see heavy buy/sell program executions at week open. Tuesdays generally offer the lowest friction entry.";
        bestHoursTh = "02:00 - 03:00 น. (ชั่วโมงทองปิดตลาดสหรัฐฯ)";
        bestHoursEn = "02:00 - 03:00 (US Closing Session)";
        weeklyScores = [70, 95, 85, 75, 50, 10, 10];
      }
      
      intradayTimeline = [
        {
          hours: "19:30 - 20:30",
          nameTh: "ตลาดล่วงหน้าต่างประเทศ (Pre-Market)",
          nameEn: "US Pre-Market Window",
          statusTh: "สภาพคล่องต่ำ - ผันผวน",
          statusEn: "Thin Liquidity & Speculative",
          score: 40,
          recommendationTh: "ไม่แนะนำสำหรับนักลงทุนทั่วไปเนื่องจากส่วนต่างราคา (Spread) กว้างและมีความเสี่ยงของความคลาดเคลื่อนสูง",
          recommendationEn: "Wide bid-ask spreads. Highly speculative, recommended to avoid unless trading news catalysts."
        },
        {
          hours: "20:30 - 21:30",
          nameTh: "นาทีทองระเบิดวอลุ่มเปิดตลาดเช้า",
          nameEn: "US Opening Bell Session",
          statusTh: "🔥 แนะนำสูงสุด (สภาพคล่องระดับโลก)",
          statusEn: "Highly Recommended (Peak liquidity)",
          score: 95,
          recommendationTh: "ช่วงชั่วโมงแรกที่ตลาดเปิด สถาบันและรายย่อยเข้าออร์เดอร์พร้อมกันทั่วโลก เหมาะอย่างยิ่งในการช้อนซื้อแนวรับสำคัญ",
          recommendationEn: "Global capital flows peak. The highest volatility and liquidity, perfect for executing major entries."
        },
        {
          hours: "02:00 - 03:00",
          nameTh: "นาทีสุดท้ายปิดทำการสหรัฐฯ (Power Hour)",
          nameEn: "US Power Hour Closing",
          statusTh: "💎 วอลุ่มสะสมสถาบันนิ่งที่สุด",
          statusEn: "Stable Institutional Indexing",
          score: 90,
          recommendationTh: "กองทุนดัชนีและ ETF รวบรวมหุ้นล๊อตใหญ่เพื่อปิดราคาวัน ราคาในช่วงนี้สะท้อนพื้นฐานที่แท้จริงประจำวันอย่างเที่ยงตรง",
          recommendationEn: "Index funds bundle trades to match daily benchmark close. Highly reliable average cost entries."
        }
      ];
      
      thaiMarketNotes = [
        "เวลาสหรัฐฯ ห่างจากไทยค่อนข้างมาก แนะนำตั้งคำสั่งจำกัดราคา (Limit Order) หรือคำสั่งชนิด GTC (Good Till Cancelled) เผื่อราคาเหวี่ยงโดนในช่วงกลางดึก",
        "ปฏิทินเวลาของสหรัฐฯ จะมีการปรับเข้าสู่ Daylight Saving Time (ปรับเวลาเปิดเร็วขึ้น 1 ชม. ในช่วงเดือน มี.ค. - พ.ย. เป็น 20:30 น. แทนที่จะเป็น 21:30 น.)",
        "ระวังความผันผวนใหญ่ในช่วงสัปดาห์ประกาศผลประกอบการรายไตรมาส (Earnings Season) แนะนำช้อนซื้อหลังจบงานแถลงข่าวหากราคาร่วงเกินจริง"
      ];
    } else {
      // TH_STOCK (Thai Stock Market SET/mai)
      if (isTech) {
        bestDay = lang === "th" ? "วันพุธ" : "Wednesday";
        bestDayIndex = 2;
        bestPeriod = lang === "th" ? "ช่วงพักตัวนิ่งงดกิจกรรมเก็งกำไร" : "Mid-Week Volume Cooling Off";
        rationale = "หุ้นเติบโตและหุ้นขนาดเล็กขนาดกลางฝั่งไทย มักผันผวนรุนแรงตามตลาดต่างประเทศในช่วงเปิดสัปดาห์ วันพุธเป็นช่วงที่เก็งกำไรนิ่งลงทำให้ได้ราคาที่เหมาะสม";
        rationaleEn = "Growth and mid-cap Thai stocks cool down in speculation mid-week. Wednesdays yield the most disciplined entry setups.";
        bestHoursTh = "10:00 - 11:00 น. (เปิดตลาดเช้า)";
        bestHoursEn = "10:00 - 11:00 (Morning Open Session)";
        weeklyScores = [55, 75, 95, 80, 45, 10, 10];
      } else {
        bestDay = lang === "th" ? "วันจันทร์" : "Monday";
        bestDayIndex = 0;
        bestPeriod = lang === "th" ? "หลังขึ้นป้ายประกาศจ่ายปันผล (Post-XD Dip)" : "Post-Dividend XD Dip";
        rationale = "หุ้นปันผลขนาดใหญ่และมั่นคงมักมียอดขายย่อตัวเพื่อปรับลดราคาลงในวันจันทร์หลังได้รับปัจจัยข่าวสารเสาร์อาทิตย์และหลังการ XD จ่ายหุ้นคืน";
        rationaleEn = "Defensive Thai dividend giants adjust down on Mondays following weekend news digestion or post-dividend ex-dates (XD discount).";
        bestHoursTh = "16:00 - 16:30 น. (ช่วงปิดบ่ายสถาบันเคาะ ATC)";
        bestHoursEn = "16:00 - 16:30 (Afternoon Closing Auction ATC)";
        weeklyScores = [95, 80, 70, 65, 50, 10, 10];
      }
      
      intradayTimeline = [
        {
          hours: "09:30 - 10:00",
          nameTh: "ช่วงจับคู่ราคาสุ่มตลาด (ATO / Pre-Open)",
          nameEn: "ATO / Pre-Open Auction",
          statusTh: "⚠️ ผันผวนรุนแรงมาก - โปรดระวัง",
          statusEn: "Extremely High Volatility - Caution",
          score: 30,
          recommendationTh: "ไม่แนะนำให้นักลงทุนรายย่อยเคาะขวาแบบ Market Order ในช่วงนี้ สุ่มเสี่ยงที่จะได้ราคาดอยยอดวันจากการลากราคาสถาบัน",
          recommendationEn: "Avoid buying at the market price right now. Bid matching calculations can result in short-term price spikes."
        },
        {
          hours: "10:00 - 11:00",
          nameTh: "ชั่วโมงทองสกัดดัชนีรอบเช้า",
          nameEn: "Morning Liquidity Golden Hour",
          statusTh: "🔥 แนะนำสูงสุด (ตลาดโปร่งใสสุด)",
          statusEn: "Highly Recommended (Transparent Volume)",
          score: 90,
          recommendationTh: "จังหวะเข้าทำรายการที่ปลอดภัยที่สุด ทิศทางราคาเริ่มคงที่ สะท้อนตลาดเพื่อนบ้านเอเชียและพร้อมรับความต้องการจริงจากนักลงทุนท้องถิ่น",
          recommendationEn: "Safest entry slot. Regional Asian markets are fully pricing in overnight catalysts and volumes are healthy."
        },
        {
          hours: "11:00 - 12:30",
          nameTh: "ช่วงตลาดซบเซา (สาย-เที่ยง)",
          nameEn: "Late Morning Consolidation",
          statusTh: "ตลาดไซด์เวย์ - แกว่งแคบ",
          statusEn: "Flat Ranges & Thin Volumes",
          score: 65,
          recommendationTh: "นักเทรดหลักออกไปพักกลางวัน ราคาหุ้นขยับทีละช่องช้าๆ เหมาะอย่างยิ่งสำหรับการตั้งรับ Limit Order ที่แนวรับลึกอย่างใจเย็น",
          recommendationEn: "Most active traders depart for lunch break. Spreads are static; perfect for resting passive limit buys."
        },
        {
          hours: "16:00 - 16:30",
          nameTh: "นาทีทองสถาบันสรุปยอดใหญ่ (ATC)",
          nameEn: "Closing ATC Session",
          statusTh: "💎 แนะนำสูงสุดสำหรับนักออมหุ้นสถาบัน",
          statusEn: "Optimal Institutional Closing Auction",
          score: 95,
          recommendationTh: "กองทุนรวมและต่างชาติจับคู่ทำราคาปิดเฉลี่ยวัน การส่งออร์เดอร์แบบ ATC จะรับประกันการได้ราคาปิดเฉลี่ยที่ไม่มีผลกระทบสภาพคล่อง",
          recommendationEn: "Institutional players and large mutual funds deploy final cash flows. Placing ATC orders yields a highly fair daily cost."
        }
      ];
      
      thaiMarketNotes = [
        "หุ้นที่มีอัตราปันผลจ่ายสูง (High Yield) มักจะเจอกับสถิติแรงซื้อคืนและดึงราคารับกลับในคืนก่อนปันผล และดิ่งปรับตัวลงเต็มเม็ดหลังป้ายขึ้นเครื่องหมาย XD",
        "ระมัดระวังรอบความผันผวนจากการทำ Window Dressing ของกองทุนไทยในช่วงสัปดาห์สุดท้ายของเดือน มี.ค., มิ.ย., ก.ย. และ ธ.ค.",
        "หลีกเลี่ยงการสะสมหุ้นไทยช่วงสิ้นเดือน (วันที่ 25-30 ของเดือน) เพราะมักมีเบี้ยราคาแพงเกินจริงเนื่องจากเงินกองทุนสำรองเลี้ยงชีพเคาะซื้อ DCA อัตโนมัติ"
      ];
    }
  }

  let verdict: TimingAdvice["verdict"] = "Hold";
  let verdictTh: TimingAdvice["verdictTh"] = "ถือรอจังหวะ (Hold)";

  if (mos >= 20) {
    verdict = "Strong Buy";
    verdictTh = "ซื้อขั้นสุด (Strong Buy)";
  } else if (mos >= 5) {
    verdict = "Accumulate";
    verdictTh = "ทยอยสะสม (Accumulate)";
  } else if (mos >= -10) {
    verdict = "Hold";
    verdictTh = "ถือรอจังหวะ (Hold)";
  } else {
    verdict = "Avoid";
    verdictTh = "หลีกเลี่ยง (Avoid)";
  }

  // DCA vs Lump-sum Strategy details mapping
  let strategyTh = "";
  let strategyEn = "";
  let strategyDetailsTh = "";
  let strategyDetailsEn = "";

  if (mos >= 20) {
    strategyTh = "เน้นสะสมก้อนใหญ่ (Lump-Sum / Buy the Dip)";
    strategyEn = "Aggressive Lump-Sum Accumulation";
    strategyDetailsTh = `🔥 ตลาดมอบราคาส่วนลดพิเศษสูงถึง ${pct(mos)} ซึ่งเป็นโซนประวัติศาสตร์ที่ได้เปรียบ แนะนำแบ่งเงินลงทุนเป็น 2 ไม้ใหญ่ (60% ทันที, 40% ตั้งรับลึกอีก 5% ถัดไป) เพื่อคว้าโอกาสทองในการครอบครองสินทรัพย์ราคาถูก แทนการ DCA ทยอยทีละน้อยซึ่งอาจเสียโอกาสหากราคารีดาวน์กลับรวดเร็ว`;
    strategyDetailsEn = `🔥 Outstanding discount of ${pct(mos)} under fair value. This represents a high-conviction margin of safety. Consider deploying a large lump-sum (e.g. 60% immediately, 40% placed as limit orders 5% deeper) instead of slow DCA to capture this rare discount before price recovery.`;
  } else if (mos >= 5) {
    strategyTh = "ทยอยสะสมเป็นระบบ (DCA / Gradual Accumulate)";
    strategyEn = "Systematic DCA & Gradual Position Building";
    strategyDetailsTh = `ราคาปัจจุบันมีส่วนลดกว้างพอสมควร แต่อาจเผชิญความผันผวนของตลาด แนะนำทยอยสะสมอย่างเป็นระบบแบบ DCA ทุกสัปดาห์ (แนะนำทุกวัน${bestDay}) เพื่อรักษาสมดุลต้นทุนเฉลี่ยที่ดี ไม่แนะนำทุ่มเงินก้อนใหญ่ในครั้งเดียว`;
    strategyDetailsEn = `Attractive valuation with a healthy safety margin. However, macro volatility remains present. We recommend building your position via systematic weekly DCA on ${bestDay} to achieve an optimized cost average without exposure to sudden market dips.`;
  } else if (mos >= -10) {
    strategyTh = "ถือเงินสด รอจังหวะราคาย่อตัว (Hold Cash & Limit Orders)";
    strategyEn = "Hold Cash & Place Strategic Limit Orders";
    strategyDetailsTh = "ราคาเคลื่อนไหวใกล้เคียงมูลค่าเหมาะสม ไม่มีแต้มต่อส่วนลด Margin of Safety เพียงพอในการลงทุนรอบใหญ่ แนะนำถือครองสัดส่วนเดิมไว้ และตั้งราคารับลึก (Limit Orders) เฉพาะวันที่ราคาแกว่งตัวรุนแรงเท่านั้น หรือหันไปทำ DCA สัปดาห์ละเล็กน้อย";
    strategyDetailsEn = "Price is hovering near its fair value. Without a distinct safety margin, a large entry carries high risk. Hold current positions and wait for temporary market drawdowns to buy at a deeper discount, or proceed with small DCA.";
  } else {
    strategyTh = "หลีกเลี่ยงการซื้อเพิ่ม / ทยอยแบ่งขาย (Avoid Buying & Consider Profit Taking)";
    strategyEn = "Avoid Buying / Consider Partial Profit Taking";
    strategyDetailsTh = "⚠️ หุ้นราคาสูงเกินไปแล้ว! ราคาเกินมูลค่าพื้นฐานอย่างมีนัยสำคัญ ขาดความปลอดภัยอย่างรุนแรง หลีกเลี่ยงการไล่ราคาซื้อเพิ่มในเวลานี้เด็ดขาด สำหรับนักเก็งกำไรอาจพิจารณาแบ่งขายล็อกกำไร (Take Profit) บางส่วนเพื่อถือเงินสดรอรอบใหม่";
    strategyDetailsEn = "⚠️ Severely overvalued with a negative margin of safety. Buying now exposes you to massive downside risk. Avoid adding shares. Investors holding substantial gains may consider taking partial profits to accumulate cash for future market cycles.";
  }

  return {
    bestDay,
    bestDayIndex,
    bestPeriod,
    verdict,
    verdictTh: verdictTh as any,
    rationale,
    rationaleEn,
    bestHoursTh,
    bestHoursEn,
    strategyTh,
    strategyEn,
    strategyDetailsTh,
    strategyDetailsEn,
    weeklyScores,
    intradayTimeline,
    thaiMarketNotes
  };
}

export default function WatchlistPage() {
  const { watchlist } = useStore();
  const plan = useCurrentPlan();
  const { t, lang } = useTranslation();

  // Watchlist page Segmented Tabs state
  const [activeView, setActiveView] = useState<"grid" | "timing">("grid");
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  
  // Interactive Day Filter State
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [systemTime, setSystemTime] = useState<Date | null>(null);

  // Set real-time client clock on mount to avoid SSR mismatch
  useEffect(() => {
    setSystemTime(new Date());
    const interval = setInterval(() => {
      setSystemTime(new Date());
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Dynamic Watchlist Stocks (for NASDAQ/live stocks that are loaded on the fly)
  
  // Fetch symbols that are missing from static data, plus static US seed rows that
  // need live prices to stay aligned with stock detail pages.
  const symbolsToRefresh = useMemo(() => {
    return watchlist.filter((symbol) => {
      const stock = getStock(symbol);
      return !stock || hasQuoteProvider(stock);
    });
  }, [watchlist]);
  const { liveStocks: dynamicWatchlistStocks } = useLiveQuotes(symbolsToRefresh);

  const stocks = useMemo(() => {
    const dynamicSymbols = new Set(dynamicWatchlistStocks.map((s) => s.symbol.toUpperCase()));
    const staticStocks = watchlist
      .map(getStock)
      .filter((stock): stock is Stock => {
        if (!stock) return false;
        const key = stock.symbol.toUpperCase();
        return !hasQuoteProvider(stock) || dynamicSymbols.has(key);
      });
    // Filter dynamicWatchlistStocks to make sure they are still in the active watchlist
    const activeWatchlistSet = new Set(watchlist.map(s => s.toUpperCase()));
    const activeDynamic = dynamicWatchlistStocks.filter(s => activeWatchlistSet.has(s.symbol.toUpperCase()));
    
    const bySymbol = new Map<string, Stock>();
    staticStocks.forEach((s) => bySymbol.set(s.symbol.toUpperCase(), s));
    activeDynamic.forEach((s) => bySymbol.set(s.symbol.toUpperCase(), s));
    return Array.from(bySymbol.values());
  }, [watchlist, dynamicWatchlistStocks]);
  const limit = plan.limits.watchlist;
  const overLimit =
    limit !== "unlimited" && stocks.length > limit ? stocks.length - limit : 0;
  const visible =
    limit !== "unlimited" ? stocks.slice(0, limit) : stocks;

  const countStr = lang === "th"
    ? `${stocks.length}${limit !== "unlimited" ? ` / ${limit}` : ""} ตัว`
    : `${stocks.length}${limit !== "unlimited" ? ` / ${limit}` : ""} items`;

  const faqItems = [
    {
      q: lang === "th" ? "Watchlist หุ้นคืออะไร?" : "What is a stock watchlist?",
      a:
        lang === "th"
          ? "Watchlist คือรายการหุ้นหรือสินทรัพย์ที่คุณสนใจติดตาม เพื่อดูราคา มูลค่าเหมาะสม Margin of Safety และสัญญาณว่าหุ้นเริ่มน่าสนใจหรือแพงเกินไป"
          : "A watchlist is a set of stocks or assets you track to monitor price, fair value, margin of safety, and valuation signals.",
    },
    {
      q: lang === "th" ? "ควรใส่หุ้นกี่ตัวใน Watchlist?" : "How many stocks should I track?",
      a:
        lang === "th"
          ? "สำหรับนักลงทุนทั่วไป 10-30 ตัวกำลังดี แบ่งเป็นหุ้นที่ถืออยู่ หุ้นที่รอซื้อ และหุ้นที่อยากศึกษาเพิ่มเติม เพื่อไม่ให้ข้อมูลเยอะจนตัดสินใจยาก"
          : "For most investors, 10-30 tickers is a good range across current holdings, buy candidates, and research ideas.",
    },
    {
      q: lang === "th" ? "Margin of Safety ใน Watchlist ใช้อย่างไร?" : "How should I use margin of safety here?",
      a:
        lang === "th"
          ? "MOS ช่วยบอกส่วนลดระหว่างราคาตลาดกับมูลค่าที่ประเมินได้ ค่าเป็นบวกมากขึ้นแปลว่ามีส่วนเผื่อความปลอดภัยมากขึ้น แต่ยังต้องดูคุณภาพธุรกิจ งบการเงิน และข่าวประกอบ"
          : "MOS measures the discount between market price and estimated value. A larger positive MOS can be attractive, but business quality and news still matter.",
    },
    {
      q: lang === "th" ? "แผนจังหวะเข้าซื้อเป็นคำแนะนำลงทุนไหม?" : "Is the timing plan investment advice?",
      a:
        lang === "th"
          ? "ไม่ใช่ครับ เป็นเครื่องมือช่วยจัดลำดับและวางแผนเบื้องต้นตามประเภทสินทรัพย์กับ MOS นักลงทุนควรตรวจข้อมูลจริงและบริหารความเสี่ยงด้วยตัวเองก่อนตัดสินใจ"
          : "No. It is a planning tool based on asset type and MOS. Investors should verify data and manage risk before making decisions.",
    },
  ];

  const watchlistTips = [
    {
      title: lang === "th" ? "ติดตาม MOS ทุกตัว" : "Track MOS",
      desc:
        lang === "th"
          ? "ดูว่าหุ้นที่สนใจเริ่มมีส่วนเผื่อความปลอดภัยพอหรือยัง"
          : "See whether your target stocks have enough margin of safety.",
      icon: <Shield className="h-4.5 w-4.5" />,
    },
    {
      title: lang === "th" ? "แยกตามประเภทสินทรัพย์" : "Group by asset",
      desc:
        lang === "th"
          ? "ดูหุ้นไทย หุ้นสหรัฐ กองทุน ETF และสินทรัพย์ทางเลือกเป็นหมวด"
          : "Organize Thai stocks, US stocks, funds, ETFs, and alternatives.",
      icon: <Star className="h-4.5 w-4.5" />,
    },
    {
      title: lang === "th" ? "วางแผนจังหวะสะสม" : "Plan entries",
      desc:
        lang === "th"
          ? "ใช้ Timing View เพื่อจัดคิว DCA และดูช่วงเวลาที่เหมาะกับแต่ละสินทรัพย์"
          : "Use Timing View to plan DCA windows and entry timing by asset type.",
      icon: <Clock className="h-4.5 w-4.5" />,
    },
  ];

  // Pre-calculate valuations and advice
  const analyzedStocks = useMemo(() => {
    return visible.map((s) => {
      if (!s) return null;
      const v = computeValuation(s, defaultDCFParams(s));
      const advice = getTimingRecommendation(s, v.marginOfSafety, lang);
      return { s, v, advice };
    }).filter(Boolean) as { s: Stock; v: any; advice: TimingAdvice }[];
  }, [visible, lang]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "ValuStock Watchlist",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: "https://valustock.com/watchlist",
        description:
          lang === "th"
            ? "เครื่องมือติดตามหุ้นและสินทรัพย์ที่สนใจ พร้อม Margin of Safety, ราคาเหมาะสม และแผนจังหวะเข้าซื้อ"
            : "A stock watchlist tool for tracking margin of safety, fair value, and entry timing plans.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "THB",
        },
      },
      {
        "@type": "ItemList",
        "@id": "https://valustock.com/watchlist#tracked-assets",
        name: lang === "th" ? "รายการสินทรัพย์ที่ติดตาม" : "Tracked assets",
        numberOfItems: analyzedStocks.length,
        itemListElement: analyzedStocks.slice(0, 20).map(({ s }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "FinancialProduct",
            name: lang === "th" ? s.name : s.enName || s.name,
            tickerSymbol: s.symbol,
            url: `https://valustock.com/stocks/${s.symbol}`,
          },
        })),
      },
      {
        "@type": "FAQPage",
        "@id": "https://valustock.com/watchlist#faq",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  // Dynamic Category state and group collapsible state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Group stocks by Asset Class with dynamic metrics computation (Count, Avg MOS, Signals)
  const groupedStocks = useMemo(() => {
    const groups = [
      {
        id: "th_equities",
        nameTh: "🇹🇭 หุ้นไทย (Thai Equities)",
        nameEn: "🇹🇭 Thai Equities",
        items: [] as typeof analyzedStocks,
        icon: "📈"
      },
      {
        id: "us_equities",
        nameTh: "🇺🇸 หุ้นสหรัฐฯ (US Equities)",
        nameEn: "🇺🇸 US Equities",
        items: [] as typeof analyzedStocks,
        icon: "⚡"
      },
      {
        id: "etfs_gold",
        nameTh: "🏆 กองทุน ETF & ทองคำ (ETFs & Gold)",
        nameEn: "🏆 ETFs & Gold",
        items: [] as typeof analyzedStocks,
        icon: "🏆"
      },
      {
        id: "mutual_funds",
        nameTh: "💼 กองทุนรวม (Mutual Funds)",
        nameEn: "💼 Mutual Funds",
        items: [] as typeof analyzedStocks,
        icon: "💼"
      },
      {
        id: "crypto_futures",
        nameTh: "🌐 สินทรัพย์ทางเลือก & อื่นๆ (Alternative Assets)",
        nameEn: "🌐 Alternative Assets",
        items: [] as typeof analyzedStocks,
        icon: "🪙"
      }
    ];

    analyzedStocks.forEach(item => {
      const { s } = item;
      const type = s.assetType || "TH_STOCK";
      const isUS = s.market === "NASDAQ" || s.market === "NYSE" || s.currency === "USD";
      
      if (type === "FUND" || type === "US_FUND") {
        groups[3].items.push(item);
      } else if (type === "ETF" || s.symbol.toUpperCase() === "GLD") {
        groups[2].items.push(item);
      } else if (type === "CRYPTO" || type === "FUTURES") {
        groups[4].items.push(item);
      } else if (isUS) {
        groups[1].items.push(item);
      } else {
        groups[0].items.push(item);
      }
    });

    return groups
      .filter(g => g.items.length > 0)
      .map(g => {
        const totalMos = g.items.reduce((sum, item) => sum + item.v.marginOfSafety, 0);
        const avgMos = totalMos / g.items.length;
        
        let strongBuyCount = 0;
        let accCount = 0;
        let holdCount = 0;
        let avoidCount = 0;
        g.items.forEach(item => {
          const v = item.advice.verdict;
          if (v === "Strong Buy") strongBuyCount++;
          else if (v === "Accumulate") accCount++;
          else if (v === "Hold") holdCount++;
          else if (v === "Avoid") avoidCount++;
        });

        return {
          ...g,
          avgMos,
          signals: {
            strongBuy: strongBuyCount,
            accumulate: accCount,
            hold: holdCount,
            avoid: avoidCount
          }
        };
      });
  }, [analyzedStocks]);

  // Categories list for Tab switcher
  const categoriesList = useMemo(() => {
    const list = [
      { id: "all", labelTh: "🎯 สินทรัพย์ทั้งหมด", labelEn: "🎯 All Assets", count: analyzedStocks.length }
    ];
    groupedStocks.forEach(g => {
      list.push({
        id: g.id,
        labelTh: g.nameTh.split(" (")[0], // E.g. "🇹🇭 หุ้นไทย"
        labelEn: g.nameEn,
        count: g.items.length
      });
    });
    return list;
  }, [groupedStocks, analyzedStocks]);

  // Group stocks by day index with reactive Category filtering
  const stocksByDay = useMemo(() => {
    const groups: { [key: number]: { s: Stock; advice: TimingAdvice }[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    analyzedStocks.forEach(({ s, advice }) => {
      if (selectedCategory !== "all") {
        const type = s.assetType || "TH_STOCK";
        const isUS = s.market === "NASDAQ" || s.market === "NYSE" || s.currency === "USD";
        let itemGroupId = "";
        if (type === "FUND" || type === "US_FUND") itemGroupId = "mutual_funds";
        else if (type === "ETF" || s.symbol.toUpperCase() === "GLD") itemGroupId = "etfs_gold";
        else if (type === "CRYPTO" || type === "FUTURES") itemGroupId = "crypto_futures";
        else if (isUS) itemGroupId = "us_equities";
        else itemGroupId = "th_equities";
        
        if (itemGroupId !== selectedCategory) return;
      }

      const idx = advice.bestDayIndex;
      if (groups[idx] !== undefined) {
        groups[idx].push({ s, advice });
      }
    });
    return groups;
  }, [analyzedStocks, selectedCategory]);

  const daysOfWeek = lang === "th"
    ? [
        { label: "วันจันทร์", color: "border-t-2 border-yellow-400 bg-yellow-400/5 text-yellow-600 dark:text-yellow-400", idx: 0 },
        { label: "วันอังคาร", color: "border-t-2 border-pink-400 bg-pink-400/5 text-pink-600 dark:text-pink-400", idx: 1 },
        { label: "วันพุธ", color: "border-t-2 border-emerald-400 bg-emerald-400/5 text-emerald-600 dark:text-emerald-400", idx: 2 },
        { label: "วันพฤหัสบดี", color: "border-t-2 border-orange-400 bg-orange-400/5 text-orange-600 dark:text-orange-400", idx: 3 },
        { label: "วันศุกร์", color: "border-t-2 border-sky-400 bg-sky-400/5 text-sky-600 dark:text-sky-400", idx: 4 },
        { label: "วันเสาร์", color: "border-t-2 border-purple-400 bg-purple-400/5 text-purple-600 dark:text-purple-400", idx: 5 },
        { label: "วันอาทิตย์", color: "border-t-2 border-red-400 bg-red-400/5 text-red-600 dark:text-red-400", idx: 6 },
      ]
    : [
        { label: "Monday", color: "border-t-2 border-yellow-400 bg-yellow-400/5 text-yellow-600 dark:text-yellow-400", idx: 0 },
        { label: "Tuesday", color: "border-t-2 border-pink-400 bg-pink-400/5 text-pink-600 dark:text-pink-400", idx: 1 },
        { label: "Wednesday", color: "border-t-2 border-emerald-400 bg-emerald-400/5 text-emerald-600 dark:text-emerald-400", idx: 2 },
        { label: "Thursday", color: "border-t-2 border-orange-400 bg-orange-400/5 text-orange-600 dark:text-orange-400", idx: 3 },
        { label: "Friday", color: "border-t-2 border-sky-400 bg-sky-400/5 text-sky-600 dark:text-sky-400", idx: 4 },
        { label: "Saturday", color: "border-t-2 border-purple-400 bg-purple-400/5 text-purple-600 dark:text-purple-400", idx: 5 },
        { label: "Sunday", color: "border-t-2 border-red-400 bg-red-400/5 text-red-600 dark:text-red-400", idx: 6 },
      ];

  // Dynamic Live Market Tracker Status computation
  const liveMarketStatus = useMemo(() => {
    if (!systemTime) return null;
    
    // Convert to Indochina Time (ICT - UTC+7)
    const utc = systemTime.getTime() + (systemTime.getTimezoneOffset() * 60000);
    const ictTime = new Date(utc + (3600000 * 7));
    
    const day = ictTime.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const hour = ictTime.getHours();
    const minute = ictTime.getMinutes();
    const timeValue = hour * 100 + minute; // e.g. 10:30 -> 1030

    let statusTh = "";
    let statusEn = "";
    let alertTextTh = "";
    let alertTextEn = "";
    let badgeTone: "brand" | "gold" | "up" | "down" | "muted" = "muted";

    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      statusTh = "ตลาดหุ้นปิดทำการ (สุดสัปดาห์)";
      statusEn = "Markets Closed (Weekend)";
      alertTextTh = "ขณะนี้ตลาดหุ้นไทย (SET) และตลาดหุ้นสหรัฐฯ (NYSE/NASDAQ) ปิดทำการในวันหยุด แนะนำเน้นตั้งรับสินทรัพย์ดิจิทัล (Crypto) ที่คืนนี้จะมีแรงกดดันราคาต่ำที่สุดในรอบสัปดาห์ หรือส่งคำสั่งซื้อแบบ Limit Order หุ้นไทยล่วงหน้าเพื่อเตรียมช้อนราคาเปิดในวันจันทร์เช้า";
      alertTextEn = "Main equity exchanges are closed. We suggest checking Crypto markets tonight for optimal weekly discount entries, or placing pre-market Limit Orders to prepare for tomorrow morning.";
      badgeTone = "muted";
    } else {
      if (timeValue >= 930 && timeValue < 1000) {
        statusTh = "ช่วงสุ่มราคาเปิดตลาดหุ้นไทย (ATO)";
        statusEn = "SET Pre-Open Volatility (ATO)";
        alertTextTh = "🇹🇭 ตลาดหุ้นไทย (SET) กำลังสุ่มจับคู่อัตโนมัติเปิดเช้า หลีกเลี่ยงการส่งคำสั่งซื้อทันทีแบบ Market Order เพื่อเลี่ยงจุดราคาแพงสูงสุด แนะนำให้รอเวลา 10:00 น. เพื่อสภาพคล่องที่เสถียร";
        alertTextEn = "🇹🇭 Thai stock market is calculating ATO prices. Avoid urgent Market Orders to prevent inflated entry costs. Wait until 10:00 AM for stable quotes.";
        badgeTone = "down";
      } else if (timeValue >= 1000 && timeValue < 1100) {
        statusTh = "🔥 ชั่วโมงทองสะสมเช้าตลาดหุ้นไทย (SET)";
        statusEn = "🔥 SET Optimal Morning Entry Window";
        alertTextTh = "🇹🇭 ตลาดหุ้นไทยและกองทุนรวมกำลังอยู่ในช่วงน่าซื้อสะสมที่สุดของครึ่งวันเช้า สภาพคล่องหนาแน่น ทิศทางราคาเริ่มคงที่หลังจากประเมินตลาดภูมิภาคเอเชียสะท้อนปัจจัยบวก";
        alertTextEn = "🇹🇭 Thai stocks & mutual funds are in their peak morning buying window. Spreads are tight and regional Asian price trends have settled.";
        badgeTone = "up";
      } else if (timeValue >= 1100 && timeValue < 1230) {
        statusTh = "ตลาดหุ้นไทยพักผ่อนช่วงสาย (Consolidation)";
        statusEn = "SET Late Morning Consolidation";
        alertTextTh = "🇹🇭 ตลาดหุ้นไทยเคลื่อนไหวแกว่งตัวในกรอบแคบและปริมาณการซื้อขายลดลง เหมาะสำหรับการประเมินมูลค่าและตั้งออร์เดอร์รับลึก (Limit Order) ล่วงหน้าไว้รอจับการย่อตัว";
        alertTextEn = "🇹🇭 Thai market volume is calming down. Perfect for calculating intrinsic values and resting passive limit orders at key supports.";
        badgeTone = "brand";
      } else if (timeValue >= 1230 && timeValue < 1430) {
        statusTh = "💤 ปิดทำการช่วงพักเที่ยงของตลาดหุ้นไทย";
        statusEn = "💤 SET Midday Lunch Break";
        alertTextTh = "🇹🇭 ดัชนีหุ้นไทยปิดภาคเช้าชั่วคราว แนะนำตรวจสอบมูลค่า Margin of Safety และคัดเลือกหลักทรัพย์ในดวงใจรอเปิดทำการบ่ายในช่วงเวลา 14:30 น.";
        alertTextEn = "🇹🇭 Thai market is closed for lunch. Review your watchlist Margin of Safety levels to prepare for the afternoon session starting at 02:30 PM.";
        badgeTone = "muted";
      } else if (timeValue >= 1430 && timeValue < 1530) {
        statusTh = "เปิดบ่ายตลาดหุ้นไทย (Afternoon Session)";
        statusEn = "SET Afternoon Session Open";
        alertTextTh = "🇹🇭 ตลาดหุ้นไทยเปิดรอบบ่าย ราคาเริ่มแกว่งตามทิศทางดัชนีต่างประเทศและฟิวเจอร์สฝั่งตะวันตก เป็นช่วงที่ดีในการตั้งรับหรือประเมินทิศทางปิดตลาด";
        alertTextEn = "🇹🇭 Thai market re-opens for the afternoon. Price action reflects regional indexes and Western futures. Good window for mid-day position builds.";
        badgeTone = "brand";
      } else if (timeValue >= 1600 && timeValue < 1630) {
        statusTh = "💎 ชั่วโมงทองปิดเย็นสถาบัน (ATC Golden Hour)";
        statusEn = "💎 SET Institutional Closing Auction (ATC)";
        alertTextTh = "🇹🇭 เข้าสู่ช่วงทำราคาสิ้นวันของกองทุนรวมและนักลงทุนต่างชาติ การส่งคำสั่งซื้อสะสมแบบ ATC (At the Close) ในช่วงนี้จะได้ราคาที่ได้เปรียบ ยุติธรรม และไม่มีผลกระทบต่อราคาตลาด";
        alertTextEn = "🇹🇭 Institutional block trades and index funds are adjusting final portfolio weights. Executing ATC orders captures fair daily average pricing.";
        badgeTone = "gold";
      } else if (timeValue >= 2030 && timeValue < 2130) {
        statusTh = "🔥 ชั่วโมงทองเปิดตลาดสหรัฐฯ (Opening Bell)";
        statusEn = "🔥 US Market Opening Bell Prime Hour";
        alertTextTh = "🇺🇸 ตลาดหุ้นสหรัฐฯ (NYSE/NASDAQ) เปิดทำการแล้ว! ปริมาณเงินทุนและสภาพคล่องหมุนเวียนไหลเข้าสูงสุดของวัน เหมาะสำหรับการช้อนสะสมหุ้นเทคโนโลยีขนาดใหญ่และ ETF ต่ำกว่ามูลค่า";
        alertTextEn = "🇺🇸 US exchanges are open! Global liquidity flows peak, offering prime market entries for undervalued tech leaders and tracking ETFs.";
        badgeTone = "up";
      } else if (timeValue >= 2130 || timeValue < 200) {
        statusTh = "ตลาดหุ้นสหรัฐฯ เคลื่อนไหวคงที่กลางคืน";
        statusEn = "US Mid-Day Sideways Consolidation";
        alertTextTh = "🇺🇸 ตลาดหุ้นสหรัฐเคลื่อนไหวแกว่งตัวในกรอบกว้าง เป็นช่วงเวลาที่ปริมาณเก็งกำไรช่วงเปิดตลาดเบาบางลง เหมาะกับการเฉลี่ยตั้งออมหรือประเมินหุ้นรายตัวแบบใจเย็น";
        alertTextEn = "🇺🇸 Speculative opening bell surges are receding. High-conviction investors can deploy controlled DCA positions or evaluate balance sheets.";
        badgeTone = "brand";
      } else if (timeValue >= 200 && timeValue < 300) {
        statusTh = "💎 ชั่วโมงรวบราคาปิดสหรัฐฯ (Power Hour)";
        statusEn = "💎 US Power Hour Closing Session";
        alertTextTh = "🇺🇸 ชั่วโมงสุดท้ายก่อนปิดตลาดหลักสหรัฐ กองทุนบำนาญและวาฬฝั่งตะวันตกเข้าจับคู่รายการใหญ่เพื่อสรุปราคาวัน ได้ราคาต้นทุนเฉลี่ยที่ล้อดัชนีเกณฑ์มาตรฐานอย่างโปร่งใสที่สุด";
        alertTextEn = "🇺🇸 The final hour of US trading. Pension systems and large index providers match orders to settle NAV benchmarks. Ideal for secure closed costs.";
        badgeTone = "gold";
      } else {
        statusTh = "ช่วงตลาดหลักปิด (ดักช้อน Crypto)";
        statusEn = "Global Equities Closed (Crypto Active)";
        alertTextTh = "🌐 ดัชนีหุ้นไทยและสหรัฐฯ ปิดการซื้อขาย แนะนำให้ตั้งคำสั่งซื้อแบบกำหนดราคาล่วงหน้า (Limit Orders) หรือจับจังหวะช้อนซื้อ Crypto ในคืนที่เกิดแรงเทขายผิดปกติจากการล้างเลเวอเรจ";
        alertTextEn = "🌐 Equity markets are closed. Perfect time for setting resting Limit Orders, or taking tactical crypto entry plays when volatility spikes.";
        badgeTone = "muted";
      }
    }

    return { day, hour, minute, statusTh, statusEn, alertTextTh, alertTextEn, badgeTone };
  }, [systemTime]);

  const filteredAnalyzedStocks = useMemo(() => {
    let list = analyzedStocks;
    
    if (selectedDayFilter !== null) {
      list = list.filter(({ advice }) => advice.bestDayIndex === selectedDayFilter);
    }
    
    if (selectedCategory !== "all") {
      list = list.filter(({ s }) => {
        const type = s.assetType || "TH_STOCK";
        const isUS = s.market === "NASDAQ" || s.market === "NYSE" || s.currency === "USD";
        
        let itemGroupId = "";
        if (type === "FUND" || type === "US_FUND") itemGroupId = "mutual_funds";
        else if (type === "ETF" || s.symbol.toUpperCase() === "GLD") itemGroupId = "etfs_gold";
        else if (type === "CRYPTO" || type === "FUTURES") itemGroupId = "crypto_futures";
        else if (isUS) itemGroupId = "us_equities";
        else itemGroupId = "th_equities";
        
        return itemGroupId === selectedCategory;
      });
    }
    
    return list;
  }, [analyzedStocks, selectedDayFilter, selectedCategory]);

  const toggleExpand = (symbol: string) => {
    setExpandedStock(expandedStock === symbol ? null : symbol);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Printable page layout style element */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, header, footer, nav, button, .switcher-bar, .pricing-banner {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
          }
          .print-card {
            border: 1px solid #ccc !important;
            background: white !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
        }
      `}} />

      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Star className="h-7 w-7 text-brand fill-brand" />
            {lang === "th" ? "Watchlist หุ้นและสินทรัพย์ที่ติดตาม" : t("watchlist.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "th"
              ? "ติดตามหุ้นที่สนใจพร้อมราคาเหมาะสม Margin of Safety และแผนจังหวะสะสมแบบเป็นระบบ"
              : t("watchlist.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Grid / Timing Mode Switcher */}
          {stocks.length > 0 && (
            <div className="flex items-center bg-elevate border border-line/60 rounded-xl p-1 shrink-0 switcher-bar">
              <button
                onClick={() => setActiveView("grid")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === "grid"
                    ? "bg-brand/10 text-brand font-extrabold"
                    : "text-muted hover:text-ink"
                }`}
              >
                {lang === "th" ? "รายการหลัก" : "Grid List"}
              </button>
              <button
                onClick={() => setActiveView("timing")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  activeView === "timing"
                    ? "bg-brand/10 text-brand font-extrabold"
                    : "text-muted hover:text-ink"
                }`}
                >
                <Clock className="h-3.5 w-3.5" />
                {lang === "th" ? "จังหวะเข้าซื้อ" : "Best Buy Windows"}
              </button>
            </div>
          )}
          <span className="num text-xs font-bold text-muted bg-elevate px-3 py-1.5 rounded-xl border border-line/45">
            {countStr}
          </span>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3 no-print">
        {watchlistTips.map((item) => (
          <Card key={item.title} className="border border-line bg-surface/35 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                {item.icon}
              </span>
              <div>
                <h2 className="font-display text-sm font-black text-ink">{item.title}</h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {watchlist.length > 0 && stocks.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 no-print">
          {watchlist.slice(0, 6).map((symbol) => (
            <QuoteLoadingCard
              key={symbol}
              title={`${symbol} live quote`}
              subtitle={lang === "th" ? "กำลังดึงราคาล่าสุด..." : "Fetching latest price..."}
            />
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <Card className="p-12 text-center border border-line bg-surface/40 backdrop-blur-md no-print">
          <Star className="mx-auto h-12 w-12 text-muted/60" />
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            {lang === "th" ? "ยังไม่มีหลักทรัพย์ในรายการโปรด" : "No Securities in Watchlist"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-muted leading-relaxed">
            {t("watchlist.noStocks")}
          </p>
          <Link href="/stocks">
            <Button className="mt-6 flex items-center gap-2 font-bold hover:scale-[1.02] transition active:scale-95">
              <Search className="h-4 w-4" /> {t("common.searchStocks")}
            </Button>
          </Link>
          <div className="mx-auto mt-6 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
            {[
              lang === "th" ? "เพิ่มหุ้นที่ถืออยู่" : "Add holdings",
              lang === "th" ? "เพิ่มหุ้นที่รอซื้อ" : "Add buy candidates",
              lang === "th" ? "ติดตาม MOS รายสัปดาห์" : "Track MOS weekly",
            ].map((step) => (
              <div key={step} className="flex items-center gap-2 rounded-xl border border-line bg-bg/45 px-3 py-2 text-xs font-bold text-muted">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-brand" />
                {step}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <>
          {/* 🎯 Asset Category Switcher Tab Bar */}
          <div className="no-print flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none border-b border-line/45">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-display font-extrabold rounded-xl border transition-all duration-200 flex items-center gap-2 shrink-0 hover:scale-[1.02] active:scale-95 ${
                    isActive
                      ? "bg-brand text-white border-brand shadow-sm shadow-brand/10"
                      : "bg-surface/40 hover:bg-elevate/75 text-muted hover:text-ink border-line/60"
                  }`}
                >
                  <span>{lang === "th" ? cat.labelTh : cat.labelEn}</span>
                  <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-line text-muted"
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeView === "grid" ? (
            <div className="space-y-6 no-print">
              {selectedCategory === "all" ? (
                // Display categorized collapsible groups
                groupedStocks.map((group) => {
                  const isCollapsed = collapsedGroups[group.id] || false;
                  return (
                    <div key={group.id} className="space-y-3">
                      {/* Interactive Group Header Card */}
                      <div 
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="flex flex-wrap items-center justify-between gap-4 p-4 border border-line/60 bg-surface/50 backdrop-blur-md rounded-2xl cursor-pointer hover:bg-elevate/40 transition-all duration-200 select-none shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-lg shadow-inner">
                            {group.icon}
                          </div>
                          <div>
                            <h3 className="font-display font-extrabold text-sm sm:text-base text-ink leading-tight">
                              {lang === "th" ? group.nameTh : group.nameEn}
                            </h3>
                            <span className="text-xs text-muted/90 font-bold block mt-1 uppercase tracking-wider">
                              {group.items.length} {lang === "th" ? "รายการที่บันทึก" : "tracked items"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                          {/* Average Margin of Safety */}
                          <div className="text-right">
                            <span className="block text-[10px] text-muted font-extrabold uppercase tracking-wider leading-none mb-1">
                              {lang === "th" ? "MOS เฉลี่ย" : "AVG MOS"}
                            </span>
                            <span className={`font-mono text-sm sm:text-base font-black ${
                              group.avgMos >= 15 ? "text-green-500" : group.avgMos >= 0 ? "text-brand" : "text-red-500"
                            }`}>
                              {group.avgMos >= 0 ? "+" : ""}{group.avgMos.toFixed(2)}%
                            </span>
                          </div>

                          {/* Signals breakdown */}
                          <div className="hidden sm:flex items-center gap-2 border-l border-line/60 pl-3">
                            {group.signals.strongBuy > 0 && (
                              <Badge tone="up" className="text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                                🔥 {group.signals.strongBuy}
                              </Badge>
                            )}
                            {group.signals.accumulate > 0 && (
                              <Badge tone="brand" className="text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                                สะสม {group.signals.accumulate}
                              </Badge>
                            )}
                            {group.signals.hold > 0 && (
                              <Badge tone="gold" className="text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                                ถือ {group.signals.hold}
                              </Badge>
                            )}
                            {group.signals.avoid > 0 && (
                              <Badge tone="down" className="text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                                เลี่ยง {group.signals.avoid}
                              </Badge>
                            )}
                          </div>

                          <div className="border-l border-line/60 pl-2">
                            {isCollapsed ? (
                              <ChevronDown className="h-5 w-5 text-muted" />
                            ) : (
                              <ChevronUp className="h-5 w-5 text-muted" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Group Stock Cards Grid */}
                      {!isCollapsed && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
                          {group.items.map((item) => (
                            <StockCard key={item.s.symbol} stock={item.s} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Display only the single selected category group
                (() => {
                  const activeGroup = groupedStocks.find(g => g.id === selectedCategory);
                  if (!activeGroup) return null;
                  return (
                    <div className="space-y-4">
                      {/* Active Group Info Header Card */}
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-brand/20 bg-brand/5 backdrop-blur-md rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-lg shadow-inner">
                            {activeGroup.icon}
                          </div>
                          <div>
                            <h3 className="font-display font-extrabold text-sm sm:text-base text-ink leading-tight">
                              {lang === "th" ? activeGroup.nameTh : activeGroup.nameEn}
                            </h3>
                            <span className="text-xs text-muted/90 font-bold block mt-1 uppercase tracking-wider">
                              {activeGroup.items.length} {lang === "th" ? "รายการที่บันทึก" : "tracked items"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          <div className="text-right">
                            <span className="block text-[10px] text-muted font-extrabold uppercase tracking-wider leading-none mb-1">
                              {lang === "th" ? "MOS เฉลี่ย" : "AVG MOS"}
                            </span>
                            <span className={`font-mono text-sm sm:text-base font-black ${
                              activeGroup.avgMos >= 15 ? "text-green-500" : activeGroup.avgMos >= 0 ? "text-brand" : "text-red-500"
                            }`}>
                              {activeGroup.avgMos >= 0 ? "+" : ""}{activeGroup.avgMos.toFixed(2)}%
                            </span>
                          </div>
                          <div className="border-l border-line/60 pl-3 flex items-center gap-2">
                            {activeGroup.signals.strongBuy > 0 && (
                              <Badge tone="up" className="text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                🔥 {activeGroup.signals.strongBuy}
                              </Badge>
                            )}
                            {activeGroup.signals.accumulate > 0 && (
                              <Badge tone="brand" className="text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                สะสม {activeGroup.signals.accumulate}
                              </Badge>
                            )}
                            {activeGroup.signals.hold > 0 && (
                              <Badge tone="gold" className="text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                ถือ {activeGroup.signals.hold}
                              </Badge>
                            )}
                            {activeGroup.signals.avoid > 0 && (
                              <Badge tone="down" className="text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                เลี่ยง {activeGroup.signals.avoid}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up">
                        {activeGroup.items.map((item) => (
                          <StockCard key={item.s.symbol} stock={item.s} />
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ) : (
            /* ⏱️ VALUE ENTRY TIMING & SEASONALITY ADVISOR VIEW */
            <div className="space-y-6 print-full-width">
              
              {/* 🕒 Live Market Time Status Tracker */}
              {liveMarketStatus && (
                <Card className={`p-4 border bg-surface/30 backdrop-blur-md relative overflow-hidden transition-all duration-300 no-print ${
                  liveMarketStatus.badgeTone === "up" ? "border-green-500/35 bg-green-500/[0.02]" :
                  liveMarketStatus.badgeTone === "gold" ? "border-gold/35 bg-gold/[0.02]" :
                  liveMarketStatus.badgeTone === "brand" ? "border-brand/35 bg-brand/[0.02]" :
                  liveMarketStatus.badgeTone === "down" ? "border-red-500/35 bg-red-500/[0.02]" :
                  "border-line/60"
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            liveMarketStatus.badgeTone === "up" ? "bg-green-500" :
                            liveMarketStatus.badgeTone === "gold" ? "bg-gold" :
                            liveMarketStatus.badgeTone === "brand" ? "bg-brand" :
                            liveMarketStatus.badgeTone === "down" ? "bg-red-500" :
                            "bg-muted"
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${
                            liveMarketStatus.badgeTone === "up" ? "bg-green-500" :
                            liveMarketStatus.badgeTone === "gold" ? "bg-gold" :
                            liveMarketStatus.badgeTone === "brand" ? "bg-brand" :
                            liveMarketStatus.badgeTone === "down" ? "bg-red-500" :
                            "bg-muted"
                          }`}></span>
                        </span>
                        <h4 className="text-sm font-extrabold uppercase tracking-wider text-ink flex items-center gap-1">
                          {lang === "th" ? "ตัววิเคราะห์ความได้เปรียบเวลาซื้อขายเรียลไทม์" : "Real-time Buy-Timing Tracker"}
                        </h4>
                        <Badge tone={liveMarketStatus.badgeTone} className="text-xs font-black tracking-normal px-2 py-0.5 rounded-md">
                          {lang === "th" ? liveMarketStatus.statusTh : liveMarketStatus.statusEn}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-ink/85 leading-relaxed font-semibold max-w-4xl">
                        {lang === "th" ? liveMarketStatus.alertTextTh : liveMarketStatus.alertTextEn}
                      </p>
                    </div>
                    {systemTime && (
                      <div className="text-right shrink-0 bg-elevate/45 px-4 py-2 rounded-xl border border-line/45 font-mono shadow-sm">
                        <span className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">
                          {lang === "th" ? "เวลาท้องถิ่นไทย (ICT)" : "Bangkok Local Time"}
                        </span>
                        <span className="text-sm sm:text-base font-black text-ink">
                          {systemTime.toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", {
                            timeZone: "Asia/Bangkok",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* 📅 DCA Weekly Planner Widget */}
              <div className="space-y-3 no-print">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5.5 w-5.5 text-brand" />
                  <h3 className="text-base font-extrabold text-ink uppercase tracking-wider">
                    {lang === "th" ? "แผนจัดวางคิวสะสมรายสัปดาห์ (Weekly DCA Roadmap)" : "Weekly DCA Accumulation Roadmap"}
                  </h3>
                </div>
                <p className="text-sm text-muted leading-relaxed font-medium">
                  {lang === "th"
                    ? "ระบบ AI ประมวลผลและแบ่งคิวสะสมหุ้นรายสัปดาห์ให้อัตโนมัติ (คลิกเลือกการ์ดวันเพื่อกรองหุ้นด้านล่างตามวันนั้น หรือคลิกตัวย่อหุ้นเพื่อเปิดวิเคราะห์เชิงลึก)"
                    : "The AI distributes your watchlist into an optimized weekly buying schedule. Click a card to filter stocks, or click a symbol to deep-dive."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {daysOfWeek.map((day) => {
                    const items = stocksByDay[day.idx] || [];
                    const isActiveFilter = selectedDayFilter === day.idx;
                    return (
                      <Card
                        key={day.idx}
                        onClick={() => {
                          setSelectedDayFilter(isActiveFilter ? null : day.idx);
                        }}
                        className={`p-3 border flex flex-col justify-between min-h-[120px] cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md ${
                          isActiveFilter 
                            ? "ring-2 ring-brand scale-[1.04] shadow-lg border-brand" 
                            : "border-line/60"
                        } ${day.color}`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="block text-xs sm:text-sm font-extrabold uppercase tracking-wide select-none">
                              {day.label}
                            </span>
                            {isActiveFilter && (
                              <span className="text-[10px] font-bold text-brand animate-pulse">● Active</span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {items.length > 0 ? (
                              items.map(({ s, advice }) => {
                                const badgeColor = {
                                  "Strong Buy": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
                                  "Accumulate": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                                  "Hold": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
                                  "Avoid": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                                }[advice.verdict];
                                return (
                                  <button
                                    key={s.symbol}
                                    onClick={(e) => {
                                      e.stopPropagation(); // Avoid triggering filter toggle
                                      toggleExpand(s.symbol);
                                      // Scroll into view gently
                                      const el = document.getElementById(`stock-row-${s.symbol}`);
                                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                                    }}
                                    className="w-full text-left p-1.5 rounded-lg border border-line/80 bg-surface/90 hover:border-brand/40 transition flex items-center justify-between text-xs font-bold shadow-sm"
                                  >
                                    <span className="truncate mr-1 text-ink">{s.symbol}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${badgeColor}`}>
                                      {advice.verdict === "Strong Buy" ? "🔥" : advice.verdict === "Accumulate" ? "สะสม" : advice.verdict === "Hold" ? "ถือ" : "เลี่ยง"}
                                    </span>
                                  </button>
                                );
                              })
                            ) : (
                              <span className="block text-xs text-muted/75 italic font-normal py-1">
                                {lang === "th" ? "ไม่มีคิวออม" : "No queue"}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* 🔄 Filter Reset Bar */}
              {selectedDayFilter !== null && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand/5 border border-brand/20 text-xs sm:text-sm text-brand font-bold no-print shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
                    </span>
                    <span>
                      {lang === "th"
                        ? `แสดงเฉพาะรายการแนะนำเข้าซื้อใน: ${daysOfWeek[selectedDayFilter].label} (${filteredAnalyzedStocks.length} รายการ)`
                        : `Filtering results for: ${daysOfWeek[selectedDayFilter].label} (${filteredAnalyzedStocks.length} items)`}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedDayFilter(null)}
                    className="px-3.5 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-xs font-extrabold uppercase transition duration-150"
                  >
                    {lang === "th" ? "แสดงทั้งหมด ❌" : "Clear Filter ❌"}
                  </button>
                </div>
              )}

              {/* ⏱️ Timing Advisor Main Table Card */}
              <Card className="border border-line bg-surface/40 backdrop-blur-md overflow-hidden p-0 print-card">
                <div className="p-4 border-b border-line flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-brand animate-pulse" />
                    <h3 className="text-sm sm:text-base font-extrabold text-ink uppercase tracking-wider">
                      {lang === "th" ? "ตารางจัดลำดับจังหวะความได้เปรียบรายหลักทรัพย์" : "Security-by-Security Entry Optimization Advisor"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted/90 font-bold no-print">
                      * {lang === "th" ? "คำนวณตามสถิติของประเภทสินทรัพย์และ Margin of Safety จริง" : "Generated dynamically using asset class stats and MOS"}
                    </span>
                    <button
                      onClick={handlePrint}
                      className="text-xs bg-elevate hover:bg-brand/10 text-muted hover:text-brand px-3 py-2 rounded-lg border border-line font-bold flex items-center justify-center gap-1 transition duration-200 no-print"
                    >
                      🖨️ {lang === "th" ? "พิมพ์แผนสะสมทุน" : "Print Plan"}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-elevate/45 text-xs text-muted/95 font-extrabold border-b border-line uppercase tracking-wider select-none">
                        <th className="px-4 py-3.5">{lang === "th" ? "หลักทรัพย์" : "TICKER"}</th>
                        <th className="px-4 py-3.5 text-right">{lang === "th" ? "ราคาปัจจุบัน" : "PRICE"}</th>
                        <th className="px-4 py-3.5 text-right">{lang === "th" ? "ส่วนเผื่อความปลอดภัย" : "MOS"}</th>
                        <th className="px-4 py-3.5 text-center">{lang === "th" ? "สัญญาณวิเคราะห์" : "ZONE SIGNAL"}</th>
                        <th className="px-4 py-3.5 text-center">{lang === "th" ? "วันซื้อที่ดีที่สุด" : "BEST WEEK DAY"}</th>
                        <th className="px-4 py-3.5 text-center">{lang === "th" ? "ช่วงจังหวะที่ดีที่สุด" : "BEST PERIOD"}</th>
                        <th className="px-4 py-3.5 text-right no-print">{lang === "th" ? "คำแนะนำหลัก" : "ADVISORY"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {filteredAnalyzedStocks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted/90 text-sm italic">
                            {lang === "th" ? "ไม่มีหลักทรัพย์แนะนำสะสมในวันนี้" : "No securities recommended for this day."}
                          </td>
                        </tr>
                      ) : (
                        filteredAnalyzedStocks.map(({ s, v, advice }) => {
                          const displayName = lang === "th" ? s.name : s.enName || s.name;
                          const formattedPrice = s.currency === "USD" ? dollar(s.price) : baht(s.price);
                          const isExpanded = expandedStock === s.symbol;

                          const verdictColorMap = {
                            "Strong Buy": "bg-green-500/10 text-green-500 border border-green-500/20",
                            "Accumulate": "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                            "Hold": "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
                            "Avoid": "bg-red-500/10 text-red-500 border border-red-500/20",
                          };

                          return (
                            <Fragment key={s.symbol}>
                              <tr 
                                id={`stock-row-${s.symbol}`}
                                className={`hover:bg-elevate/30 transition duration-150 cursor-pointer ${
                                  isExpanded ? "bg-elevate/25" : ""
                                }`}
                                onClick={() => toggleExpand(s.symbol)}
                              >
                                <td className="px-4 py-4 font-bold">
                                  <div className="flex items-center gap-2">
                                    <AssetLogo symbol={s.symbol} color={s.color} size="sm" />
                                    <div>
                                      <span className="font-display font-extrabold text-sm sm:text-base text-ink block leading-none">
                                        {s.symbol}
                                      </span>
                                      <span className="text-xs text-muted/90 font-normal block mt-1.5 truncate max-w-[200px]">
                                        {displayName}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right font-mono font-bold text-ink text-sm sm:text-base">
                                  {formattedPrice}
                                </td>
                                <td className={`px-4 py-4 text-right font-mono font-black text-sm sm:text-base ${
                                  v.marginOfSafety >= 15 ? "text-green-500" : v.marginOfSafety >= 0 ? "text-brand" : "text-red-500"
                                }`}>
                                  {pct(v.marginOfSafety)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${verdictColorMap[advice.verdict]}`}>
                                    {lang === "th" ? advice.verdictTh : advice.verdict}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className="inline-flex px-3 py-1 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/10 text-xs sm:text-sm">
                                    📅 {advice.bestDay}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className="inline-flex px-3 py-1 rounded bg-brand/10 text-brand font-bold border border-brand/10 text-xs sm:text-sm">
                                    ⏱️ {advice.bestPeriod}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right no-print">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(s.symbol);
                                    }}
                                    className="text-xs bg-elevate hover:bg-brand/10 text-muted hover:text-brand px-3 py-2 rounded-lg border border-line font-bold flex items-center justify-center space-x-1 ml-auto transition duration-200"
                                  >
                                    <span>{lang === "th" ? "ดูวิเคราะห์เชิงลึก" : "Deep Analysis"}</span>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Interactive Timing Dashboard Accordion */}
                              {isExpanded && (
                                <tr key={`${s.symbol}-expanded`}>
                                  <td colSpan={7} className="px-4 sm:px-6 py-5 bg-elevate/10 border-t border-b border-line/45">
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between border-b border-line/60 pb-2">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="h-5 w-5 text-brand animate-pulse" />
                                          <h4 className="text-sm sm:text-base font-extrabold text-ink uppercase tracking-wider">
                                            {lang === "th" ? `ระบบวิเคราะห์เวลาช้อนซื้ออัจฉริยะ (AI Timing Intelligence) — ${s.symbol}` : `AI Timing & Strategy Intelligence — ${s.symbol}`}
                                          </h4>
                                        </div>
                                        <Badge tone="brand" className="text-xs font-extrabold uppercase px-2 py-0.5 rounded">
                                          {lang === "th" ? "อัพเดทเรียลไทม์ตามราคากระดาน" : "Real-time AI Model v1.2"}
                                        </Badge>
                                      </div>

                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        {/* Column 1: Strategy & Allocation Meter */}
                                        <Card className="p-4 border border-line/60 bg-surface/60 flex flex-col justify-between">
                                          <div>
                                            <div className="flex items-center gap-1.5 mb-2.5 text-brand">
                                              <TrendingUp className="h-4 w-4" />
                                              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                                                {lang === "th" ? "กลยุทธ์สะสมเงินลงทุน" : "Capital Allocation Strategy"}
                                              </span>
                                            </div>
                                            <div className="text-sm sm:text-base font-bold text-ink mb-2">
                                              {lang === "th" ? advice.strategyTh : advice.strategyEn}
                                            </div>
                                            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
                                              {lang === "th" ? advice.strategyDetailsTh : advice.strategyDetailsEn}
                                            </p>
                                          </div>

                                          {/* Visual Allocation Slider */}
                                          <div className="mt-5 pt-4 border-t border-line/60">
                                            <span className="block text-xs text-muted font-extrabold uppercase tracking-wider mb-2.5">
                                              {lang === "th" ? "อัตราส่วนการจัดสรรสัดส่วนการซื้อ" : "Optimal Allocation Split"}
                                            </span>
                                            {advice.verdict === "Strong Buy" && (
                                              <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs text-muted/90 font-bold font-mono">
                                                  <span>DCA: 15%</span>
                                                  <span className="text-green-500 font-extrabold">Lump-Sum: 85%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-line rounded-full overflow-hidden flex">
                                                  <div className="h-full bg-brand" style={{ width: "15%" }} />
                                                  <div className="h-full bg-green-500 animate-pulse" style={{ width: "85%" }} />
                                                </div>
                                                <span className="block text-[10px] text-green-500 italic mt-1.5 font-medium">
                                                  * {lang === "th" ? "จังหวะทอง: ราคาถูกผิดปกติ แนะนำรวบรวมไม้ใหญ่เพื่อความได้เปรียบ" : "Golden Dip: Highly discounted. Deploy bulk capitals."}
                                                </span>
                                              </div>
                                            )}
                                            {advice.verdict === "Accumulate" && (
                                              <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs text-muted/90 font-bold font-mono">
                                                  <span className="text-brand font-extrabold">DCA: 70%</span>
                                                  <span>Lump-Sum: 30%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-line rounded-full overflow-hidden flex">
                                                  <div className="h-full bg-brand animate-pulse" style={{ width: "70%" }} />
                                                  <div className="h-full bg-emerald-500" style={{ width: "30%" }} />
                                                </div>
                                                <span className="block text-[10px] text-brand italic mt-1.5 font-medium">
                                                  * {lang === "th" ? "ทยอยแบ่งไม้: สะสมเป็นระบบสัปดาละไม้ รักษาสมดุลต้นทุน" : "Systematic DCA: Accumulate weekly to balance cost structure."}
                                                </span>
                                              </div>
                                            )}
                                            {advice.verdict === "Hold" && (
                                              <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs text-muted/90 font-bold font-mono">
                                                  <span className="text-yellow-500 font-extrabold">Cash/Hold: 90%</span>
                                                  <span>DCA: 10%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-line rounded-full overflow-hidden flex">
                                                  <div className="h-full bg-yellow-500" style={{ width: "90%" }} />
                                                  <div className="h-full bg-brand/40" style={{ width: "10%" }} />
                                                </div>
                                                <span className="block text-[10px] text-yellow-500 italic mt-1.5 font-medium">
                                                  * {lang === "th" ? "รอช้อนจุดย่อ: ราคาอยู่ในเกณฑ์พอดีตัว แนะนำตั้งรับห่างๆ" : "Standby Cash: Trading at fair value. Place deep resting orders."}
                                                </span>
                                              </div>
                                            )}
                                            {advice.verdict === "Avoid" && (
                                              <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs text-muted/90 font-bold font-mono">
                                                  <span className="text-red-500 font-extrabold">Avoid: 100%</span>
                                                  <span>Cash: 0%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-line rounded-full overflow-hidden flex">
                                                  <div className="h-full bg-red-500" style={{ width: "100%" }} />
                                                </div>
                                                <span className="block text-[10px] text-red-500 italic mt-1.5 font-medium">
                                                  * {lang === "th" ? "ห้ามไล่ราคา: เกินมูลค่าเสี่ยงดอยสูง พิจารณาเทรดแบ่งขายทำกำไร" : "Overvalued: Heavy correction risks. Consider profit taking."}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </Card>

                                        {/* Column 2: Intraday Golden Hour Session Timeline */}
                                        <Card className="p-4 border border-line/60 bg-surface/60">
                                          <div className="flex items-center gap-1.5 mb-3 text-brand">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                                              {lang === "th" ? "ช่วงเวลาช้อปปิ้งจำเพาะเจาะจงของวัน (Intraday Windows)" : "Intraday Entry Sessions"}
                                            </span>
                                          </div>

                                          <div className="space-y-3">
                                            {advice.intradayTimeline.map((session, sIdx) => {
                                              const isHighlight = session.score >= 90;
                                              return (
                                                <div 
                                                  key={sIdx}
                                                  className={`p-2.5 rounded-xl border transition-all ${
                                                    isHighlight 
                                                      ? "bg-brand/5 border-brand/40 shadow-sm relative overflow-hidden" 
                                                      : "bg-surface/20 border-line/50"
                                                  }`}
                                                >
                                                  {isHighlight && (
                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand animate-pulse" />
                                                  )}
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-mono text-[10px] sm:text-xs font-extrabold text-ink bg-line/80 px-2 py-0.5 rounded-md">
                                                      ⏰ {session.hours}
                                                    </span>
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                                      session.score >= 90 
                                                        ? "bg-green-500/10 text-green-500 border border-green-500/10" 
                                                        : session.score >= 70 
                                                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/10" 
                                                        : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/10"
                                                    }`}>
                                                      {lang === "th" ? session.statusTh : session.statusEn}
                                                    </span>
                                                  </div>
                                                  <div className="mt-1.5 text-xs sm:text-sm font-extrabold text-ink">
                                                    {lang === "th" ? session.nameTh : session.nameEn}
                                                  </div>
                                                  <p className="mt-1 text-xs text-muted/95 leading-relaxed font-semibold">
                                                    {lang === "th" ? session.recommendationTh : session.recommendationEn}
                                                  </p>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </Card>

                                        {/* Column 3: Thai Local Market Seasonality Checklist */}
                                        <Card className="p-4 border border-line/60 bg-surface/60">
                                          <div className="flex items-center gap-1.5 mb-3 text-brand">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                                              {lang === "th" ? "ปัจจัยจิตวิทยาและพฤติกรรมกระดาน (Thai Focus)" : "Market Psychology & Seasonality Checklist"}
                                            </span>
                                          </div>

                                          <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
                                            <div className="p-3 bg-surface/50 border border-line/65 rounded-xl leading-relaxed text-xs sm:text-sm text-ink/90 font-bold shadow-inner">
                                              💡 {lang === "th" ? advice.rationale : advice.rationaleEn}
                                            </div>
                                            {advice.thaiMarketNotes.map((note, nIdx) => (
                                              <div key={nIdx} className="flex gap-2 items-start border-b border-line/20 pb-2.5 last:border-b-0 last:pb-0 font-semibold">
                                                <span className="text-brand font-bold text-xs select-none">📌</span>
                                                <span className="text-xs sm:text-sm text-ink/85 font-medium leading-relaxed">
                                                  {note}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </Card>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {overLimit > 0 && (
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center no-print">
              <p className="text-sm text-muted">
                {lang === "th" 
                  ? `แพ็กเกจฟรีบันทึกได้ ${limit} ตัว — มีอีก ${overLimit} ตัวที่ถูกซ่อนอยู่` 
                  : `Free tier tracks up to ${limit} items — ${overLimit} more items are hidden`}
              </p>
              <Link href="/pricing">
                <Button variant="gold" size="sm" className="mt-3">
                  <Crown className="h-4 w-4" /> {lang === "th" ? "อัปเกรดเพื่อบันทึกไม่จำกัด" : "Upgrade to Track Unlimited"}
                </Button>
              </Link>
            </div>
          )}

          <Card className="p-5 border border-line bg-surface/35 no-print">
            <div className="mb-4">
              <h3 className="font-display text-lg font-black text-ink">
                {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับ Watchlist หุ้น" : "Watchlist FAQ"}
              </h3>
              <p className="mt-1 text-xs font-semibold text-muted">
                {lang === "th"
                  ? "แนวทางใช้ Watchlist เพื่อคัดกรองหุ้นที่สนใจและรอจังหวะเข้าซื้ออย่างมีวินัย"
                  : "How to use your watchlist to track opportunities and plan disciplined entries."}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {faqItems.map((item) => (
                <div key={item.q} className="rounded-xl border border-line bg-bg/35 p-4">
                  <h4 className="font-display text-sm font-black text-ink">{item.q}</h4>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
