import fs from "fs";
import path from "path";

export interface FlatArticle {
  slug: string;
  title: string;
  category: string;
  read_time: string;
  summary: string;
  content: string;
  tag: string;
  lang: string;
  created_at?: string;
}

const FILE_PATH = path.join(process.cwd(), "lib", "flatdb_articles.json");

// Default initial articles
const SEED_ARTICLES: FlatArticle[] = [
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
    lang: "en",
    created_at: new Date("2026-05-30T12:00:00Z").toISOString(),
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
    lang: "en",
    created_at: new Date("2026-05-29T12:00:00Z").toISOString(),
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
    lang: "th",
    created_at: new Date("2026-05-28T12:00:00Z").toISOString(),
  }
];

// Helper to read articles from flat file
export function readFlatArticles(): FlatArticle[] {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      // Initialize with seed data
      fs.writeFileSync(FILE_PATH, JSON.stringify(SEED_ARTICLES, null, 2), "utf-8");
      return SEED_ARTICLES;
    }
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading flat database file:", err);
    return SEED_ARTICLES;
  }
}

// Helper to save/upsert article in flat file
export function saveFlatArticle(art: FlatArticle): boolean {
  try {
    const list = readFlatArticles();
    const existingIndex = list.findIndex((a) => a.slug === art.slug);
    
    const articleToSave = {
      ...art,
      created_at: art.created_at || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = articleToSave;
    } else {
      list.unshift(articleToSave); // Add to the top
    }

    fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving to flat database file:", err);
    return false;
  }
}

// Helper to delete article from flat file
export function deleteFlatArticle(slug: string): boolean {
  try {
    const list = readFlatArticles();
    const filtered = list.filter((a) => a.slug !== slug);
    fs.writeFileSync(FILE_PATH, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error deleting from flat database file:", err);
    return false;
  }
}
