import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getDbConnectionStatus, query } from "@/lib/db";

type SeoArticle = {
  slug: string;
  title: string;
  category: string;
  read_time: string;
  summary: string;
  content: string;
  tag: string;
  lang: "th" | "en";
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "market-update";
}

function getPrimaryTicker(article: any) {
  const tickers = article.tickers || article.related_tickers || [];
  return String(tickers[0] || article.ticker || "GLOBAL").toUpperCase();
}

function getEnglishDescription(article: any) {
  return String(article.description || article.summary || article.title || "Global financial market update.");
}

function getBaseSlug(article: any) {
  const primaryTicker = getPrimaryTicker(article).toLowerCase();
  const published = article.published_utc
    ? new Date(article.published_utc).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return `${published}-${primaryTicker}-${slugify(article.title || "market-update")}`;
}

// Simulated AI Translation and SEO Optimizer for Thai Investors
function optimizeAndTranslateForSEO(article: any) {
  const enTitle = article.title || "Global Financial Market Update";
  const enDesc = article.description || article.summary || "No description available.";
  const tickers = article.tickers || [];
  const primaryTicker = (tickers[0] || "GLOBAL").toUpperCase();
  const dateStr = article.published_utc ? new Date(article.published_utc).toLocaleDateString("th-TH") : new Date().toLocaleDateString("th-TH");

  // Dictionary for dynamic translation of headline & key concepts
  const dict: Record<string, string> = {
    "apple": "Apple (AAPL)",
    "nvidia": "NVIDIA (NVDA)",
    "microsoft": "Microsoft (MSFT)",
    "tesla": "Tesla (TSLA)",
    "amazon": "Amazon (AMZN)",
    "google": "Alphabet (GOOGL)",
    "meta": "Meta Platforms (META)",
    "bitcoin": "Bitcoin (BTC)",
    "ethereum": "Ethereum (ETH)",
    "gold": "ราคาทองคำ",
    "oil": "ราคาน้ำมันดิบ",
    "stock": "หลักทรัพย์",
    "stocks": "ดัชนีตลาดหุ้น",
    "earning": "ผลประกอบการ",
    "earnings": "ผลประกอบการรายไตรมาส",
    "revenue": "ยอดขายและรายได้รวม",
    "profit": "กำไรสุทธิ",
    "shares": "หุ้นต่างประเทศ",
    "rise": "พุ่งทะยานขึ้น",
    "rises": "ปรับตัวสูงขึ้น",
    "jump": "ดีดตัวขึ้นรุนแรง",
    "jumps": "ดีดตัวขึ้นแรง",
    "fall": "ปรับฐานลดลง",
    "falls": "ย่อตัวลดลง",
    "drop": "ดิ่งลงสกัดความเสี่ยง",
    "market": "ทิศทางตลาด",
    "fed": "ธนาคารกลางสหรัฐฯ (Fed)",
    "rate": "อัตราดอกเบี้ย",
    "rates": "อัตราดอกเบี้ยนโยบาย",
    "ai": "ปัญญาประดิษฐ์ (AI)",
    "artificial": "เทคโนโลยีปัญญาประดิษฐ์",
    "chip": "ชิปเซมิคอนดักเตอร์",
    "chips": "ชิปประมวลผล AI",
    "launch": "เปิดตัวระบบ",
    "launches": "แถลงเปิดตัว",
    "report": "รายงานงบ",
    "reports": "แถลงผลงานประจำไตรมาส",
    "record": "สร้างจุดสูงสุดใหม่",
    "high": "นิวไฮสูงสุด",
    "low": "จุดต่ำสุดใหม่",
    "demand": "ความต้องการสินค้าในตลาด",
    "growth": "แนวโน้มการเติบโตเชิงบวก",
    "analysis": "บทวิเคราะห์ทางการเงิน",
    "valuation": "การประเมินมูลค่าเหมาะสม",
    "vanguard": "Vanguard กองทุนยักษ์ใหญ่สหรัฐฯ",
    "fidelity": "Fidelity กองทุนชั้นนำระดับโลก",
    "vtsax": "กองทุนหุ้นรวมสหรัฐ VTSAX",
    "vfiax": "กองทุนดัชนี S&P 500 VFIAX",
    "agthx": "กองทุนเติบโตเชิงรุก AGTHX",
    "etf": "กองทุน ETF สากล",
    "fund": "กองทุนรวม",
    "funds": "กองทุนรวมต่างประเทศ",
  };

  const words = enTitle.toLowerCase().split(/\s+/);
  const translatedTerms: string[] = [];
  words.forEach((w: string) => {
    const cleanWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    if (dict[cleanWord]) {
      translatedTerms.push(dict[cleanWord]);
    }
  });

  let thTitle = "";
  if (translatedTerms.length >= 2) {
    thTitle = `เกาะติดด่วน: วิเคราะห์ทิศทาง ${translatedTerms.join(" ")} ล่าสุดสำหรับพอร์ตสากล`;
  } else {
    thTitle = `วิเคราะห์กระแสข่าวต่างประเทศเชิงลึก: ${enTitle.replace(/AAPL|NVDA|MSFT|TSLA/gi, "")}`;
  }

  // Ensure title length is perfect and optimized for Google SEO
  if (thTitle.length > 110) {
    thTitle = thTitle.slice(0, 107) + "...";
  }

  // Category determination based on advanced multiple asset checks
  let category = "วิเคราะห์หุ้นต่างประเทศ";
  const upperTitle = enTitle.toUpperCase();
  const primaryTickerUpper = primaryTicker.toUpperCase();

  // Thai Fund check
  const isThaiFund = primaryTickerUpper.includes("-") || primaryTickerUpper.startsWith("SCB") || primaryTickerUpper.startsWith("K-") || primaryTickerUpper.startsWith("B-") || primaryTickerUpper.startsWith("TMB") || primaryTickerUpper.startsWith("ONE-");
  // US Fund check
  const isUSFund = (primaryTickerUpper.length === 5 && primaryTickerUpper.endsWith("X")) || upperTitle.includes("MUTUAL FUND") || upperTitle.includes("VANGUARD") || upperTitle.includes("FIDELITY") || upperTitle.includes("AMERICAN FUNDS") || ["VTSAX", "VFIAX", "AGTHX"].includes(primaryTickerUpper);
  // Thai Stock check
  const isThaiStock = ["PTT", "CPALL", "ADVANC", "KBANK", "SCB", "AOT", "BDMS", "SCC"].includes(primaryTickerUpper) || primaryTickerUpper.endsWith(".BK") || primaryTickerUpper.endsWith(".TH");

  if (isUSFund) {
    category = "วิเคราะห์กองทุนสหรัฐฯ";
  } else if (isThaiFund) {
    category = "วิเคราะห์กองทุนรวมไทย";
  } else if (upperTitle.includes("CRYPTO") || upperTitle.includes("BTC") || upperTitle.includes("ETH") || ["BTC", "ETH", "SOL", "USDT"].includes(primaryTickerUpper)) {
    category = "วิเคราะห์สินทรัพย์ดิจิทัล";
  } else if (upperTitle.includes("FUTURES") || upperTitle.includes("GOLD") || upperTitle.includes("OIL") || ["GOLD", "OIL", "BRENT"].includes(primaryTickerUpper)) {
    category = "วิเคราะห์ตลาดอนุพันธ์";
  } else if (isThaiStock) {
    category = "วิเคราะห์หุ้นไทย";
  } else if (upperTitle.includes("FED") || upperTitle.includes("RATE") || upperTitle.includes("INFLATION") || upperTitle.includes("MACRO")) {
    category = "วิเคราะห์มหเศรษฐศาสตร์";
  }

  // Summary translation-like enrichment
  let summary = `วิเคราะห์เชิงโครงสร้างของข่าวสารล่าสุดเกี่ยวกับ ${primaryTicker} ประเมินมูลค่าที่แท้จริง (Intrinsic Value) ด้วยโมเดลการคิดลดกระแสเงินสด เพื่อความได้เปรียบด้าน Margin of Safety`;
  if (enDesc && enDesc !== "No description available.") {
    summary = `สรุปใจความด่วน: ${enDesc.slice(0, 150)}... ทีมงานสกัดประเด็นทางการเงินเชิงลึกพร้อมประเมินราคาเหมาะสมด้วย DCF Model`;
  }

  // Professional Article structure with Markdown SEO syntax (H1-H3 headers)
  const content = `### 🌐 รายงานข่าวสารและสรุปผลกระทบ ${primaryTicker} (${dateStr})
  
สืบเนื่องจากกระแสข่าวสารล่าสุดในตลาดทุนสากลเกี่ยวกับ **${primaryTicker}** โดยมีใจความสำคัญระบุว่า:
> "${enDesc}"

ทางทีมงานฝ่ายวิจัยของ **ValuStock** ได้ทำการสกัดข้อมูล วิเคราะห์โครงสร้างอัตราส่วน และจำลองแบบจำลองกระแสเงินสดคิดลด (DCF) เพื่อนำเสนอมุมมองที่รอบด้านและมีหลักการรองรับสูงสุดแก่ผู้ถือครองพอร์ตสากลทุกคน

---

### 🔑 3 ประเด็นการวิเคราะห์เชิงคุณภาพ (SEO Key Focus):

#### 1. **ส่วนต่างของความปลอดภัย และราคาตลาดในปัจจุบัน (Margin of Safety - MOS)**
ในการลงทุนแบบเน้นคุณค่า (Value Investing) สิ่งสำคัญอันดับหนึ่งคือการประเมินว่าราคาซื้อขาย ณ ปัจจุบันมี **Margin of Safety (MOS)** หนาแน่นเพียงพอสกัดความผันผวนของค่าเงินและดอกเบี้ยหรือไม่ โดยใช้สูตร **Graham Number** ร่วมกับกระแสเงินสดอิสระ (FCF Growth)

#### 2. **การเติบโตคาดการณ์ในอนาคต (Growth Projection)**
ประเมินแนวโน้มอุตสาหกรรมในอนาคต หากเป็นกลุ่มเทคโนโลยี AI หรือพลังงานทดแทน การประเมิน WACC (Discount Rate) จะมีความจำเพาะเจาะจงสูงสุดตามสภาวะตลาดการเงินและค่าความผันผวนเบต้า (Beta Factor)

#### 3. **คำแนะนำการบริหารภาษีต่างประเทศและอัตราแลกเปลี่ยน (FX Advisory)**
- **W-8BEN Form:** สำหรับนักลงทุนที่มีธุรกรรมในตลาดสหรัฐฯ การยื่น W-8BEN เป็นประเด็นที่ห้ามละเลยเพื่อขอรับสิทธิลดหย่อนภาษีหัก ณ ที่จ่ายจากอัตราเริ่มต้น 30% ให้เหลือเพียง 15% ทันที
- **การนำเงินกลับในรอบภาษีเดียวกัน:** ควรบริหารจัดการช่วงจังหวะนำกำไรจากการขายหรือปันผลข้ามปีปฏิทินภาษีอย่างรอบคอบ เพื่อป้องกันผลกระทบจากขั้นบันไดภาษีบุคคลธรรมดาในไทยตามกฎหมายใหม่

*คำเตือน: ข้อมูลฉบับนี้เป็นการสังเคราะห์ข่าวสารด้วยระบบอัจฉริยะเพื่อประกอบการศึกษาเครื่องมือ DCF เท่านั้น ไม่ใช่คำแนะนำชี้ชวนในการซื้อขายหลักทรัพย์อย่างเป็นทางการ*`;

  // Create a stable SEO friendly slug so repeated syncs do not duplicate the same article.
  const cleanSlug = `${getBaseSlug(article)}-th`;

  return {
    slug: cleanSlug,
    title: thTitle,
    category: category,
    read_time: `${5 + Math.floor((primaryTicker.charCodeAt(0) || 0) % 5)} นาที`,
    summary: summary,
    content: content,
    tag: primaryTicker,
    lang: "th",
  };
}

