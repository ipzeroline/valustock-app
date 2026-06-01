import { NextResponse } from "next/server";
import { isDbConnected, query } from "@/lib/db";
import { readFlatArticles } from "@/lib/flatdb";

// Seed articles for database initialization and Mock Mode fallbacks
const MOCK_ARTICLES = [
  {
    slug: "tech-vs-dividend",
    title: "US Technology vs. Thai Dividend Stocks: How to Allocate in 2H2026?",
    category: "Asset Allocation",
    read_time: "5 mins",
    summary: "A deep dive into industrial structures of the US Tech and Thai Dividend sectors, detailing global growth strategies alongside inbound personal tax updates for Thai citizens.",
    content: `In global asset allocation, Thai investors often face a key dilemma: Global Growth vs. Local Yield.

**1. US Technology (US Tech)**
Features future-oriented tech industries driven by AI, cloud computing, and semiconductors (e.g., NVDA, MSFT, AAPL) yielding massive capital gains but minimal yields and high volatility.

**2. Thai Dividend Equities**
Blue chips like PTT, ADVANC, and CPALL offer stable earnings, steady defensive cash flows, and attractive dividend yields of 4-7% which anchor portfolios during down cycles.

**Portfolio Advice for Thai Investors:**
- Working Professionals (Ages 25-45): Maintain a Core Portfolio with 60% in US Tech/Global stocks for compounding growth, alongside a Satellite Portfolio with 30% in high-yielding Thai equities, and 10% in liquid instruments.
- International Tax Management: Plan personal inbound earnings transfers meticulously or defer offshore earnings across calendar years to leverage lower brackets.`,
    tag: "Portfolio Tips",
    lang: "en"
  },
  {
    slug: "feeder-funds-guide",
    title: "Thai Feeder Funds Handbook: Avoid Double-Layer Management Fees",
    category: "Offshore Mutual Funds",
    read_time: "4 mins",
    summary: "Understand the mechanics connecting Thai local Feeder Funds to global Master Funds. Discover hidden expense ratios to keep your compounding yields intact.",
    content: `Feeder funds provide Thai investors with direct cross-border market access without opening foreign accounts. However, double-layer fee structures must be carefully reviewed.

**Understanding Double-Layer Fees:**
1. Local Management Fee (Thai Feeder): Charged by local asset managers, typically ranging from 0.5% to 1.5% annually.
2. Global Management Fee (Master Fund): Charged by institutional global managers (e.g., Morgan Stanley, BlackRock), typically ranging from 0.7% to 1.8% annually.

**Feeder Fund Selection Tips:**
- Always analyze the Total Expense Ratio (TER) in the fund's official prospectus.
- Review the tracking error and historical correlation against its underlying Master Fund.
- Prefer institutional or accumulation units to minimize double-dipping fees.`,
    tag: "Fund Analysis",
    lang: "en"
  },
  {
    slug: "w-8ben-tax-tips",
    title: "เจาะลึกวิธียื่นแบบฟอร์ม W-8BEN เพื่อลดภาษีปันผลหุ้นสหรัฐฯ เหลือ 15%",
    category: "ภาษี & กฎหมาย",
    read_time: "6 นาที",
    summary: "ขั้นตอนละเอียดสำหรับนักลงทุนที่เปิดพอร์ตนอกประเทศ เพื่อรับสิทธิ์ลดหย่อนภาษีหัก ณ ที่จ่ายจากปันผลสหรัฐฯ จากปกติ 30% ให้เหลือเพียง 15% ตามอนุสัญญาภาษีซ้อน",
    content: `สำหรับนักลงทุนไทยที่เน้นเก็บหุ้นปันผลในฝั่งอเมริกา (เช่น Coca-Cola, Realty Income หรือ Microsoft) ภาษีปันผลหัก ณ ที่จ่ายถือเป็นปัจจัยสำคัญที่ห้ามมองข้าม...

**แบบฟอร์ม W-8BEN คืออะไร?**
W-8BEN (Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting) เป็นแบบฟอร์มที่พิสูจน์ว่าคุณเป็นคนไทย (บุคคลธรรมดาต่างชาติที่ไม่ได้พำนักในสหรัฐฯ) เพื่อขอใช้สิทธิ์ภายใต้อนุสัญญาภาษีซ้อน (Double Taxation Treaty - DTA) ระหว่างไทยและสหรัฐฯ

**ประโยชน์สูงสุด:**
- ลดอัตราภาษีปันผลจาก 30% เหลือเพียง 15% ทันที
- แบบฟอร์มมีอายุ 3 ปีปฏิทิน (ต้องกรอกใหม่เมื่อครบกำหนด)

**ขั้นตอนยื่นผ่านโบรกเกอร์ไทยหรือโบรกเกอร์นอก:**
1. โบรกเกอร์ส่วนใหญ่ในไทย (เช่น InnovestX, Dime) และโบรกเกอร์นอก (เช่น Interactive Brokers) จะมีระบบกรอก W-8BEN อิเล็กทรอนิกส์ให้คุณทันทีก่อนเริ่มซื้อขายหุ้นต่างประเทศ
2. ตรวจสอบข้อมูลชื่อ-ที่อยู่ให้ตรงกับพาสปอร์ตไทย
3. กรอกหมายเลขบัตรประชาชนไทยในช่อง Foreign Tax Identifying Number (TIN)`,
    tag: "ความรู้ภาษี",
    lang: "th"
  }
];

