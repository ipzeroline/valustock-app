"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PLANS } from "@/lib/plans";
import { baht, dollar, pct, num } from "@/lib/format";
import { Sparkline } from "@/components/Charts";
import { AssetLogo } from "@/components/AssetLogo";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import type { Stock } from "@/lib/types";
import { useTranslation } from "@/lib/translations";
import { useStore } from "@/lib/store";
import { blogArticles } from "@/lib/blogArticles";
import {
  Calculator,
  Gauge,
  Filter,
  Layers,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  ChevronRight,
  Target,
  Info,
  Database,
  Clock,
  CheckCircle,
  Eye,
} from "@/lib/icons";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  tag: string;
  gradient: string;
  href?: string;
}

interface ValuationOpportunity {
  symbol: string;
  name: string;
  enName: string;
  assetType?: string;
  category: "thai" | "us" | "etf" | "alternative";
  currency?: "THB" | "USD";
  color: string;
  price: number;
  fairValue: number;
  marginOfSafety: number;
  pe: number;
  dividendYield: number;
  changePct: number;
  priceHistory: number[];
  href: string;
}

interface MarketUniversePayload {
  stocks?: Stock[];
  counts?: {
    thai: number;
    nyse: number;
    nasdaq: number;
    indices: number;
    funds: number;
    usFunds: number;
    crypto: number;
    futures: number;
  };
  updatedAt?: string;
}

type SnapshotTab = "overview" | "thai" | "us" | "fund" | "alternative";

interface PublicReview {
  id: number;
  name: string;
  emailMask: string;
  rating: number;
  title: string;
  content: string;
  approvedAt: string | null;
  createdAt: string;
}

interface MyReview {
  id: number;
  name: string;
  rating: number;
  title: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const FEATURED_ARTICLES_TH: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "หุ้นเทคโนโลยีสหรัฐฯ vs หุ้นปันผลไทย: จัดพอร์ตอย่างไรในครึ่งปีหลัง?",
    category: "จัดพอร์ตการลงทุน",
    date: "30 พ.ค. 2026",
    readTime: "5 นาที",
    tag: "แนะจัดพอร์ต",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "เจาะลึกโครงสร้างอุตสาหกรรมในตลาดหุ้นสหรัฐฯ (US tech) และตลาดหุ้นไทย (Value/Dividend) พร้อมวิเคราะห์วิธีลดความเสี่ยงจากอัตราแลกเปลี่ยนภาษีนำเข้าเงินกลับประเทศแบบใหม่"
  },
  {
    id: "feeder-funds-guide",
    title: "คู่มือเลือกกองทุนรวม Feeder Fund สำหรับคนไทย: เลี่ยงค่าธรรมเนียมซ้ำซ้อน",
    category: "กองทุนรวมต่างประเทศ",
    date: "29 พ.ค. 2026",
    readTime: "4 นาที",
    tag: "สำหรับกองทุน",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "เข้าใจความเชื่อมโยงระหว่างกองทุนไทย (Feeder Fund) และกองทุนหลักต่างประเทศ (Master Fund) เคล็ดลับดูค่าธรรมเนียมแฝงไม่ให้ผลตอบแทนตกหล่น"
  },
  {
    id: "w-8ben-tax-tips",
    title: "เจาะลึกวิธียื่นแบบฟอร์ม W-8BEN เพื่อลดภาษีปันผลหุ้นสหรัฐฯ เหลือ 15%",
    category: "ภาษี & กฎหมาย",
    date: "28 พ.ค. 2026",
    readTime: "6 นาที",
    tag: "ความรู้ภาษี",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "ขั้นตอนละเอียดสำหรับนักลงทุนที่เปิดพอร์ตนอกประเทศ เพื่อรับสิทธิ์ลดหย่อนภาษีหัก ณ ที่จ่ายจากปันผลสหรัฐฯ จากปกติ 30% ให้เหลือเพียง 15% ตามอนุสัญญาภาษีซ้อน"
  }
];

const FEATURED_ARTICLES_EN: Article[] = [
  {
    id: "tech-vs-dividend",
    title: "US Technology vs. Thai Dividend Stocks: How to Allocate in 2H2026?",
    category: "Asset Allocation",
    date: "May 30, 2026",
    readTime: "5 mins",
    tag: "Portfolio Tips",
    gradient: "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20",
    summary: "A deep dive into industrial structures of the US Tech and Thai Dividend sectors, detailing global growth strategies alongside inbound personal tax updates for Thai citizens."
  },
  {
    id: "feeder-funds-guide",
    title: "Thai Feeder Funds Handbook: Avoid Double-Layer Management Fees",
    category: "Offshore Mutual Funds",
    date: "May 29, 2026",
    readTime: "4 mins",
    tag: "Fund Analysis",
    gradient: "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    summary: "Understand the mechanics connecting Thai local Feeder Funds to global Master Funds. Discover hidden expense ratios to keep your compounding yields intact."
  },
  {
    id: "w-8ben-tax-tips",
    title: "Step-by-Step W-8BEN Filing Guide to Halve US Withholding Dividend Taxes",
    category: "Taxation & Regulation",
    date: "May 28, 2026",
    readTime: "6 mins",
    tag: "Tax Education",
    gradient: "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    summary: "A complete walk-through for international investors filing W-8BEN certificates to lower US dividend withholding taxes from 30% down to 15% under double-taxation treaties."
  }
];