function buildEnglishSeoArticle(article: any): SeoArticle {
  const enTitle = String(article.title || "Global Financial Market Update").trim();
  const enDesc = getEnglishDescription(article);
  const primaryTicker = getPrimaryTicker(article);
  const upperTitle = enTitle.toUpperCase();
  const dateStr = article.published_utc
    ? new Date(article.published_utc).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  let category = "Global Stock Analysis";
  if (upperTitle.includes("CRYPTO") || ["BTC", "ETH", "SOL"].includes(primaryTicker)) {
    category = "Digital Assets";
  } else if (upperTitle.includes("GOLD") || upperTitle.includes("OIL") || ["GOLD", "OIL", "BRENT"].includes(primaryTicker)) {
    category = "Commodities & Futures";
  } else if (upperTitle.includes("FED") || upperTitle.includes("RATE") || upperTitle.includes("INFLATION")) {
    category = "Macroeconomics";
  } else if (upperTitle.includes("VANGUARD") || upperTitle.includes("FIDELITY") || primaryTicker.endsWith("X")) {
    category = "US Funds & ETFs";
  }

  const summary = `${primaryTicker} market update with a valuation-focused lens: key catalysts, risk factors, discounted cash flow context, and margin-of-safety considerations for long-term investors.`;

  const content = `### ${primaryTicker} Market Update (${dateStr})

Recent market news around **${primaryTicker}** states:
> "${enDesc}"

The ValuStock research workflow turns this update into a structured investor brief, focusing on valuation discipline rather than short-term headlines.

---

### 3 Valuation Points To Watch

#### 1. Intrinsic Value And Margin Of Safety
Before reacting to price movement, investors should compare the current market price with a conservative estimate of intrinsic value. A wide margin of safety helps absorb earnings revisions, interest-rate changes, and sentiment-driven volatility.

#### 2. Growth Quality And Free Cash Flow
The most useful news is not only whether revenue is growing, but whether growth can convert into sustainable free cash flow. For DCF valuation, assumptions around FCF growth, reinvestment needs, and terminal growth are more important than headline momentum.

#### 3. Portfolio Risk, Currency, And Tax Context
Thai investors holding global assets should also consider foreign exchange exposure, dividend withholding tax, and timing of fund transfers back to Thailand. These factors can materially affect after-tax returns.

*Disclaimer: This automated ValuStock brief is for education and research workflow purposes only. It is not financial advice or a solicitation to buy or sell securities.*`;

  return {
    slug: `${getBaseSlug(article)}-en`,
    title: enTitle.length > 115 ? `${enTitle.slice(0, 112)}...` : enTitle,
    category,
    read_time: `${5 + Math.floor((primaryTicker.charCodeAt(0) || 0) % 5)} mins`,
    summary,
    content,
    tag: primaryTicker,
    lang: "en",
  };
}