export async function GET() {
  const connected = await isDbConnected();

  try {
    if (connected) {
      const flatArticles = readFlatArticles();
      const seedArticles = flatArticles.length > 0 ? flatArticles : MOCK_ARTICLES;

      for (const a of seedArticles) {
        const createdAt = "created_at" in a ? (a.created_at as string | undefined) : undefined;
        await query(
          "INSERT IGNORE INTO articles (slug, title, category, read_time, summary, content, tag, lang, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            a.slug,
            a.title,
            a.category || "General",
            a.read_time || "5 mins",
            a.summary || "",
            a.content || "",
            a.tag || "",
            a.lang || "th",
            createdAt ? new Date(createdAt) : new Date(),
          ]
        );
      }

      const rows = await query("SELECT slug, title, category, read_time, summary, content, tag, lang, created_at FROM articles ORDER BY created_at DESC");
      
      // If table is empty, auto-seed with standard articles
      if (rows.length === 0) {
        for (const a of MOCK_ARTICLES) {
          await query(
            "INSERT INTO articles (slug, title, category, read_time, summary, content, tag, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [a.slug, a.title, a.category, a.read_time, a.summary, a.content, a.tag, a.lang]
          );
        }
        const seeded = await query("SELECT slug, title, category, read_time, summary, content, tag, lang, created_at FROM articles ORDER BY created_at DESC");
        return NextResponse.json({ articles: seeded, mockMode: false });
      }

      return NextResponse.json({ articles: rows, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database articles fetch error:", err.message);
  }

  // Fallback to local Flat-Files database if offline
  const flatArticles = readFlatArticles();
  return NextResponse.json({ articles: flatArticles, mockMode: true });
}

export async function POST(req: Request) {
  const connected = await isDbConnected();
  const { slug, title, category, read_time, summary, content, tag, lang } = await req.json();

  if (!slug || !title) {
    return NextResponse.json({ error: "Slug and Title are required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query(`
        INSERT INTO articles (slug, title, category, read_time, summary, content, tag, lang)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = ?, category = ?, read_time = ?, summary = ?, content = ?, tag = ?, lang = ?
      `, [
        slug, title, category || "General", read_time || "5 mins", summary || "", content || "", tag || "", lang || "th",
        title, category || "General", read_time || "5 mins", summary || "", content || "", tag || "", lang || "th"
      ]);

      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database article upsert error:", err.message);
    return NextResponse.json(
      { error: "Database article upsert failed", detail: err.message, mockMode: true },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Article was not saved to the real database.", mockMode: true },
    { status: 503 }
  );
}

export async function DELETE(req: Request) {
  const connected = await isDbConnected();
  const { slug } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    if (connected) {
      await query("DELETE FROM articles WHERE slug = ?", [slug]);
      return NextResponse.json({ success: true, mockMode: false });
    }
  } catch (err: any) {
    console.error("Database article delete error:", err.message);
    return NextResponse.json(
      { error: "Database article delete failed", detail: err.message, mockMode: true },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Database is not connected. Article was not deleted from the real database.", mockMode: true },
    { status: 503 }
  );
}