function formatArticleDate(value: string, lang: "th" | "en") {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatArticleViews(value: number, lang: "th" | "en") {
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US").format(value);
}

function buildHomeBlogArticles(lang: "th" | "en"): Article[] {
  const tones = [
    "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20",
    "from-amber-600/20 to-red-600/20 text-amber-400 border-amber-500/20",
    "from-blue-600/20 to-cyan-600/20 text-cyan-400 border-cyan-500/20",
    "from-lime-600/20 to-emerald-600/20 text-emerald-400 border-emerald-500/20",
    "from-orange-600/20 to-amber-600/20 text-amber-400 border-amber-500/20",
    "from-violet-600/20 to-blue-600/20 text-blue-400 border-blue-500/20",
  ];

  const articles: Article[] = [];

  blogArticles.slice(0, 6).forEach((article, index) => {
    articles.push({
        id: article.slug,
        title: lang === "th" ? article.titleTh : article.titleEn,
        category: lang === "th" ? article.category : article.category,
        date: formatArticleDate(article.modified || article.published, lang),
        readTime: article.readTime,
        tag: article.symbol,
        gradient: tones[index % tones.length],
        summary: lang === "th" ? article.descriptionTh : article.descriptionEn,
        href: `/blog/${article.slug}`,
    });
  });

  return articles;
}

export default function Landing() {
  const { t, lang } = useTranslation();
  const { ready, user } = useStore();

  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [apiOpportunities, setApiOpportunities] = useState<ValuationOpportunity[]>([]);
  const [marketUniverse, setMarketUniverse] = useState<Stock[]>([]);
  const [marketUniverseMeta, setMarketUniverseMeta] = useState<MarketUniversePayload | null>(null);
  const [activeAssetTab, setActiveAssetTab] = useState<SnapshotTab>("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [articleViews, setArticleViews] = useState<Record<string, number>>({});

  // Newsletter subscription states
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [newsletterStartedAt, setNewsletterStartedAt] = useState(() => Date.now());
  const [newsletterWebsite, setNewsletterWebsite] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) return;

    setSubscribing(true);
    setSubscribeError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          source: "landing-newsletter",
          lang,
          website: newsletterWebsite,
          elapsedMs: Date.now() - newsletterStartedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Newsletter subscription failed");
      }
      setSubscribed(true);
      setEmail("");
      setNewsletterWebsite("");
      setNewsletterStartedAt(Date.now());
    } catch (err: any) {
      setSubscribeError(
        lang === "th"
          ? "บันทึกอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
          : err.message || "Could not save your subscription. Please try again."
      );
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          const mapped = data.articles.slice(0, 3).map((a: any) => {
            const isAapl = a.tag === "AAPL";
            const isNvda = a.tag === "NVDA";
            const isMsft = a.tag === "MSFT";
            let gradient = "from-amber-600/20 to-red-600/20 text-amber-400 border-red-500/20";
            if (isAapl) gradient = "from-blue-600/20 to-purple-600/20 text-purple-400 border-purple-500/20";
            if (isNvda) gradient = "from-emerald-600/20 to-teal-600/20 text-teal-400 border-teal-500/20";
            if (isMsft) gradient = "from-blue-600/20 to-cyan-600/20 text-cyan-400 border-cyan-500/20";

            return {
              id: a.slug,
              title: a.title,
              category: a.category || (lang === "th" ? "ข่าวด่วนเชิงลึก" : "Hot News Analysis"),
              date: a.created_at ? new Date(a.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US") : (lang === "th" ? "วันนี้" : "Today"),
              readTime: a.read_time || (lang === "th" ? "5 นาที" : "5 mins"),
              tag: a.tag || "News",
              gradient: gradient,
              summary: a.summary || "",
            };
          });
          setDbArticles(mapped);
        }
      })
      .catch((err) => console.error("Error fetching homepage articles:", err));
  }, [lang]);

  useEffect(() => {
    fetch("/api/home/valuation-opportunities?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.opportunities?.length) {
          setApiOpportunities(payload.opportunities);
        }
      })
      .catch((err) => console.error("Error fetching homepage valuation opportunities:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadMarketUniverse = () => {
      fetch("/api/stocks/universe?limit=90", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((payload: MarketUniversePayload | null) => {
          if (cancelled || !payload?.stocks?.length) return;
          setMarketUniverse(payload.stocks);
          setMarketUniverseMeta(payload);
        })
        .catch((err) => console.error("Error fetching homepage market universe:", err));
    };

    loadMarketUniverse();
    const interval = window.setInterval(loadMarketUniverse, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const fetchReviews = () => {
    fetch("/api/reviews?limit=9")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload) return;
        setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
        setMyReview(payload.myReview || null);
        if (payload.myReview) {
          setReviewForm({
            rating: payload.myReview.rating || 5,
            title: payload.myReview.title || "",
            content: payload.myReview.content || "",
          });
        }
      })
      .catch((err) => console.error("Error fetching user reviews:", err));
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.email]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      setReviewError(lang === "th" ? "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว" : "Please sign in before writing a review.");
      return;
    }

    setReviewSaving(true);
    setReviewError("");
    setReviewMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save review");
      setReviewMessage(lang === "th" ? "บันทึกรีวิวแล้ว รอแอดมินอนุมัติก่อนแสดงหน้าเว็บ" : "Review saved. It will appear after admin approval.");
      fetchReviews();
    } catch (err: any) {
      setReviewError(
        lang === "th"
          ? "บันทึกรีวิวไม่สำเร็จ กรุณาตรวจสอบข้อความและลองใหม่"
          : err.message || "Could not save your review. Please try again."
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const articlesList = useMemo(() => {
    const homeBlogArticles = buildHomeBlogArticles(lang);
    const mocks = lang === "th" ? FEATURED_ARTICLES_TH : FEATURED_ARTICLES_EN;
    const combined = [...homeBlogArticles, ...dbArticles, ...mocks];
    const seen = new Set<string>();
    const unique: Article[] = [];
    for (const art of combined) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        unique.push(art);
      }
    }
    return unique.slice(0, 6);
  }, [dbArticles, lang]);

  useEffect(() => {
    const slugs = articlesList
      .filter((article) => article.href?.startsWith("/blog/"))
      .map((article) => article.id);
    if (!slugs.length) return;

    let cancelled = false;
    fetch(`/api/blog/views?slugs=${encodeURIComponent(slugs.join(","))}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled && payload.views) {
          setArticleViews((current) => ({ ...current, ...payload.views }));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [articlesList]);

  const valuationOpportunities = useMemo<ValuationOpportunity[]>(() => {
    return apiOpportunities
      .filter((row) => Number.isFinite(row.fairValue) && Number.isFinite(row.marginOfSafety))
      .sort((a, b) => {
        if (a.category !== b.category) {
          return ["thai", "us", "etf", "alternative"].indexOf(a.category) - ["thai", "us", "etf", "alternative"].indexOf(b.category);
        }
        if (a.category === "etf") {
          const priority = ["GLD", "SPY", "QQQ", "VOO", "SCHD", "TLT", "JEPQ", "XLE"];
          return (priority.indexOf(a.symbol) === -1 ? 99 : priority.indexOf(a.symbol)) -
            (priority.indexOf(b.symbol) === -1 ? 99 : priority.indexOf(b.symbol));
        }
        if (a.category === "alternative") {
          const priority = ["GOLD", "BTC", "ETH", "OIL", "SILVER", "COPPER"];
          return (priority.indexOf(a.symbol) === -1 ? 99 : priority.indexOf(a.symbol)) -
            (priority.indexOf(b.symbol) === -1 ? 99 : priority.indexOf(b.symbol));
        }
        return b.marginOfSafety - a.marginOfSafety;
      })
      .filter((row) => row.category !== "etf" || ["GLD", "SPY", "QQQ", "VOO", "SCHD", "TLT", "JEPQ", "XLE"].includes(row.symbol))
      .filter((row) => row.category !== "alternative" || ["GOLD", "BTC", "ETH", "OIL", "SILVER", "COPPER"].includes(row.symbol));
  }, [apiOpportunities]);

  const toOpportunityCard = (row: ValuationOpportunity) => ({
    stock: row,
    val: {
      verdict: row.marginOfSafety >= 15 ? "undervalued" : row.marginOfSafety <= -10 ? "overvalued" : "fair",
      fairValue: row.fairValue,
      marginOfSafety: row.marginOfSafety,
      ratios: {
        pe: row.pe,
        roe: Number.NaN,
        dividendYield: row.dividendYield,
      },
    },
  });

  const demoCard = useMemo<ValuationOpportunity | null>(() => {
    const fromUniverse = marketUniverse
      .filter((stock) => stock.price > 0 && stock.assetType !== "INDEX")
      .map((stock) => {
        const isValuableStock = stock.assetType === "TH_STOCK" || stock.assetType === "US_STOCK";
        const valuation = isValuableStock
          ? (() => {
              try {
                return computeValuation(stock, defaultDCFParams(stock));
              } catch {
                return null;
              }
            })()
          : null;
        const category: ValuationOpportunity["category"] =
          stock.assetType === "TH_STOCK"
            ? "thai"
            : stock.assetType === "US_STOCK"
              ? "us"
              : stock.assetType === "FUND" || stock.assetType === "US_FUND" || stock.assetType === "ETF"
                ? "etf"
                : "alternative";
        const fairValue =
          valuation?.fairValue && Number.isFinite(valuation.fairValue) && valuation.fairValue > 0
            ? valuation.fairValue
            : stock.price;
        const marginOfSafety =
          valuation?.marginOfSafety !== undefined && Number.isFinite(valuation.marginOfSafety)
            ? valuation.marginOfSafety
            : 0;
        const pe = valuation?.ratios.pe ?? Number.NaN;
        const dividendYield = stock.price > 0 ? (stock.financials.dividendPerShare / stock.price) * 100 : 0;
        const changePct = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;

        return {
          symbol: stock.symbol,
          name: stock.name,
          enName: stock.enName,
          assetType: stock.assetType,
          category,
          currency: stock.currency,
          color: stock.color,
          price: stock.price,
          fairValue,
          marginOfSafety,
          pe,
          dividendYield,
          changePct,
          priceHistory: stock.priceHistory || [],
          href: `/stocks/${encodeURIComponent(stock.symbol.toUpperCase())}`,
        };
      });

    const candidates = (valuationOpportunities.length ? valuationOpportunities : fromUniverse).filter(
      (row) =>
        row.price > 0 &&
        row.fairValue > 0 &&
        Number.isFinite(row.marginOfSafety) &&
        (row.category === "thai" || row.category === "us" || row.category === "etf")
    );

    if (!candidates.length) return null;

    return [...candidates].sort((a, b) => {
      const score = (row: ValuationOpportunity) => {
        const mosScore = Math.max(-50, Math.min(100, row.marginOfSafety)) * 1.6;
        const dividendScore = Math.max(0, Math.min(8, row.dividendYield || 0)) * 3;
        const momentumScore = Math.max(-10, Math.min(10, row.changePct || 0)) * 0.8;
        const stockTypeScore = row.category === "thai" || row.category === "us" ? 12 : 4;
        const dataScore = row.priceHistory?.length ? 4 : 0;
        return mosScore + dividendScore + momentumScore + stockTypeScore + dataScore;
      };
      return score(b) - score(a);
    })[0];
  }, [marketUniverse, valuationOpportunities]);
  const demoVal = demoCard ? toOpportunityCard(demoCard).val : null;

  // Real-time top 3 undervalued stocks from the valuation feed
  const topUndervalued = useMemo(() => {
    return valuationOpportunities
      .filter((row) => row.marginOfSafety >= 15)
      .sort((a, b) => b.marginOfSafety - a.marginOfSafety)
      .slice(0, 3)
      .map(toOpportunityCard);
  }, [valuationOpportunities]);

  // Real-time top 3 dividend stocks from the valuation feed
  const topDividend = useMemo(() => {
    return valuationOpportunities
      .filter((row) => row.dividendYield >= 3.5)
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, 3)
      .map(toOpportunityCard);
  }, [valuationOpportunities]);

  // Topic Cluster Investment Guides
  const investmentGuides = [
    {
      level: lang === "th" ? "Beginner" : "Beginner",
      badgeColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      topics: [
        {
          title: lang === "th" ? "Intrinsic Value คืออะไร?" : "What is Intrinsic Value?",
          desc: lang === "th" ? "ทำความเข้าใจพื้นฐานมูลค่าที่แท้จริงเพื่อไม่ซื้อของแพง" : "Learn the absolute baseline of valuation targets to guard capital assets.",
          link: "/insights/dcf-calculator-stock-valuation"
        },
        {
          title: lang === "th" ? "DCF คืออะไร?" : "What is a DCF Model?",
          desc: lang === "th" ? "เจาะลึกกระแสเงินสดคิดลด และวิธีประเมินแบบมือโปร" : "Master multi-stage Discounted Cash Flow models in simple terms.",
          link: "/dcf-calculator"
        },
        {
          title: lang === "th" ? "Margin of Safety คืออะไร?" : "What is Margin of Safety?",
          desc: lang === "th" ? "ส่วนเผื่อความปลอดภัยที่เบนจามิน เกรแฮม เน้นย้ำเสมอ" : "Introduced by Graham, learn how to build solid safety cushions.",
          link: "/intrinsic-value-calculator"
        }
      ]
    },
    {
      level: lang === "th" ? "Intermediate" : "Intermediate",
      badgeColor: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
      topics: [
        {
          title: lang === "th" ? "วิธีหาหุ้น Undervalued" : "How to Find Undervalued Stocks",
          desc: lang === "th" ? "เคล็ดลับการใช้ส่วนลดราคาและสแกนงบเพื่อแต้มต่อพอร์ต" : "Step-by-step guidelines to screen undervalued companies dynamically.",
          link: "/undervalued-stocks"
        },
        {
          title: lang === "th" ? "PE Ratio เท่าไรถึงเรียกว่าถูก?" : "Optimal PE Ratios for Value Moats",
          desc: lang === "th" ? "เข้าใจระดับค่าเฉลี่ยและการแยกแยะกับดัก PE ต่ำลวง" : "Identify high earnings yields and differentiate value traps.",
          link: "/stock-valuation"
        }
      ]
    },
    {
      level: lang === "th" ? "Advanced" : "Advanced",
      badgeColor: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      topics: [
        {
          title: lang === "th" ? "DCF Model แบบ Warren Buffett" : "Warren Buffett's DCF Valuation Model",
          desc: lang === "th" ? "ถอดสูตรแบบฉบับออเนอร์เอิร์นนิ่งที่เบิร์กเชียร์ใช้จริง" : "Understand Buffett's Owner Earnings calculations in cash flows.",
          link: "/value-investing"
        },
        {
          title: lang === "th" ? "Owner Earnings Valuation" : "Owner Earnings Valuation Blueprint",
          desc: lang === "th" ? "เจาะลึกกระแสเงินสดอิสระที่แท้จริงของผู้ประกอบการ" : "An advanced guide on corporate solvency and capital allocation.",
          link: "/methodology"
        }
      ]
    }
  ];

  const searchIntentCards = [
    {
      title: lang === "th" ? "หุ้นตัวนี้ถูกหรือแพง?" : "Is this stock cheap or expensive?",
      desc: lang === "th"
        ? "เปรียบเทียบราคาตลาดกับมูลค่าเหมาะสมจาก DCF, Graham Number และ Margin of Safety เพื่อดูว่าหุ้นมีแต้มต่อพอหรือไม่"
        : "Compare market price against DCF, Graham Number, and Margin of Safety estimates before committing capital.",
      link: "/intrinsic-value-calculator",
      linkText: lang === "th" ? "คำนวณมูลค่าเหมาะสมของหุ้น" : "Calculate intrinsic value",
      icon: Target,
    },
    {
      title: lang === "th" ? "หุ้นพื้นฐานดีมีตัวไหนบ้าง?" : "Which stocks have strong fundamentals?",
      desc: lang === "th"
        ? "คัดกรองหุ้นด้วย ROE, P/E, กระแสเงินสด, เงินปันผล และงบดุล เพื่อหาโอกาสลงทุนระยะยาวทั้งหุ้นไทยและหุ้นอเมริกา"
        : "Screen equities by ROE, P/E, free cash flow, dividends, and balance-sheet strength across Thai and US markets.",
      link: "/stocks",
      linkText: lang === "th" ? "เปิดโปรแกรมคัดกรองหุ้น" : "Open stock screener",
      icon: Filter,
    },
    {
      title: lang === "th" ? "หุ้น undervalue และหุ้นปันผลสูงหายังไง?" : "How do I find undervalued and dividend stocks?",
      desc: lang === "th"
        ? "รวมรายการหุ้นราคาถูกพื้นฐานดีและหุ้นปันผลสูง พร้อมตัวเลขที่ใช้ตรวจว่าเป็นโอกาสจริงหรือเป็น value trap"
        : "Find deep-value and dividend candidates with practical checks against common value traps.",
      link: "/undervalued-stocks",
      linkText: lang === "th" ? "ดูหุ้น undervalue" : "View undervalued stocks",
      icon: Shield,
    },
  ];

  const keywordLinks = [
    { label: lang === "th" ? "เครื่องมือประเมินมูลค่าหุ้น" : "Stock valuation tool", href: "/intrinsic-value-calculator" },
    { label: lang === "th" ? "เครื่องคำนวณ DCF หุ้น" : "DCF calculator", href: "/dcf-calculator" },
    { label: lang === "th" ? "หุ้น undervalue" : "Undervalued stocks", href: "/undervalued-stocks" },
    { label: lang === "th" ? "หุ้นปันผลสูง" : "High dividend stocks", href: "/dividend-stocks" },
    { label: lang === "th" ? "วิธีประเมินมูลค่าหุ้น" : "How to value stocks", href: "/stock-valuation" },
    { label: lang === "th" ? "แนวคิดลงทุนแบบ VI" : "Value investing guide", href: "/value-investing" },
    { label: lang === "th" ? "สูตรและวิธีคำนวณ" : "Methodology", href: "/methodology" },
    { label: lang === "th" ? "เปรียบเทียบหุ้นและ ETF" : "Compare stocks and ETFs", href: "/compare" },
  ];

  const reviewAverage = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const reviewStatusText = myReview
    ? myReview.status === "approved"
      ? lang === "th" ? "รีวิวของคุณเผยแพร่แล้ว" : "Your review is published"
      : myReview.status === "rejected"
      ? lang === "th" ? "รีวิวของคุณถูกปฏิเสธ สามารถแก้ไขและส่งใหม่ได้" : "Your review was rejected. You can edit and resubmit."
      : lang === "th" ? "รีวิวของคุณอยู่ระหว่างรอแอดมินอนุมัติ" : "Your review is waiting for admin approval"
    : "";

  // Homepage FAQs
  const homeFaqs = useMemo(() => [
    {
      q: lang === "th" ? "ValuStock คำนวณ Fair Value (มูลค่าเหมาะสม) อย่างไร?" : "How does ValuStock calculate Fair Value?",
      a: lang === "th"
        ? "เราใช้แบบจำลองทางการเงิน 2 แบบหลักคือกระแสเงินสดคิดลด (DCF) ร่วมกับสูตร Benjamin Graham Number โดยอ้างอิง WACC (ต้นทุนเงินทุน) และ Book Value จริงจาก SEC/SET เพื่อประเมินมูลค่าเหมาะสมออกมาอย่างเป็นระบบ"
        : "We utilize two core valuation frameworks: a conservative Discounted Cash Flow (DCF) model and the classic Benjamin Graham Number, drawing directly from SEC and SET exchange balance sheets."
    },
    {
      q: lang === "th" ? "ข้อมูลราคาและอัตราส่วนการเงินอัปเดตบ่อยแค่ไหน?" : "How often are the financial metrics updated?",
      a: lang === "th"
        ? "ราคาตลาดล่าสุดซิงก์จากแหล่งข้อมูลตลาด พร้อมแสดงสถานะความสดใหม่ของราคา ส่วนข้อมูลสรุปงบการเงินและอัตราส่วนปันผลจะอัปเดตตามรอบข้อมูลล่าสุด"
        : "Market prices sync from market-data feeds with quote freshness shown clearly. Financial ratios and dividend metrics update on the latest available data cycles."
    },
    {
      q: lang === "th" ? "สามารถประเมินมูลค่ากองทุนรวมหรือ ETF (เช่น SPY, VOO) ได้ด้วยหรือไม่?" : "Can I evaluate ETFs and Mutual Funds like SPY or VOO?",
      a: lang === "th"
        ? "ได้ครับ แพลตฟอร์มของเราสนับสนุนการวิเคราะห์สัดส่วนกองทุนดัชนีชั้นนำระดับโลก โดยจะคำนวณอัตราส่วนค่าใช้จ่าย (Expense Ratio), ขนาด AUM และพอร์ตการถือครอง (Holdings) แตกต่างจากหุ้นรายตัวเพื่อประสิทธิภาพสูงสุด"
        : "Yes. Our platform fully supports top-tier global ETFs. We dynamically adjust our metrics to evaluate management fees (Expense Ratio), fund sizes (AUM), and NAV indexes instead of single company metrics."
    },
    {
      q: lang === "th" ? "ส่วนเผื่อความปลอดภัย (Margin of Safety) ควรอยู่ที่เท่าไรจึงจะปลอดภัย?" : "What is an optimal Margin of Safety buffer?",
      a: lang === "th"
        ? "สำหรับนักลงทุนแนวคุณค่า (Value Investors) แนะนำส่วนเผื่อความปลอดภัยขั้นต่ำที่ 15% - 30% ขึ้นไป เพื่อช่วยเป็นกันชนป้องกันพอร์ตเมื่อเกิดความคาดเคลื่อนในการประเมินกระแสเงินสดอนาคต"
        : "For defensive value reinvestors, we recommend maintaining a Margin of Safety between 15% and 30%. This serves as an operational buffer against long-term cash flow projection errors."
    },
    {
      q: lang === "th" ? "มือใหม่ใช้ ValuStock หาหุ้นตัวไหนดีได้ไหม?" : "Can beginners use ValuStock to find stock ideas?",
      a: lang === "th"
        ? "ได้ครับ หน้าโปรแกรมคัดกรองหุ้นช่วยเริ่มจากคำถามง่าย ๆ เช่น หุ้นตัวนี้ถูกหรือแพง หุ้นพื้นฐานดีตัวไหนน่าสนใจ และหุ้นมี Margin of Safety เพียงพอหรือไม่ จากนั้นผู้ใช้ควรอ่านงบและศึกษาความเสี่ยงก่อนลงทุนจริง"
        : "Yes. The screener starts from practical questions such as whether a stock is cheap, financially strong, and trading with enough Margin of Safety. Users should still review filings and risks before investing."
    },
    {
      q: lang === "th" ? "หุ้น undervalue ต่างจากหุ้นราคาถูกทั่วไปอย่างไร?" : "How are undervalued stocks different from simply cheap stocks?",
      a: lang === "th"
        ? "หุ้น undervalue คือหุ้นที่ราคาตลาดต่ำกว่ามูลค่าที่ประเมินได้จากพื้นฐาน เช่น กระแสเงินสด กำไร คุณภาพงบดุล และผลตอบแทนต่อผู้ถือหุ้น ไม่ใช่แค่หุ้นที่ P/E ต่ำหรือราคาลดลงแรง"
        : "An undervalued stock trades below a reasonable estimate of intrinsic value based on cash flow, earnings quality, balance-sheet strength, and shareholder returns, not just a low P/E ratio."
    },
    {
      q: lang === "th" ? "DCF Calculator เหมาะกับหุ้นแบบไหน?" : "What types of stocks are best suited for DCF valuation?",
      a: lang === "th"
        ? "DCF เหมาะกับธุรกิจที่มีกระแสเงินสดคาดการณ์ได้พอสมควร เช่น บริษัทกำไรสม่ำเสมอ เติบโตเป็นรอบชัดเจน หรือมี free cash flow เป็นบวกต่อเนื่อง หุ้นวัฏจักรหนักหรือธุรกิจขาดทุนอาจต้องใช้สมมติฐานระมัดระวังเป็นพิเศษ"
        : "DCF is best for companies with reasonably forecastable cash flows, recurring earnings, or consistent free cash flow. Cyclical or loss-making businesses require more conservative assumptions."
    }
  ], [lang]);

  const sectionClass = "mx-auto max-w-6xl px-5 py-9 sm:py-11 lg:py-14";
  const borderedSectionClass = `${sectionClass} border-t border-line/60`;
  const compactSectionClass = "mx-auto max-w-4xl px-5 py-9 sm:py-11 lg:py-14 border-t border-line/60";
  const centeredHeaderClass = "mx-auto mb-6 max-w-2xl text-center sm:mb-7 lg:mb-8";
  const splitHeaderClass = "mb-6 flex flex-col gap-4 sm:mb-7 md:flex-row md:items-end md:justify-between lg:mb-8";
  const eyebrowClass = "chip mb-3 inline-flex max-w-full items-center gap-1.5 text-xs font-bold leading-relaxed [overflow-wrap:anywhere]";
  const sectionTitleClass = "font-display text-2xl font-bold leading-tight text-ink [text-wrap:balance] sm:text-3xl";
  const dataInfrastructure = [
    {
      title: lang === "th" ? "Global Market Data" : "Global Market Data",
      detail: lang === "th"
        ? "ราคา, กราฟย้อนหลัง, งบการเงิน, ETF holdings, ข่าว, technical indicators, dividends และ macro"
        : "Quotes, historical charts, fundamentals, ETF holdings, news, technical indicators, dividends, and macro data.",
      badge: lang === "th" ? "Global coverage" : "Global coverage",
      icon: Database,
    },
    {
      title: lang === "th" ? "US Market Layer" : "US Market Layer",
      detail: lang === "th"
        ? "รองรับหุ้นและ ETF สหรัฐฯ พร้อมแสดงสถานะความสดใหม่ของราคาอย่างชัดเจน"
        : "Supports US stocks and ETFs with clear quote freshness and delayed/realtime status.",
      badge: lang === "th" ? "US market layer" : "US market layer",
      icon: Clock,
    },
    {
      title: lang === "th" ? "Smart Speed Layer" : "Smart Speed Layer",
      detail: lang === "th"
        ? "จัดเก็บข้อมูลที่ใช้บ่อยอย่างเหมาะสม เพื่อให้ราคา กราฟ และ Market Intelligence เปิดเร็ว"
        : "Optimizes frequently used market data so quotes, charts, and intelligence panels load quickly.",
      badge: lang === "th" ? "Fast loading" : "Fast loading",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="max-w-full overflow-x-hidden pb-10 md:pb-14">
      {/* 📊 Structured JSON-LD Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://valustock.com/#software",
                "url": "https://valustock.com",
                "name": "ValuStock",
                "applicationCategory": "FinancialApplication",
                "operatingSystem": "All",
                "description": "เครื่องมือประเมินมูลค่าหุ้นและคำนวณ DCF สำหรับนักลงทุนไทย ใช้ Intrinsic Value, Graham Number และ Margin of Safety เพื่อคัดกรองหุ้นพื้นฐานดี หุ้น undervalue และหุ้นปันผลสูง",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "THB",
                  "category": "FreeTrial"
                },
                "screenshot": "https://valustock.com/opengraph-image",
                ...(reviews.length
                  ? {
                      "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": Number(reviewAverage.toFixed(1)),
                        "ratingCount": reviews.length,
                        "bestRating": 5,
                        "worstRating": 1
                      },
                      "review": reviews.slice(0, 6).map((review) => ({
                        "@type": "Review",
                        "author": {
                          "@type": "Person",
                          "name": review.name
                        },
                        "datePublished": review.approvedAt || review.createdAt,
                        "name": review.title || "ValuStock user review",
                        "reviewBody": review.content,
                        "reviewRating": {
                          "@type": "Rating",
                          "ratingValue": review.rating,
                          "bestRating": 5,
                          "worstRating": 1
                        }
                      }))
                    }
                  : {})
              },
              {
                "@type": "WebSite",
                "@id": "https://valustock.com/#website",
                "url": "https://valustock.com",
                "name": "ValuStock — เครื่องมือประเมินมูลค่าหุ้นสำหรับนักลงทุนไทย",
                "description": "ประเมินมูลค่าหุ้นด้วย DCF, Intrinsic Value และ Margin of Safety คัดกรองหุ้นพื้นฐานดี หุ้น undervalue หุ้นปันผลสูง และดูว่าหุ้นไทยหรือหุ้นอเมริกาถูกหรือแพง",
                "publisher": {
                  "@id": "https://valustock.com/#organization"
                },
                "inLanguage": "th"
              },
              {
                "@type": "Organization",
                "@id": "https://valustock.com/#organization",
                "name": "ValuStock",
                "url": "https://valustock.com",
                "logo": "https://valustock.com/icon"
              },
              {
                "@type": "FAQPage",
                "@id": "https://valustock.com/#faq",
                "mainEntity": homeFaqs.map((faq) => ({
                  "@type": "Question",
                  "name": faq.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.a
                  }
                }))
              }
            ]
          })
        }}
      />

      {/* 🚀 1. HERO SECTION (Stock Valuation Platform) */}
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="aurora absolute inset-0 -z-10" />
        <div className="grid-lines absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-start gap-7 px-4 pb-9 pt-7 text-center sm:px-5 sm:py-11 md:min-h-[600px] md:items-center lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:min-h-[640px] lg:gap-10 lg:py-14 lg:text-left">
          <div className="animate-fade-up mx-auto min-w-0 max-w-md sm:max-w-2xl lg:mx-0">
            <span className={`${eyebrowClass} mx-auto justify-center border-brand/35 bg-brand/10 text-brand sm:text-sm lg:mx-0 lg:justify-start`}>
              <Sparkles className="h-3.5 w-3.5" /> 
              {lang === "th" 
                ? "แพลตฟอร์มประเมินมูลค่าหุ้น และคัดกรองระบบงบการเงิน" 
                : "Institutional Stock Valuation & Intrinsic Value Terminal"}
            </span>
            
            <h1 className="mt-4 max-w-full font-display text-3xl font-bold leading-[1.18] text-ink [word-break:break-word] sm:text-4xl md:text-5xl">
              {lang === "th" ? (
                <>
                  <span className="block">ValuStock</span>
                  <span className="block">เครื่องมือประเมินมูลค่าหุ้น</span>
                  <span className="mt-3 block text-lg font-bold text-muted sm:text-xl md:text-2xl">
                    คำนวณ DCF และค้นหา <strong className="text-brand font-bold">หุ้นพื้นฐานดี</strong> สำหรับนักลงทุนระยะยาว
                  </span>
                </>
              ) : (
                <>
                  <span className="block">ValuStock</span>
                  <span className="block">Ultimate Stock Valuation Tool</span>
                  <span className="mt-3 block text-lg font-bold text-muted sm:text-xl md:text-2xl">
                    Calculate <strong className="text-brand font-bold">Intrinsic Value</strong> & Find Undervalued Equities
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere] sm:max-w-xl sm:text-base lg:mx-0">
              {lang === "th" 
                ? "ตอบคำถาม 'หุ้นตัวไหนดี' และ 'หุ้นไทยถูกหรือแพง' ด้วยข้อมูลตลาดหลายชั้นที่ออกแบบมาให้ราคา กราฟ ข่าว งบ และ Market Intelligence โหลดไวในที่เดียว"
                : "Answer what to buy and whether equities are cheap or expensive with a multi-layer market-data engine built for fast quotes, charts, news, fundamentals, and market intelligence."}
            </p>

            <div className="mx-auto mt-6 flex max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:mx-0 lg:justify-start">
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-xs sm:w-auto sm:text-sm">
                  {t("common.startFree")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/stocks" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-xs sm:w-auto sm:text-sm">
                  {lang === "th" ? "สแกนหาหุ้นน่าซื้อ 📈" : "Explore Undervalued Stocks 📈"}
                </Button>
              </Link>
            </div>

            <nav className="mx-auto mt-5 flex max-w-sm flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-muted sm:max-w-none sm:text-xs lg:mx-0 lg:justify-start" aria-label="ลิงก์เครื่องมือประเมินมูลค่าหุ้นยอดนิยม">
              <Link className="hover:text-brand" href="/dcf-calculator">DCF Calculator</Link>
              <Link className="hover:text-brand" href="/intrinsic-value-calculator">Intrinsic Value</Link>
              <Link className="hover:text-brand" href="/undervalued-stocks">หุ้น undervalue</Link>
              <Link className="hover:text-brand" href="/dividend-stocks">หุ้นปันผลสูง</Link>
            </nav>
          </div>

          {/* Product Visual */}
          <div className="animate-fade-up min-w-0 w-full [animation-delay:120ms] lg:justify-self-end">
            <div className="mx-auto w-full max-w-[560px] text-left">
              <div className="relative overflow-hidden rounded-2xl border border-line bg-surface/55 shadow-card">
                <Image
                  src="/opengraph-image"
                  alt={lang === "th" ? "ภาพตัวอย่างหน้าแดชบอร์ด ValuStock สำหรับประเมินมูลค่าหุ้น" : "ValuStock stock valuation dashboard preview"}
                  width={1200}
                  height={630}
                  priority
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="block h-auto w-full"
                />
              </div>

              <div className="mt-3 rounded-2xl border border-line bg-bg/75 p-4 shadow-card backdrop-blur-md sm:p-5">
                {demoCard && demoVal ? (
                  <>
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <AssetLogo symbol={demoCard.symbol} color={demoCard.color} size="md" />
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="font-display font-bold">{demoCard.symbol}</span>
                            <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-muted">
                              {demoCard.category === "thai"
                                ? "SET"
                                : demoCard.category === "us"
                                  ? "US"
                                  : demoCard.category === "etf"
                                    ? "ETF/FUND"
                                    : "ALT"}
                            </span>
                          </div>
                          <div className="truncate text-xs text-muted">{lang === "th" ? demoCard.name : demoCard.enName}</div>
                        </div>
                      </div>
                      <span className={`chip w-fit border-up/30 bg-up/10 text-up text-[11px] font-black`}>
                        {lang === "th" ? "ตัวเด่นประจำตลาด" : "Market pick"}
                      </span>
                    </div>
                    <div className="my-4 h-14">
                      <Sparkline data={demoCard.priceHistory?.length ? demoCard.priceHistory : [demoCard.price]} up={demoCard.changePct >= 0} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Mini label={t("landing.marketPrice")} value={demoCard.currency === "USD" ? dollar(demoCard.price) : baht(demoCard.price)} />
                      <Mini
                        label={t("landing.fairValue")}
                        value={demoCard.currency === "USD" ? dollar(demoVal.fairValue) : baht(demoVal.fairValue)}
                        accent
                      />
                      <Mini label="P/E" value={Number.isFinite(demoVal.ratios.pe) ? num(demoVal.ratios.pe, 1) : "—"} />
                      <Mini
                        label={t("landing.marginOfSafety")}
                        value={pct(demoVal.marginOfSafety, 0)}
                        up={demoVal.marginOfSafety >= 0}
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid min-h-[170px] place-items-center text-center text-xs font-bold text-muted">
                    {lang === "th" ? "กำลังเตรียมภาพรวมตลาด..." : "Preparing market overview..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DATA INFRASTRUCTURE STRIP */}
      <section className="border-b border-line/60 bg-surface/35">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-5 md:grid-cols-3">
          {dataInfrastructure.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-line bg-bg/65 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-extrabold text-ink">{item.title}</h2>
                      <span className="rounded-full border border-line bg-elevate px-2 py-0.5 text-[10px] font-black text-muted">
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{item.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VALUATION OPPORTUNITY CHART */}
      <section className={borderedSectionClass}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="min-w-0">
            <span className={`${eyebrowClass} border-up/30 bg-up/10 text-up`}>
              <TrendingUp className="h-3.5 w-3.5" />
              {lang === "th" ? "หุ้นสหรัฐ ETF ทอง และสินทรัพย์ทางเลือก" : "US stocks, ETFs, gold, and alternatives"}
            </span>
            <h2 className={sectionTitleClass}>
              {lang === "th"
                ? "ภาพรวมตลาดโลกแบบย่อ: SET, NYSE, Nasdaq, Bitcoin และทองคำ"
                : "Compact Global Market Snapshot: SET, NYSE, Nasdaq, Bitcoin, and Gold"}
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
              {lang === "th"
                ? "เลือกดูหุ้นไทย หุ้นสหรัฐ ETF/กองทุน ดัชนีหลัก Bitcoin และทองคำในพื้นที่เดียว พร้อมข้อมูลตลาดที่จัดเตรียมให้โหลดไวและดูภาพรวมได้ครบ"
                : "Switch between Thai stocks, US equities, ETFs/funds, major indices, Bitcoin, and gold in one panel with fast, organized market coverage."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "SET / mai",
                "NYSE / Nasdaq",
                "S&P 500 / DJIA / IXIC",
                "Bitcoin / Gold",
                "Margin of Safety",
              ].map((label) => (
                <span key={label} className="rounded-full border border-line bg-bg px-3 py-1.5 text-[11px] font-bold text-muted">
                  {label}
                </span>
              ))}
            </div>
            <Link href="/undervalued-stocks" className="mt-5 inline-flex">
              <Button variant="outline" size="sm" className="font-bold">
                {lang === "th" ? "ดูหุ้น undervalue ทั้งหมด" : "View all undervalued stocks"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <ValuationGapChart
            rows={valuationOpportunities}
            marketRows={marketUniverse}
            meta={marketUniverseMeta}
            lang={lang}
            activeTab={activeAssetTab}
            onTabChange={setActiveAssetTab}
          />
        </div>
      </section>

      {/* SEO SEARCH INTENT SECTION */}
      <section className={borderedSectionClass}>
        <div className={centeredHeaderClass}>
          <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
            <Gauge className="h-3.5 w-3.5" /> {lang === "th" ? "คำถามที่นักลงทุนไทยค้นหาบ่อย" : "High-intent investor searches"}
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "เครื่องมือประเมินมูลค่าหุ้นสำหรับนักลงทุนไทย" : "Stock Valuation Tools for Long-Term Investors"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
            {lang === "th"
              ? "ValuStock ช่วยตอบคำถามสำคัญก่อนซื้อหุ้น เช่น หุ้นตัวไหนดี หุ้นไทยถูกหรือแพง มูลค่าเหมาะสมควรเป็นเท่าไร และหุ้นมีส่วนเผื่อความปลอดภัยเพียงพอสำหรับลงทุนระยะยาวหรือไม่"
              : "ValuStock helps investors answer whether a stock is cheap or expensive, what its fair value may be, and whether there is enough Margin of Safety for long-term allocation."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {searchIntentCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.link}
                href={item.link}
                className="group surface rounded-2xl border border-line p-5 text-center transition duration-300 hover:border-brand/40 hover:shadow-lg sm:p-6"
              >
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand transition duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold leading-snug text-ink group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
                  {item.desc}
                </p>
                <span className="mt-4 inline-flex items-center justify-center gap-1 text-xs font-extrabold text-brand">
                  {item.linkText} <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-line bg-surface/35 p-4 sm:p-5">
          <h3 className="font-display text-sm font-bold text-ink">
            {lang === "th" ? "คำค้นยอดนิยมที่ ValuStock ครอบคลุม" : "Popular valuation topics covered"}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywordLinks.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-full border border-line bg-bg px-3 py-1.5 text-[11px] font-bold text-muted transition hover:border-brand/40 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🛠️ 2. TOP FEATURES SECTION */}
      <section className={sectionClass}>
        <div className={centeredHeaderClass}>
          <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
            <Calculator className="h-3.5 w-3.5" /> High-Utility Core Toolkits
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "เครื่องมือวิเคราะห์หุ้น คำนวณ DCF และคัดกรองหุ้นพื้นฐานดี" : "Premium Valuation Toolkits"}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* DCF CALCULATOR */}
          <Link href="/dcf-calculator" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand group-hover:scale-110 transition duration-300">
              <Calculator className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">DCF Calculator</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "คิดลดกระแสเงินสดล่วงหน้า 10 ปี เพื่อประเมินมูลค่าเป้าหมายต่อหุ้นจริง" : "Project 10-year FCF scenarios and discount them back to capture precise value parameters."}
            </p>
          </Link>

          {/* INTRINSIC VALUE */}
          <Link href="/intrinsic-value-calculator" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition duration-300">
              <Target className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">Intrinsic Value</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "เครื่องคำนวณสูตร Benjamin Graham และตัวเลขความปลอดภัย (MOS)" : "Compute defensive Graham Multiples and required bond rate cushions instantly."}
            </p>
          </Link>

          {/* STOCK SCREENER */}
          <Link href="/stocks" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition duration-300">
              <Filter className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">Stock Screener</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "โปรแกรมคัดกรองหุ้นพื้นฐานดี หุ้นปันผลสูง และหุ้น undervalue จากราคา งบ ปันผล และข้อมูล ETF ที่อัปเดตจากระบบตลาด" : "Filter cash cows and deep discounts using market-backed quotes, statements, dividends, and ETF datasets."}
            </p>
          </Link>

          {/* PORTFOLIO ANALYSIS */}
          <Link href="/portfolio" className="group surface border border-line rounded-2xl p-6 hover:border-brand/40 hover:shadow-lg transition duration-300">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition duration-300">
              <Layers className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display font-bold text-ink group-hover:text-brand transition">Portfolio Analysis</h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed font-medium">
              {lang === "th" ? "จัดพอร์ตลงทุนจำลอง ติดตามปันผล และประเมินน้ำหนักสินทรัพย์อัจฉริยะ" : "Simulate capital allocations, track dividend yields, and balance asset grades."}
            </p>
          </Link>
        </div>
      </section>

      {/* 🔍 3. TOP UNDERVALUED STOCKS */}
      <section className={sectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-2xl">
            <span className={`${eyebrowClass} border-up/30 bg-up/10 text-up`}>
              <Sparkles className="h-3.5 w-3.5" /> High-Conviction Value Targets
            </span>
            <h2 className={sectionTitleClass}>
              {lang === "th" ? "หุ้นราคาต่ำกว่ามูลค่าประเมินดีที่สุด (Top Undervalued Stocks)" : "Top Undervalued Stocks"}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
              {lang === "th" ? "หลักทรัพย์งบการเงินเด่นที่มีส่วนเผื่อความปลอดภัย (Margin of Safety) สูงสุดในฐานข้อมูล" : "Real-time ledger of deep price discounts computed relative to dynamic intrinsic targets."}
            </p>
          </div>
          <Link href="/undervalued-stocks">
            <Button variant="outline" size="sm" className="font-bold flex items-center gap-1">
              {lang === "th" ? "ดูอันดับทั้งหมด" : "Explore Screener"} <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {topUndervalued.length === 0 && (
            <div className="surface col-span-full rounded-2xl border border-line p-6 text-center text-xs font-bold text-muted">
              {lang === "th" ? "กำลังจัดอันดับหุ้นราคาต่ำกว่ามูลค่า..." : "Preparing undervalued rankings..."}
            </div>
          )}
          {topUndervalued.map(({ stock, val }: { stock: any; val: any }) => {
            const isUS = stock.currency === "USD";
            const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
            return (
              <div key={stock.symbol} className="surface border border-line rounded-2xl p-5 hover:border-brand/40 transition duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AssetLogo symbol={stock.symbol} color={stock.color} size="sm" />
                    <div>
                      <Link href={`/stocks/${stock.symbol.toLowerCase()}`} className="font-mono font-bold text-ink hover:text-brand block">
                        {stock.symbol}
                      </Link>
                      <span className="text-[10px] text-muted font-semibold truncate block max-w-[120px]">
                        {lang === "th" ? stock.name : (stock.enName || stock.name)}
                      </span>
                    </div>
                  </div>
                  <span className="chip border-up/30 bg-up/10 text-up font-bold text-[9px]">
                    MOS {pct(val.marginOfSafety, 0)}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-line/40 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">P/E Ratio</span>
                    <span className="font-mono text-ink mt-0.5 block">{num(val.ratios.pe, 1)}x</span>
                  </div>
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">{lang === "th" ? "ราคาประเมิน" : "Fair Value"}</span>
                    <span className="font-mono text-gold mt-0.5 block">{f}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 💰 4. TOP DIVIDEND STOCKS */}
      <section className={sectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-2xl">
            <span className={`${eyebrowClass} border-gold/30 bg-gold/10 text-gold`}>
              <Sparkles className="h-3.5 w-3.5" /> Sustainable Yield Compounds
            </span>
            <h2 className={sectionTitleClass}>
              {lang === "th" ? "หุ้นปันผลตอบแทนสม่ำเสมอดีที่สุด (Top Dividend Stocks)" : "Top Dividend Stocks"}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
              {lang === "th" ? "คัดกรองหุ้นปันผลเด่นที่มีระดับการหมุนเวียนและเสถียรภาพงบสูงสุด" : "Qualifying cash cow index sorted dynamically by estimated dividend yields."}
            </p>
          </div>
          <Link href="/dividend-stocks">
            <Button variant="outline" size="sm" className="font-bold flex items-center gap-1">
              {lang === "th" ? "ดูอันดับทั้งหมด" : "Explore Screener"} <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {topDividend.length === 0 && (
            <div className="surface col-span-full rounded-2xl border border-line p-6 text-center text-xs font-bold text-muted">
              {lang === "th" ? "กำลังจัดอันดับหุ้นปันผลเด่น..." : "Preparing dividend rankings..."}
            </div>
          )}
          {topDividend.map(({ stock, val }: { stock: any; val: any }) => {
            const isUS = stock.currency === "USD";
            const f = isUS ? dollar(val.fairValue) : baht(val.fairValue);
            return (
              <div key={stock.symbol} className="surface border border-line rounded-2xl p-5 hover:border-brand/40 transition duration-300 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AssetLogo symbol={stock.symbol} color={stock.color} size="sm" />
                    <div>
                      <Link href={`/stocks/${stock.symbol.toLowerCase()}`} className="font-mono font-bold text-ink hover:text-brand block">
                        {stock.symbol}
                      </Link>
                      <span className="text-[10px] text-muted font-semibold truncate block max-w-[120px]">
                        {lang === "th" ? stock.name : (stock.enName || stock.name)}
                      </span>
                    </div>
                  </div>
                  <span className="chip border-gold/30 bg-gold/10 text-gold font-bold text-[9px]">
                    Yield {num(val.ratios.dividendYield, 2)}%
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-line/40 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">ROE %</span>
                    <span className="font-mono text-ink mt-0.5 block">
                      {Number.isFinite(val.ratios.roe) ? `${num(val.ratios.roe, 1)}%` : "—"}
                    </span>
                  </div>
                  <div className="bg-bg/50 p-2 rounded-xl border border-line font-semibold">
                    <span className="text-[10px] text-muted block font-medium">{lang === "th" ? "ราคาประเมิน" : "Fair Value"}</span>
                    <span className="font-mono text-gold mt-0.5 block">{f}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 📰 5. LATEST ANALYSIS */}
      <section id="insights" className={borderedSectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-xl">
            <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
              <Sparkles className="h-3.5 w-3.5" /> Hot Value Reports
            </span>
            <h2 className={`${sectionTitleClass} md:text-4xl`}>
              {lang === "th" ? "บทความล่าสุดที่คนค้นก่อนซื้อหุ้นจริง" : "Latest Pre-Buy Stock Research Guides"}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted font-semibold leading-relaxed">
              {lang === "th"
                ? "อัปเดตบทความหุ้นรายตัว หุ้นปันผล ETF และคู่มือประเมินมูลค่า เรียงจากบทความใหม่ล่าสุดก่อน"
                : "Fresh single-stock, dividend, ETF and valuation guides, ordered by the newest research first."}
            </p>
          </div>
          <Link href="/blog">
            <Button variant="outline" className="flex items-center gap-2 font-bold hover:scale-[1.02] active:scale-95 transition text-xs sm:text-sm">
              {lang === "th" ? "ดูบทความลงทุนทั้งหมด" : "Explore All Guides"} 
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {articlesList.map((art, idx) => {
            const articleHref = art.href || (art.id === "dcf-for-beginners" ? "/insights/dcf-calculator-stock-valuation" : `/insights?article=${art.id}`);
            const imageSrc = `/article-image/${encodeURIComponent(art.id)}?category=${encodeURIComponent(art.category)}&symbol=${encodeURIComponent(art.tag)}&v=5`;
            return (
              <article 
                key={art.id} 
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/60 bg-surface/70 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-lg"
              >
                <Link href={articleHref} className="flex aspect-[1200/630] items-center justify-center overflow-hidden border-b border-line/50 bg-bg/55">
                  <Image
                    src={imageSrc}
                    alt={lang === "th" ? `ภาพประกอบบทความ ${art.title}` : `${art.title} article cover`}
                    width={1200}
                    height={630}
                    priority={idx < 2}
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                </Link>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`chip border px-2 py-0.5 rounded-lg text-[10px] font-bold leading-none ${art.gradient}`}>
                      {art.category}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted font-mono font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {art.readTime}
                      </span>
                      {art.href?.startsWith("/blog/") ? (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {lang === "th"
                            ? `${formatArticleViews(articleViews[art.id] || 0, lang)} อ่าน`
                            : `${formatArticleViews(articleViews[art.id] || 0, lang)} reads`}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h3 className="font-display text-sm sm:text-base font-bold text-ink leading-snug group-hover:text-brand transition duration-200">
                    <Link href={articleHref}>
                      {art.title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 font-medium [overflow-wrap:anywhere]">
                    {art.summary}
                  </p>
                </div>

                <div className="mx-5 mb-5 flex items-center justify-between border-t border-line/45 pt-4 sm:mx-6 sm:mb-6">
                  <span className="text-[10px] text-muted font-bold tracking-wider font-mono">
                    📅 {art.date}
                  </span>
                  <Link href={articleHref} className="text-xs text-brand font-extrabold flex items-center gap-1 hover:underline">
                    {lang === "th" ? "อ่านต่อบทความ" : "Read Full"} 
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-200" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 📚 6. INVESTMENT GUIDES (Topic Clusters) */}
      <section className={borderedSectionClass}>
        <div className={centeredHeaderClass}>
          <span className={`${eyebrowClass} border-brand/35 bg-brand/10 text-brand`}>
            <Star className="h-3.5 w-3.5" /> Structured Learning moats
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "คู่มือคอร์สวิเคราะห์หุ้นตามลำดับระดับ" : "Value Investing Educational Syllabus"}
          </h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
            {lang === "th" ? "Topic Clusters ช่วยปูพื้นฐานแนวคิด VI จากศูนย์จนถึงระดับแอดวานซ์อย่างเป็นระบบ" : "Topic cluster guides designed to build core compounding intelligence."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {investmentGuides.map((guide, idx) => (
            <Card key={idx} className="border border-line p-5.5 bg-surface/20 flex flex-col justify-between space-y-4 text-center">
              <div>
                <span className={`chip mx-auto justify-center border text-[10px] font-bold uppercase tracking-wider ${guide.badgeColor}`}>
                  {guide.level} Syllabus
                </span>
                
                <div className="mt-4 space-y-4">
                  {guide.topics.map((t, tIdx) => (
                    <div key={tIdx} className="group rounded-xl border border-line/45 bg-bg/35 p-3 text-center transition hover:border-brand/35 hover:bg-brand/5">
                      <span className="mx-auto mb-2 grid h-6 w-6 place-items-center rounded-full bg-brand/10 font-mono text-[10px] font-black text-brand">
                        {String(tIdx + 1).padStart(2, "0")}
                      </span>
                      <Link href={t.link} className="font-display text-xs sm:text-sm font-bold text-ink hover:text-brand transition block leading-snug">
                        {t.title}
                      </Link>
                      <p className="mx-auto mt-1.5 max-w-[240px] text-[11px] text-muted leading-relaxed font-medium [overflow-wrap:anywhere]">
                        {t.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ❓ 7. FAQ SECTION */}
      <section className={`${compactSectionClass} animate-fade-up`}>
        <div className={centeredHeaderClass}>
          <span
            className={`${eyebrowClass} border-amber-500/30 bg-amber-500/10 text-amber-400`}
          >
            <Info className="h-3.5 w-3.5" />{" "}
            {lang === "th" ? "FAQ พร้อมสำหรับดัชนีค้นหา" : "Search Engine Indexable FAQ"}
          </span>
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "คำถามที่พบบ่อย (FAQs)" : "Frequently Asked Questions"}
          </h2>
        </div>

        <div className="space-y-2.5">
          {homeFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-bg/40 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-ink hover:bg-elevate/45 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-brand text-xs font-bold font-mono pl-3 shrink-0">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4.5 pt-1.5 border-t border-line/25 text-xs text-muted leading-relaxed font-medium [overflow-wrap:anywhere]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* USER REVIEWS */}
      <section className={borderedSectionClass}>
        <div className={splitHeaderClass}>
          <div className="max-w-2xl">
            <span className={`${eyebrowClass} border-gold/30 bg-gold/10 text-gold`}>
              <Star className="h-3.5 w-3.5 fill-current" />
              {lang === "th" ? "รีวิวจากผู้ใช้งานจริง" : "Verified user reviews"}
            </span>
            <h2 className={sectionTitleClass}>
              {lang === "th" ? "นักลงทุนใช้ ValuStock ประเมินมูลค่าหุ้นอย่างไร" : "How investors use ValuStock for stock valuation"}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
              {lang === "th"
                ? "รวมประสบการณ์จากสมาชิกที่ใช้ ValuStock วิเคราะห์หุ้น DCF, Fair Value, Margin of Safety และจัดการ Watchlist"
                : "Member experiences from using ValuStock for DCF, fair value, margin of safety and watchlist workflows."}
            </p>
          </div>
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface/45 px-4 py-3 text-left sm:text-right">
              <div className="flex items-center gap-1 text-gold sm:justify-end">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${index < Math.round(reviewAverage) ? "fill-current" : "opacity-25"}`} />
                ))}
              </div>
              <div className="mt-1 text-xs font-bold text-ink">
                {reviewAverage.toFixed(1)} / 5.0
              </div>
              <div className="text-[10px] font-semibold text-muted">
                {lang === "th" ? `${reviews.length} รีวิวจากสมาชิก` : `${reviews.length} member reviews`}
              </div>
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-wrap justify-end gap-2">
          <Link href="/member-reviews">
            <Button variant="outline" size="sm">
              {lang === "th" ? "ดูรีวิวทั้งหมด" : "View All Reviews"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.length === 0 ? (
              <div className="surface rounded-2xl border border-line p-6 text-center text-xs font-semibold text-muted md:col-span-3">
                {lang === "th" ? "ยังไม่มีรีวิวจากสมาชิก" : "No member reviews yet."}
              </div>
            ) : (
              reviews.slice(0, 6).map((review) => (
                <article key={review.id} className="surface flex min-h-[220px] flex-col justify-between rounded-2xl border border-line p-5">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-sm font-bold text-ink">
                          {review.title || (lang === "th" ? "รีวิว ValuStock" : "ValuStock review")}
                        </h3>
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-muted">
                          {review.name} · {review.emailMask}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 text-gold">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "opacity-25"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-5 text-xs font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
                      {review.content}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-line/50 pt-3 text-[10px] font-bold text-muted">
                    {new Date(review.approvedAt || review.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="surface rounded-2xl border border-line p-5">
            <h3 className="font-display text-base font-bold text-ink">
              {lang === "th" ? "เขียนรีวิวของคุณ" : "Write your review"}
            </h3>
            <p className="mt-1 text-xs font-medium leading-relaxed text-muted">
              {lang === "th"
                ? "สมาชิก 1 คนเขียนได้ 1 รีวิว หากแก้ไข ระบบจะส่งกลับไปรอแอดมินอนุมัติอีกครั้ง"
                : "Each member can have one review. Editing it sends it back for admin approval."}
            </p>

            {!ready ? (
              <div className="mt-5 text-xs font-bold text-muted animate-pulse">{t("common.loading")}</div>
            ) : !user ? (
              <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4 text-xs font-bold text-gold">
                {lang === "th" ? "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว" : "Please sign in before writing a review."}
                <Link href="/login" className="mt-3 inline-flex text-brand hover:underline">
                  {lang === "th" ? "ไปหน้าเข้าสู่ระบบ" : "Go to login"}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                {reviewStatusText && (
                  <div className={`rounded-xl border p-3 text-xs font-bold ${
                    myReview?.status === "approved"
                      ? "border-up/30 bg-up/10 text-up"
                      : myReview?.status === "rejected"
                      ? "border-down/30 bg-down/10 text-down"
                      : "border-gold/30 bg-gold/10 text-gold"
                  }`}>
                    {reviewStatusText}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    {lang === "th" ? "คะแนน" : "Rating"}
                  </label>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const nextRating = index + 1;
                      return (
                        <button
                          key={nextRating}
                          type="button"
                          onClick={() => setReviewForm((current) => ({ ...current, rating: nextRating }))}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-bg text-gold transition hover:border-gold/40"
                          title={`${nextRating}/5`}
                        >
                          <Star className={`h-4 w-4 ${nextRating <= reviewForm.rating ? "fill-current" : "opacity-25"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    {lang === "th" ? "หัวข้อรีวิว" : "Review title"}
                  </label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((current) => ({ ...current, title: e.target.value }))}
                    maxLength={160}
                    className="input-base text-sm"
                    placeholder={lang === "th" ? "ช่วยประเมินมูลค่าหุ้นได้เร็วขึ้น" : "Helps me value stocks faster"}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    {lang === "th" ? "รีวิว" : "Review"}
                  </label>
                  <textarea
                    required
                    minLength={20}
                    maxLength={1200}
                    rows={5}
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm((current) => ({ ...current, content: e.target.value }))}
                    className="input-base resize-none text-sm"
                    placeholder={lang === "th" ? "เล่าว่า ValuStock ช่วยการวิเคราะห์หุ้นของคุณอย่างไร..." : "Share how ValuStock helps your stock analysis..."}
                  />
                </div>

                {reviewError && <div className="text-xs font-bold text-down">{reviewError}</div>}
                {reviewMessage && <div className="text-xs font-bold text-up">{reviewMessage}</div>}

                <Button type="submit" className="w-full font-bold" disabled={reviewSaving}>
                  {reviewSaving
                    ? lang === "th" ? "กำลังบันทึก..." : "Saving..."
                    : myReview ? lang === "th" ? "แก้ไขและส่งตรวจอีกครั้ง" : "Update and resubmit"
                    : lang === "th" ? "ส่งรีวิว" : "Submit Review"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ✉️ 8. NEWSLETTER SECTION */}
      <section className={compactSectionClass}>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 text-center md:p-12">
          <div className="aurora absolute inset-0 -z-10 opacity-70" />
          
          <h2 className={sectionTitleClass}>
            {lang === "th" ? "เกาะติดรายงานวิเคราะห์หุ้นเจาะลึกฟรี" : "Subscribe to Premium Value Reports"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted font-medium leading-relaxed [overflow-wrap:anywhere]">
            {lang === "th"
              ? "รับบทความวิเคราะห์กลยุทธ์ W-8BEN, Feeder Fund และหุ้น undervalue ดาวรุ่งส่งตรงถึงอีเมลคุณทุกสัปดาห์ ไม่มีโฆษณาคั่น"
              : "Weekly institutional metrics, cross-border tax advice, and underpriced asset notifications sent straight to your inbox."}
          </p>

          {!subscribed ? (
            <>
              <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row max-w-md mx-auto gap-2">
                <input
                  type="email"
                  required
                  placeholder={lang === "th" ? "กรอกอีเมลของคุณ..." : "Enter your email address..."}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-line bg-bg px-4 py-2 text-xs text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none font-bold"
                />
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={newsletterWebsite}
                  onChange={(e) => setNewsletterWebsite(e.target.value)}
                  className="absolute -left-[9999px] h-px w-px opacity-0"
                  aria-hidden="true"
                />
                <Button type="submit" size="sm" className="font-bold shrink-0">
                  {subscribing
                    ? (lang === "th" ? "กำลังบันทึก..." : "Saving...")
                    : (lang === "th" ? "สมัครรับข้อมูล" : "Subscribe Now")}
                </Button>
              </form>
              {subscribeError && (
                <div className="mt-3 text-xs font-bold text-down">
                  {subscribeError}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 border border-up/30 bg-up/10 rounded-2xl max-w-md mx-auto animate-fade-up text-xs text-up font-bold">
              🎉 {lang === "th" ? "สำเร็จ! เราได้ส่งรายงานต้อนรับพอร์ตคุณค่าไปยังอีเมลของคุณเรียบร้อย" : "Success! Welcome package and value checklist sent to your inbox."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function ValuationGapChart({
  rows,
  marketRows,
  meta,
  lang,
  activeTab,
  onTabChange,
}: {
  rows: ValuationOpportunity[];
  marketRows: Stock[];
  meta: MarketUniversePayload | null;
  lang: "th" | "en";
  activeTab: SnapshotTab;
  onTabChange: (tab: SnapshotTab) => void;
}) {
  type SnapshotRow = {
    symbol: string;
    name: string;
    market: string;
    tab: SnapshotTab;
    color: string;
    price: number;
    fairValue: number;
    marginOfSafety: number;
    changePct: number;
    dividendYield: number;
    priceHistory: number[];
    currency?: "THB" | "USD";
    href: string;
    rankScore: number;
  };

  const opportunityBySymbol = useMemo(() => {
    const map = new Map<string, ValuationOpportunity>();
    rows.forEach((row) => map.set(row.symbol.toUpperCase(), row));
    return map;
  }, [rows]);

  const snapshotRows = useMemo<SnapshotRow[]>(() => {
    const fromUniverse = marketRows
      .filter((stock) => stock.price > 0)
      .map((stock) => {
        const symbol = stock.symbol.toUpperCase();
        const paired = opportunityBySymbol.get(symbol);
        const changePct = stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : paired?.changePct || 0;
        const isValuableStock = stock.assetType === "TH_STOCK" || stock.assetType === "US_STOCK";
        const valuation = isValuableStock
          ? (() => {
              try {
                return computeValuation(stock, defaultDCFParams(stock));
              } catch {
                return null;
              }
            })()
          : null;
        const fairValue =
          paired?.fairValue && paired.fairValue > 0
            ? paired.fairValue
            : valuation?.fairValue && Number.isFinite(valuation.fairValue) && valuation.fairValue > 0
              ? valuation.fairValue
              : stock.price;
        const marginOfSafety =
          paired?.marginOfSafety !== undefined && Number.isFinite(paired.marginOfSafety)
            ? paired.marginOfSafety
            : valuation?.marginOfSafety !== undefined && Number.isFinite(valuation.marginOfSafety)
              ? valuation.marginOfSafety
              : 0;
        const dividendYield = paired?.dividendYield ?? (stock.price > 0 ? (stock.financials.dividendPerShare / stock.price) * 100 : 0);
        const tab: SnapshotTab =
          stock.assetType === "TH_STOCK"
            ? "thai"
            : stock.assetType === "US_STOCK"
              ? "us"
              : stock.assetType === "FUND" || stock.assetType === "US_FUND" || stock.assetType === "ETF"
                ? "fund"
                : "alternative";

        return {
          symbol,
          name: lang === "th" ? stock.name : stock.enName || stock.name,
          market: stock.assetType === "INDEX" ? "INDEX" : stock.market,
          tab,
          color: stock.color,
          price: stock.price,
          fairValue,
          marginOfSafety,
          changePct,
          dividendYield,
          priceHistory: stock.priceHistory?.length ? stock.priceHistory : paired?.priceHistory || [stock.price],
          currency: stock.currency,
          href: `/stocks/${encodeURIComponent(symbol)}`,
          rankScore: Math.abs(changePct) * 0.8 + Math.max(marginOfSafety, 0) * 0.7 + (stock.assetType === "INDEX" ? 18 : 0),
        };
      });

    const fallback = rows.map<SnapshotRow>((row) => ({
      symbol: row.symbol,
      name: lang === "th" ? row.name : row.enName || row.name,
      market: row.category === "thai" ? "SET" : row.category === "us" ? "US" : row.category === "etf" ? "ETF" : "ALT",
      tab: row.category === "thai" ? "thai" : row.category === "us" ? "us" : row.category === "etf" ? "fund" : "alternative",
      color: row.color,
      price: row.price,
      fairValue: row.fairValue,
      marginOfSafety: row.marginOfSafety,
      changePct: row.changePct,
      dividendYield: row.dividendYield,
      priceHistory: row.priceHistory,
      currency: row.currency,
      href: row.href,
      rankScore: Math.abs(row.changePct) * 0.8 + Math.max(row.marginOfSafety, 0),
    }));

    const base = fromUniverse.length ? fromUniverse : fallback;
    const priority = ["SPX", "DJI", "IXIC", "BTC", "GOLD", "AAPL", "NVDA", "PTT", "KBANK"];
    return [...base].sort((a, b) => {
      if (activeTab === "overview") {
        const pa = priority.indexOf(a.symbol);
        const pb = priority.indexOf(b.symbol);
        if (pa !== pb) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      }
      return b.rankScore - a.rankScore;
    });
  }, [activeTab, lang, marketRows, opportunityBySymbol, rows]);

  const tabCounts = useMemo(() => {
    return snapshotRows.reduce(
      (acc, row) => {
        acc.overview += 1;
        acc[row.tab] += 1;
        return acc;
      },
      { overview: 0, thai: 0, us: 0, fund: 0, alternative: 0 } satisfies Record<SnapshotTab, number>
    );
  }, [snapshotRows]);

  const tabs: Array<{ id: SnapshotTab; labelTh: string; labelEn: string }> = [
    { id: "overview", labelTh: "ภาพรวม", labelEn: "Overview" },
    { id: "thai", labelTh: "หุ้นไทย", labelEn: "Thai" },
    { id: "us", labelTh: "หุ้นสหรัฐ", labelEn: "US" },
    { id: "fund", labelTh: "ETF/กองทุน", labelEn: "ETF/Funds" },
    { id: "alternative", labelTh: "Crypto/ทอง/ดัชนี", labelEn: "Crypto/Gold/Index" },
  ];

  const visibleRows = snapshotRows.filter((row) => activeTab === "overview" || row.tab === activeTab).slice(0, 6);
  const positiveCount = visibleRows.filter((row) => row.changePct >= 0).length;
  const avgChange = visibleRows.length ? visibleRows.reduce((sum, row) => sum + row.changePct, 0) / visibleRows.length : 0;
  const avgMos = visibleRows.length ? visibleRows.reduce((sum, row) => sum + row.marginOfSafety, 0) / visibleRows.length : 0;
  const updatedLabel = meta?.updatedAt
    ? new Date(meta.updatedAt).toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" })
    : "-";

  return (
    <div className="surface min-w-0 rounded-2xl border border-line bg-surface/45 p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 border-b border-line/50 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold text-ink">
              {lang === "th" ? "Global Asset Snapshot" : "Global Asset Snapshot"}
            </h3>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-muted">
              {lang === "th"
                ? "ข้อมูลหลายตลาดจัดเป็นแถวสั้น อ่านเร็ว และดูแนวโน้มได้ทันที"
                : "Multi-market coverage in compact rows with quick trend and valuation signals."}
            </p>
          </div>
          <div className="rounded-full border border-line bg-bg px-3 py-1 text-[10px] font-black uppercase tracking-wide text-muted">
            {lang === "th" ? "อัปเดต" : "Updated"} {updatedLabel}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            { label: lang === "th" ? "สินทรัพย์ในระบบ" : "Assets", value: `${tabCounts.overview}` },
            { label: lang === "th" ? "ตลาดบวก" : "Positive", value: `${positiveCount}/${visibleRows.length || 0}`, tone: "text-up" },
            { label: lang === "th" ? "เฉลี่ยวันนี้" : "Avg change", value: pct(avgChange, 1), tone: avgChange >= 0 ? "text-up" : "text-down" },
            { label: lang === "th" ? "Avg MOS" : "Avg MOS", value: pct(avgMos, 0), tone: avgMos >= 0 ? "text-up" : "text-down" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-line/55 bg-bg/55 px-3 py-2">
              <div className={`text-sm font-black ${item.tone || "text-ink"}`}>{item.value}</div>
              <div className="mt-0.5 text-[10px] font-bold text-muted">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-9 rounded-xl border px-2 py-2 text-[10px] font-black leading-tight transition ${
                activeTab === tab.id
                  ? "border-brand bg-brand text-bg shadow-[0_8px_20px_-12px_rgb(var(--brand))]"
                  : "border-line bg-bg text-muted hover:border-brand/35 hover:text-ink"
              }`}
            >
              <span className="block truncate">{lang === "th" ? tab.labelTh : tab.labelEn}</span>
              <span className="mt-0.5 block font-mono text-[9px] opacity-70">{tabCounts[tab.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line/55">
        {visibleRows.map((row) => {
          const formatMoney = row.currency === "USD" ? dollar : baht;
          const up = row.changePct >= 0;
          const undervalued = row.marginOfSafety >= 15;

          return (
            <Link
              key={row.symbol}
              href={row.href}
              className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-line/45 bg-bg/55 p-3 transition last:border-b-0 hover:border-brand/45 hover:bg-elevate/45 sm:grid-cols-[minmax(190px,1fr)_92px_96px_86px]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <AssetLogo symbol={row.symbol} color={row.color} size="sm" />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-mono text-sm font-black text-ink group-hover:text-brand">{row.symbol}</span>
                    <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[8px] font-black text-muted">
                      {row.market}
                    </span>
                  </div>
                  <div className="truncate text-[10px] font-semibold text-muted">{row.name}</div>
                </div>
              </div>

              <div className="text-right sm:text-left">
                <div className="text-[9px] font-black uppercase tracking-wide text-muted">{lang === "th" ? "ราคา" : "Price"}</div>
                <div className="font-mono text-xs font-black text-ink">{formatMoney(row.price)}</div>
                <div className={`text-[10px] font-black ${up ? "text-up" : "text-down"}`}>{pct(row.changePct, 1)}</div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:block">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wide text-muted">{lang === "th" ? "มูลค่า" : "Fair"}</div>
                  <div className="font-mono text-xs font-black text-gold">{formatMoney(row.fairValue)}</div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-[9px] font-black uppercase tracking-wide text-muted">MOS</div>
                  <div className={`font-mono text-xs font-black ${undervalued ? "text-up" : row.marginOfSafety < 0 ? "text-down" : "text-muted"}`}>
                    {pct(row.marginOfSafety, 0)}
                  </div>
                </div>
              </div>

              <div className="col-span-2 h-9 rounded-lg border border-line/50 bg-surface/50 px-1.5 py-1 sm:col-span-1">
                <Sparkline data={row.priceHistory?.length ? row.priceHistory.slice(-30) : [row.price]} up={up} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted">
        <span>
          {lang === "th"
            ? `ครอบคลุม TH ${meta?.counts?.thai || tabCounts.thai}, NYSE ${meta?.counts?.nyse || 0}, Nasdaq ${meta?.counts?.nasdaq || 0}, Crypto ${meta?.counts?.crypto || 0}, Gold/Futures ${meta?.counts?.futures || 0}`
            : `Coverage TH ${meta?.counts?.thai || tabCounts.thai}, NYSE ${meta?.counts?.nyse || 0}, Nasdaq ${meta?.counts?.nasdaq || 0}, Crypto ${meta?.counts?.crypto || 0}, Gold/Futures ${meta?.counts?.futures || 0}`}
        </span>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-brand hover:text-ink">
          {lang === "th" ? "เปิด Dashboard" : "Open Dashboard"} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
  up,
}: {
  label: string;
  value: string;
  accent?: boolean;
  up?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-bg px-3 py-2.5 text-center">
      <div className="text-[10px] font-medium leading-snug text-muted [overflow-wrap:anywhere] sm:text-[11px]">{label}</div>
      <div
        className={`num mt-0.5 font-bold text-xs [overflow-wrap:anywhere] ${
          accent ? "text-gold" : up === false ? "text-down" : up ? "text-up" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