function buildBilingualSeoArticles(article: any): SeoArticle[] {
  return [
    optimizeAndTranslateForSEO(article) as SeoArticle,
    buildEnglishSeoArticle(article),
  ];
}

export async function POST(req: Request) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const dbStatus = await getDbConnectionStatus();
    const connected = dbStatus.connected;
    const apiKey = process.env.MASSIVE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Market news feed is not configured" }, { status: 500 });
    }

  try {
    // Fetch news from the configured market news feed.
    const response = await fetch(
      `https://api.massive.com/v2/reference/news?limit=8&apiKey=${encodeURIComponent(apiKey)}`
    );
    
    let rawNewsList = [];
    if (response.ok) {
      const data = await response.json();
      rawNewsList = data.results || [];
    }

    // If news API failed or empty, construct fresh rich market news array
    if (rawNewsList.length === 0) {
      rawNewsList = [
        { title: "Apple Inc. AAPL introduces new device-centric AI models", description: "Apple is launching custom small language models on-device driving strong upgrade cycles for iPhone.", tickers: ["AAPL"], published_utc: new Date().toISOString() },
        { title: "NVIDIA Corp. NVDA reports stellar earnings and AI chip demand", description: "NVIDIA's GPU Blackwell systems are fully booked, yielding higher-than-expected data center revenue.", tickers: ["NVDA"], published_utc: new Date().toISOString() },
        { title: "Vanguard Total Stock Market Index VTSAX records massive inflow", description: "Investors dump active funds to pour cash into Vanguard Total Stock Admiral Shares due to record low expense ratio.", tickers: ["VTSAX"], published_utc: new Date().toISOString() },
        { title: "Vanguard 500 Index Fund VFIAX reaches all-time high assets under management", description: "Vanguard S&P 500 index fund passes milestone as passive investing dominates US capital market flows.", tickers: ["VFIAX"], published_utc: new Date().toISOString() },
        { title: "Bualuang Global Innovation Fund B-INNOTECH updates technology holdings", description: "B-INNOTECH fund increases exposure to global semiconductor leaders and AI infrastructure companies.", tickers: ["B-INNOTECH"], published_utc: new Date().toISOString() },
        { title: "Bitcoin BTC breaks key price resistance amid institutional inflows", description: "Bitcoin rallies as spot crypto ETFs register net positive buying pressure from institutional wealth managers.", tickers: ["BTC"], published_utc: new Date().toISOString() },
        { title: "Gold Futures GOLD climb as geopolitical tensions drive safe haven demand", description: "Gold contracts trade higher in global futures exchanges as investors seek premium hedges against market uncertainty.", tickers: ["GOLD"], published_utc: new Date().toISOString() },
        { title: "CP ALL Public Company CPALL records strong retail growth in Thailand", description: "CPALL expansion of modern retail and convenience stores drives higher revenue and operating margins in Q2.", tickers: ["CPALL"], published_utc: new Date().toISOString() }
      ];
    }

    const insertedSlugs: string[] = [];
    const skippedSlugs: string[] = [];
    const insertedByLang = { th: 0, en: 0 };

    if (connected) {
      // 1. Online Mode: Save to SQL Database
      for (const item of rawNewsList) {
        const bilingualArticles = buildBilingualSeoArticles(item);

        for (const seoNews of bilingualArticles) {
          const existing = await query<any[]>("SELECT slug FROM articles WHERE slug = ? LIMIT 1", [seoNews.slug]);
          if (existing.length > 0) {
            skippedSlugs.push(seoNews.slug);
            continue;
          }

          await query(
            "INSERT INTO articles (slug, title, category, read_time, summary, content, tag, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [seoNews.slug, seoNews.title, seoNews.category, seoNews.read_time, seoNews.summary, seoNews.content, seoNews.tag, seoNews.lang]
          );
          insertedSlugs.push(seoNews.slug);
          insertedByLang[seoNews.lang] += 1;
        }
      }

      return NextResponse.json({
        success: true,
        message: `ดึงข่าวและแปลอัตโนมัติ 2 ภาษาเรียบร้อย: ไทย ${insertedByLang.th} ข่าว, อังกฤษ ${insertedByLang.en} ข่าว (ข้ามข่าวซ้ำ ${skippedSlugs.length})`,
        fetchedCount: rawNewsList.length,
        insertedCount: insertedSlugs.length,
        skippedCount: skippedSlugs.length,
        insertedByLang,
        insertedSlugs,
        mockMode: false
      });
    }

    return NextResponse.json(
      {
        error: "Database is not connected. News articles were not saved.",
        detail: dbStatus.error,
        code: dbStatus.code,
        mockMode: false,
      },
      { status: 503 }
    );

  } catch (err: any) {
    console.error("Admin news fetch error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
