"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { STOCKS, SECTORS } from "@/lib/stocks";
import { AssetType, Stock } from "@/lib/types";
import { assetAllowed } from "@/lib/plan-access";
import { computeValuation, defaultDCFParams } from "@/lib/valuation";
import { useCurrentPlan } from "@/lib/store";
import { AssetLogo } from "@/components/AssetLogo";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { LockedCard } from "@/components/Paywall";
import { useTranslation, SECTOR_TRANS } from "@/lib/translations";
import { baht, num, pct, dollar, nav } from "@/lib/format";
import { QuoteLoadingCard } from "@/components/QuoteLoading";
import { hasQuoteProvider, useLiveQuotes } from "@/lib/realtime-quotes";
import {
  Search,
  Filter,
  Lock,
  Sparkles,
  Target,
  CircleDollarSign,
  TrendingUp,
  Layers,
  ChevronRight,
  Calculator,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Crown,
  RefreshCw,
  Info,
  CheckCircle,
  Shield,
  Database,
  Download,
} from "@/lib/icons";

type SortKey = "mos" | "pe" | "growth" | "yield" | "symbol";
type TabType = "valuation" | "performance" | "dividends" | "funds";
type MetricTone = "up" | "down" | "gold" | "muted" | "brand";

type MarketMover = {
  symbol: string;
  price: number;
  changePct: number;
  source: string;
  isDelayed: boolean;
  delayMinutes: number;
  fetchedAt: string;
};

type MarketMoversPayload = {
  gainers: MarketMover[];
  losers: MarketMover[];
  volatile: MarketMover[];
  updatedAt: string | null;
};

type MarketUniversePayload = {
  stocks: Stock[];
  counts?: {
    thai: number;
    nyse: number;
    nasdaq: number;
    indices: number;
    funds?: number;
    usFunds?: number;
    crypto?: number;
    futures?: number;
  };
  updatedAt?: string;
  source?: string;
};

type StocksClientProps = {
  initialMarketUniverse?: MarketUniversePayload | null;
};

export default function StocksPage({ initialMarketUniverse = null }: StocksClientProps) {
  const plan = useCurrentPlan();
  const { t, lang } = useTranslation();

  // Screener Core State
  const [viewMode, setViewMode] = useState<"beginner" | "pro">("pro");
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<string>("ALL");
  const [selectedVerdict, setSelectedVerdict] = useState<string>("ALL");
  const [minMos, setMinMos] = useState<number>(-50);
  const [maxPe, setMaxPe] = useState<number>(100);
  const [minYield, setMinYield] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("mos");
  const [activeTab, setActiveTab] = useState<TabType>("valuation");
  const [beginnerShowAll, setBeginnerShowAll] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive DCF Sandbox Simulator State
  const [sandboxSymbol, setSandboxSymbol] = useState<string>("PTT");
  const [sandboxGrowth, setSandboxGrowth] = useState<number>(0.04);
  const [sandboxDiscount, setSandboxDiscount] = useState<number>(0.09);
  const [sandboxTerminal, setSandboxTerminal] = useState<number>(0.025);
  const [isCustomSandbox, setIsCustomSandbox] = useState<boolean>(false);

  // Dynamic Lookup State
  const [marketUniverse, setMarketUniverse] = useState<Stock[]>(() => initialMarketUniverse?.stocks || []);
  const [marketUniverseMeta, setMarketUniverseMeta] = useState<MarketUniversePayload | null>(initialMarketUniverse);
  const [isUniverseLoading, setIsUniverseLoading] = useState(!initialMarketUniverse?.stocks?.length);
  const [universeError, setUniverseError] = useState<string | null>(null);
  const refreshSymbols = useMemo(
    () => marketUniverse.filter(hasQuoteProvider).map((stock) => stock.symbol),
    [marketUniverse]
  );
  const { liveStocks: dynamicStocks, setLiveStocks: setDynamicStocks } = useLiveQuotes(refreshSymbols);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);
  const [marketMovers, setMarketMovers] = useState<MarketMoversPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadUniverse = () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8_000);
      setIsUniverseLoading(true);
      fetch("/api/stocks/universe?limit=90", { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error("Market universe data server unavailable");
          return res.json();
        })
        .then((payload: MarketUniversePayload) => {
          if (cancelled) return;
          setMarketUniverse(payload.stocks || []);
          setMarketUniverseMeta(payload);
          setUniverseError(null);
          if ((payload.stocks || []).length > 0) {
            const current = payload.stocks!.find((stock) => stock.symbol === sandboxSymbol) || payload.stocks![0];
            setSandboxSymbol(current.symbol);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setUniverseError(err instanceof Error ? err.message : "Market universe data server unavailable");
          setMarketUniverse(
            STOCKS.filter((stock) => stock.assetType !== "INDEX")
          );
        })
        .finally(() => {
          window.clearTimeout(timeout);
          if (!cancelled) setIsUniverseLoading(false);
        });
    };

    loadUniverse();
    const interval = window.setInterval(loadUniverse, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!marketUniverse.length) return;
    const exists = marketUniverse.some((stock) => stock.symbol === sandboxSymbol);
    if (!exists) {
      const firstStock = marketUniverse.find((stock) => stock.assetType !== "INDEX") || marketUniverse[0];
      setSandboxSymbol(firstStock.symbol);
      setSandboxGrowth(firstStock.financials.growthRate);
      setIsCustomSandbox(false);
    }
  }, [marketUniverse, sandboxSymbol]);

  useEffect(() => {
    fetch("/api/market/movers?limit=5")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload) setMarketMovers(payload);
      })
      .catch(() => {
        /* Market movers are an enhancement; screener data remains primary. */
      });
  }, []);

  const canScreen = plan.limits.screener;
  const maxStocks = plan.limits.maxStocks;
  const isAssetVisible = (assetType: AssetType | undefined) => assetAllowed(plan, assetType);

  // Merge provider universe and dynamic quote updates with stable symbol keys.
  const allStocks = useMemo(() => {
    const bySymbol = new Map<string, Stock>();
    marketUniverse.forEach((stock) => bySymbol.set(stock.symbol.toUpperCase(), stock));
    dynamicStocks.forEach((stock) => bySymbol.set(stock.symbol.toUpperCase(), stock));
    return Array.from(bySymbol.values());
  }, [dynamicStocks, marketUniverse]);

  const tickerStocks = useMemo(() => {
    const prioritySymbols = [
      "SPX",
      "DJI",
      "IXIC",
      "BTC",
      "GOLD",
      "AAPL",
      "MSFT",
      "NVDA",
    ];
    const preferred = prioritySymbols
      .map((symbol) => allStocks.find((stock) => stock.symbol.toUpperCase() === symbol))
      .filter((stock): stock is Stock => Boolean(stock));
    const rankedByGroup = [
      ...allStocks.filter((stock) => stock.assetType === "TH_STOCK"),
      ...allStocks.filter((stock) => stock.assetType === "US_STOCK" && stock.market === "NYSE"),
      ...allStocks.filter((stock) => stock.assetType === "US_STOCK" && stock.market === "NASDAQ"),
      ...allStocks.filter((stock) => stock.assetType === "FUND" || stock.assetType === "US_FUND"),
      ...allStocks.filter((stock) => stock.assetType === "CRYPTO"),
      ...allStocks.filter((stock) => stock.assetType === "FUTURES"),
      ...allStocks.filter((stock) => stock.assetType === "INDEX"),
    ];
    const seen = new Set<string>();
    return [...preferred, ...rankedByGroup]
      .filter((stock) => isAssetVisible(stock.assetType))
      .filter((stock) => {
        const key = stock.symbol.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 36);
  }, [allStocks, plan.id]);

  // Selected Stock for Sandbox simulation
  const selectedStock = useMemo(() => {
    return allStocks.find((s) => s.symbol === sandboxSymbol) || allStocks.find((s) => s.assetType !== "INDEX") || allStocks[0] || STOCKS[0];
  }, [sandboxSymbol, allStocks]);

  // Handle Loading a stock into the sandbox
  const handleSelectStockForSandbox = (symbol: string) => {
    const s = allStocks.find((item) => item.symbol === symbol);
    if (s) {
      setSandboxSymbol(symbol);
      setSandboxGrowth(s.financials.growthRate);
      setSandboxDiscount(0.09);
      setSandboxTerminal(0.025);
      setIsCustomSandbox(false);
    }
  };

  const handleDeepSearch = async () => {
    const sym = q.trim().toUpperCase();
    if (!sym) return;
    setIsSearchingApi(true);
    setApiSearchError(null);
    try {
      const res = await fetch(`/api/stock/${sym}`);
      if (!res.ok) {
        throw new Error(lang === "th" ? `ไม่พบข้อมูลของสัญลักษณ์ "${sym}" หรืออยู่นอกขอบเขตบริการ` : `Could not fetch ticker details for "${sym}".`);
      }
      const data = await res.json();
      if (data && data.symbol) {
        setDynamicStocks(prev => {
          if (prev.some(s => s.symbol === data.symbol)) return prev;
          return [...prev, data];
        });
        setQ(data.symbol); // Set active search query to the symbol so it remains selected and filtered
        handleSelectStockForSandbox(data.symbol);
      } else {
        throw new Error(lang === "th" ? "รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง" : "Invalid ticker dataset.");
      }
    } catch (err: any) {
      setApiSearchError(err.message || "Deep Lookup Error");
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Automatic Background Ticker Fetch Debouncer Fallback
  useEffect(() => {
    const query = q.trim().toUpperCase();
    // Match realistic ticker or fund symbol patterns (2-15 characters, letters, numbers, hyphens)
    if (query.length < 2 || query.length > 15 || !/^[A-Z0-9-]+$/.test(query)) return;

    // Static US rows are seed data, so let an exact ticker query refresh them.
    const exactStatic = STOCKS.find((s) => s.symbol.toUpperCase() === query);
    const alreadyDynamic = dynamicStocks.some((s) => s.symbol.toUpperCase() === query);
    const alreadyExists = allStocks.some(s => s.symbol.toUpperCase() === query);
    const shouldRefreshStaticUs =
      !!exactStatic &&
      !alreadyDynamic &&
      (exactStatic.assetType === "US_STOCK" || exactStatic.currency === "USD");
    if (alreadyExists && !shouldRefreshStaticUs) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.symbol && data.symbol === query) {
            setDynamicStocks(prev => {
              if (prev.some(s => s.symbol === data.symbol)) return prev;
              return [...prev, data];
            });
            handleSelectStockForSandbox(data.symbol);
          }
        }
      } catch (err) {
        console.error("Dynamic background ticker pull error:", err);
      }
    }, 500); // 500ms debounce buffer to prevent overwhelming the servers

    return () => clearTimeout(timer);
  }, [q, allStocks, dynamicStocks]);

  // Simulated valuation computation
  const simulatedValuation = useMemo(() => {
    if (!selectedStock) return null;
    const params = {
      growthRate: isCustomSandbox ? sandboxGrowth : selectedStock.financials.growthRate,
      discountRate: isCustomSandbox ? sandboxDiscount : 0.09,
      terminalGrowth: isCustomSandbox ? sandboxTerminal : 0.025,
      years: 5,
    };
    return computeValuation(selectedStock, params);
  }, [selectedStock, isCustomSandbox, sandboxGrowth, sandboxDiscount, sandboxTerminal]);

  // Preset screening logic
  const applyPreset = (preset: "buffett" | "dividend" | "growth" | "reset") => {
    if (!canScreen) return;
    if (preset === "reset") {
      setMinMos(-50);
      setMaxPe(100);
      setMinYield(0);
      setSelectedAssetType("ALL");
      setSelectedVerdict("ALL");
      setSector(null);
      setQ("");
      return;
    }
    if (preset === "buffett") {
      setMinMos(15);
      setMaxPe(15);
      setMinYield(1.0);
      setSelectedAssetType("ALL");
      setSelectedVerdict("ALL");
      setSector(null);
    } else if (preset === "dividend") {
      setMinMos(5);
      setMaxPe(12);
      setMinYield(4.5);
      setSelectedAssetType("TH_STOCK");
      setSelectedVerdict("ALL");
      setSector(null);
    } else if (preset === "growth") {
      setMinMos(0);
      setMaxPe(30);
      setMinYield(0);
      setSelectedAssetType("US_STOCK");
      setSelectedVerdict("ALL");
      setSector(null);
    }
  };

  // Compute Live Market Indicators for Sector Chip Metrics
  const sectorStats = useMemo(() => {
    return SECTORS.map((sec) => {
      const matching = allStocks.filter((s) => s.sector === sec);
      const vals = matching
        .map((s) => computeValuation(s, defaultDCFParams(s)).marginOfSafety)
        .filter((mos) => Number.isFinite(mos));
      const avgMos =
        vals.length > 0 ? vals.reduce((sum, mos) => sum + mos, 0) / vals.length : 0;
      return {
        name: sec,
        count: matching.length,
        avgMos,
      };
    });
  }, [allStocks]);

  // Top 4 High-Density KPI Cards
  const kpis = useMemo(() => {
    const planStocks = allStocks.filter((s) => isAssetVisible(s.assetType));
    const totalCovered = planStocks.length;
    const allValuations = planStocks.map((s) => ({
      s,
      v: computeValuation(s, defaultDCFParams(s)),
    }));

    // Bargains: Under-valued (MOS >= 15%)
    const bargains = allValuations.filter((row) => row.v.marginOfSafety >= 15);
    const bargainRate = (bargains.length / totalCovered) * 100;

    // Average Dividend Yield for Equities
    const equities = planStocks.filter((s) => s.assetType === "TH_STOCK" || s.assetType === "US_STOCK");
    const avgYield =
      equities.reduce((sum, s) => {
        const v = computeValuation(s, defaultDCFParams(s));
        return sum + v.ratios.dividendYield;
      }, 0) / equities.length;

    // Top Star - Stock with absolute highest Margin of Safety
    const sortedMos = [...allValuations].sort((a, b) => b.v.marginOfSafety - a.v.marginOfSafety);
    const topStar = sortedMos[0];

    return {
      totalCovered,
      bargainCount: bargains.length,
      bargainRate,
      avgYield,
      topStar,
    };
  }, [allStocks, plan.id]);

  // Process rows based on filters, search query, sliders
  const processedRows = useMemo(() => {
    let list = allStocks
      .filter((s) => isAssetVisible(s.assetType))
      .map((s) => ({
      s,
      v: computeValuation(s, defaultDCFParams(s)),
    }));

    // Filter by Search Input
    if (q.trim()) {
      const qStr = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.s.symbol.toLowerCase().includes(qStr) ||
          r.s.name.toLowerCase().includes(qStr) ||
          r.s.enName.toLowerCase().includes(qStr)
      );
    }

    // Filter by Sector
    if (sector) {
      list = list.filter((r) => r.s.sector === sector);
    }

    // Filter by market / asset segment
    if (selectedAssetType !== "ALL") {
      if (selectedAssetType === "NYSE" || selectedAssetType === "NASDAQ") {
        list = list.filter((r) => r.s.assetType === "US_STOCK" && r.s.market === selectedAssetType);
      } else {
        list = list.filter((r) => r.s.assetType === selectedAssetType);
      }
    }

    // Filter by Verdict
    if (selectedVerdict !== "ALL") {
      list = list.filter((r) => r.v.verdict.toLowerCase() === selectedVerdict.toLowerCase());
    }

    // Apply Premium / Pro Sliders Filters
    if (canScreen) {
      if (minMos > -50) {
        list = list.filter((r) => r.v.marginOfSafety >= minMos);
      }
      if (maxPe < 100) {
        list = list.filter((r) => isFinite(r.v.ratios.pe) && r.v.ratios.pe <= maxPe);
      }
      if (minYield > 0) {
        list = list.filter((r) => r.v.ratios.dividendYield >= minYield);
      }
    }

    // Sort Rows
    list.sort((a, b) => {
      const exactQuery = q.trim().toUpperCase();
      if (exactQuery) {
        const aExact = a.s.symbol.toUpperCase() === exactQuery;
        const bExact = b.s.symbol.toUpperCase() === exactQuery;
        if (aExact !== bExact) return aExact ? -1 : 1;
      }
      if (sort === "mos") return b.v.marginOfSafety - a.v.marginOfSafety;
      if (sort === "pe") {
        const peA = isFinite(a.v.ratios.pe) ? a.v.ratios.pe : 9999;
        const peB = isFinite(b.v.ratios.pe) ? b.v.ratios.pe : 9999;
        return peA - peB;
      }
      if (sort === "growth") return b.s.financials.growthRate - a.s.financials.growthRate;
      if (sort === "yield") return b.v.ratios.dividendYield - a.v.ratios.dividendYield;
      return a.s.symbol.localeCompare(b.s.symbol);
    });

    return list;
  }, [q, sector, selectedAssetType, selectedVerdict, minMos, maxPe, minYield, sort, canScreen, allStocks, plan.id]);

  // Handle plan indexing limits
  const visibleRows = maxStocks !== "unlimited" ? processedRows.slice(0, maxStocks) : processedRows;
  const beginnerRows = beginnerShowAll ? visibleRows : visibleRows.slice(0, 8);
  const lockedCount = processedRows.length - visibleRows.length;
  const hiddenByAssetPlan = allStocks.filter((s) => !isAssetVisible(s.assetType)).length;
  const nextAssetPlan = plan.id === "free" ? "pro" : plan.id === "pro" ? "premium" : "premium";
  const quoteProviderCount = STOCKS.filter(hasQuoteProvider).length;
  const isInitialQuoteLoading = dynamicStocks.length === 0 && quoteProviderCount > 0 && !q.trim();

  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportScreenerCSV = () => {
    if (!plan.limits.exportData) {
      setShowExportModal(true);
      return;
    }

    if (processedRows.length === 0) {
      alert(lang === "th" ? "ไม่มีข้อมูลเพื่อส่งออก" : "No screened stocks to export.");
      return;
    }

    // Helper to completely strip line breaks (newlines) and graphical emojis/icons
    const cleanCsvCell = (val: any) => {
      if (val === null || val === undefined) return "";
      let str = String(val);
      
      // 1. Remove line breaks to prevent cell breaking/newline wrap in Excel
      str = str.replace(/[\r\n]+/g, " ");

      // 2. Remove emojis, flag graphics, and decorative Unicode symbols
      // - Surrogate pairs (covers modern emojis, flag symbols like 🇹🇭, etc.)
      str = str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");
      // - Basic Multilingual Plane emoji symbols, shapes, dingbats (\u2600-\u27BF)
      str = str.replace(/[\u2600-\u27BF]/g, "");
      // - Private use icons / web font symbols
      str = str.replace(/[\uE000-\uF8FF]/g, "");

      // 3. Trim extra surrounding spaces
      str = str.trim();

      // 4. Double quote wrap with proper quote-escape for CSV compliance
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Generate CSV content representing institutional Flat-Files standards
    const headers = [
      "SYMBOL", 
      "NAME", 
      "SECTOR", 
      "MARKET", 
      "PRICE", 
      "PREV_CLOSE", 
      "FAIR_VALUE", 
      "MOS_PERCENT", 
      "PE", 
      "PB", 
      "DIV_YIELD", 
      "ASSET_TYPE", 
      "CURRENCY"
    ];
    const rows = processedRows.map(({ s, v }) => {
      return [
        cleanCsvCell(s.symbol),
        cleanCsvCell(s.name),
        cleanCsvCell(s.sector),
        cleanCsvCell(s.market),
        s.price,
        s.prevClose,
        v.fairValue,
        v.marginOfSafety.toFixed(2),
        isFinite(v.ratios.pe) ? v.ratios.pe.toFixed(2) : "N/A",
        isFinite(v.ratios.pb) ? v.ratios.pb.toFixed(2) : "N/A",
        v.ratios.dividendYield.toFixed(2),
        cleanCsvCell(s.assetType || "TH_STOCK"),
        cleanCsvCell(s.currency || "THB")
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    // Prepend UTF-8 BOM (\uFEFF) to guarantee Excel correctly detects UTF-8 (preventing garbled Thai characters)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `valustock_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatPrice = (s: any, p: number) => {
    if (s.assetType === "INDEX") return num(p, 2);
    if (s.assetType === "US_STOCK" || s.currency === "USD") return dollar(p);
    if (s.assetType === "FUND") return nav(p);
    return baht(p);
  };

  const formatMoverPrice = (mover: MarketMover) => {
    const stock = allStocks.find((item) => item.symbol.toUpperCase() === mover.symbol.toUpperCase());
    return formatPrice(stock || { currency: "USD", assetType: "US_STOCK" }, mover.price);
  };

  const moverName = (symbol: string) => {
    const stock = allStocks.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock) return symbol;
    return lang === "th" ? stock.name : stock.enName;
  };

  const screenerGuides = [
    {
      title: lang === "th" ? "เริ่มจาก Margin of Safety" : "Start with Margin of Safety",
      desc: lang === "th"
        ? "MOS ช่วยบอกว่าราคาตลาดต่ำกว่ามูลค่าประเมินมากแค่ไหน นักลงทุนระยะยาวมักมองหาหุ้นที่มี MOS อย่างน้อย 15% พร้อมพื้นฐานแข็งแรง"
        : "MOS estimates how far market price sits below fair value. Long-term investors often seek 15% or more with solid fundamentals.",
    },
    {
      title: lang === "th" ? "กรอง P/E คู่กับคุณภาพกำไร" : "Filter P/E with earnings quality",
      desc: lang === "th"
        ? "P/E ต่ำไม่ได้แปลว่าถูกเสมอ ควรดูรายได้ กำไรสุทธิ ROE และกระแสเงินสดร่วมกัน เพื่อหลีกเลี่ยง value trap"
        : "Low P/E is not always cheap. Check revenue, net profit, ROE, and cash flow together to avoid value traps.",
    },
    {
      title: lang === "th" ? "แยกหุ้นปันผลสูงที่ยั่งยืน" : "Separate sustainable dividend stocks",
      desc: lang === "th"
        ? "Dividend Yield สูงควรตรวจ payout ratio, free cash flow และหนี้สิน เพราะปันผลสูงจากราคาหุ้นตกอาจเป็นสัญญาณความเสี่ยง"
        : "High yield needs payout, free cash flow, and leverage checks because a falling share price can make yield look misleading.",
    },
    {
      title: lang === "th" ? "เทียบหุ้นไทย หุ้นอเมริกา และ ETF" : "Compare Thai stocks, US stocks, and ETFs",
      desc: lang === "th"
        ? "ใช้ตัวกรองประเภทสินทรัพย์เพื่อเทียบหุ้นไทย หุ้นสหรัฐ กองทุน และ ETF ด้วยกรอบ valuation ที่เหมาะกับสินทรัพย์แต่ละแบบ"
        : "Use asset-type filters to compare Thai equities, US equities, funds, and ETFs with suitable valuation metrics.",
    },
  ];

  const faqItems = [
    {
      q: lang === "th" ? "Stock Screener คืออะไร?" : "What is a stock screener?",
      a: lang === "th"
        ? "Stock Screener คือเครื่องมือคัดกรองหุ้นตามเงื่อนไข เช่น Margin of Safety, P/E, Dividend Yield, ROE, sector และประเภทสินทรัพย์ เพื่อช่วยค้นหาหุ้นพื้นฐานดีหรือหุ้น undervalue ได้เร็วขึ้น"
        : "A stock screener filters securities by conditions such as Margin of Safety, P/E, Dividend Yield, ROE, sector, and asset type.",
    },
    {
      q: lang === "th" ? "หุ้น undervalue ดูจากอะไร?" : "How do I identify undervalued stocks?",
      a: lang === "th"
        ? "ควรดูว่าราคาตลาดต่ำกว่ามูลค่าประเมินจาก DCF หรือ Graham Number พร้อมตรวจคุณภาพธุรกิจ หนี้สิน กระแสเงินสด และความสม่ำเสมอของกำไร ไม่ควรดูแค่ราคาถูกหรือ P/E ต่ำ"
        : "Compare market price with DCF or Graham estimates, then review business quality, debt, cash flow, and earnings consistency.",
    },
    {
      q: lang === "th" ? "หุ้นพื้นฐานดีควรมีตัวเลขอะไรบ้าง?" : "What metrics suggest strong fundamentals?",
      a: lang === "th"
        ? "ตัวเลขสำคัญได้แก่ ROE ที่ดี, หนี้ไม่สูงเกินไป, กระแสเงินสดอิสระเป็นบวก, กำไรเติบโตสม่ำเสมอ, P/E ไม่แพงเกินพื้นฐาน และมี Margin of Safety เพียงพอ"
        : "Useful signals include healthy ROE, reasonable debt, positive free cash flow, consistent earnings, fair P/E, and enough Margin of Safety.",
    },
    {
      q: lang === "th" ? "หุ้นปันผลสูงน่าซื้อเสมอไหม?" : "Are high dividend stocks always attractive?",
      a: lang === "th"
        ? "ไม่เสมอครับ ต้องดูว่าปันผลมาจากกำไรและกระแสเงินสดจริงหรือไม่ หากราคาหุ้นตกแรงเพราะธุรกิจถดถอย Dividend Yield อาจดูสูงผิดปกติและกลายเป็น value trap"
        : "No. Dividends should be supported by earnings and cash flow. A falling stock price can make yield look high while risk is rising.",
    },
    {
      q: lang === "th" ? "ควรใช้ตัวกรองไหนก่อนสำหรับมือใหม่?" : "Which filters should beginners start with?",
      a: lang === "th"
        ? "เริ่มจากประเภทสินทรัพย์ที่สนใจ เช่น หุ้นไทยหรือหุ้นอเมริกา จากนั้นใช้ MOS, P/E, Dividend Yield และ sector เพื่อจำกัดรายชื่อ แล้วค่อยเปิดหน้าหุ้นรายตัวอ่านรายละเอียด"
        : "Start with asset type, then narrow by MOS, P/E, Dividend Yield, and sector before reviewing individual stock pages.",
    },
  ];

  return (
    <div className="mx-auto -mt-3 max-w-7xl space-y-5 overflow-hidden px-3 pb-24 pt-0 text-[13px] leading-relaxed animate-fade-up sm:-mt-4 sm:space-y-6 sm:px-4 sm:text-sm lg:-mt-5 lg:pb-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "@id": "https://valustock.com/stocks#screener",
                "name": "ValuStock Stock Screener",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "url": "https://valustock.com/stocks",
                "description": "โปรแกรมคัดกรองหุ้นไทย หุ้นอเมริกา หุ้นพื้นฐานดี หุ้น undervalue และหุ้นปันผลสูงด้วย DCF, Graham Number, P/E, Dividend Yield และ Margin of Safety",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "THB"
                }
              },
              {
                "@type": "FAQPage",
                "@id": "https://valustock.com/stocks#faq",
                "mainEntity": faqItems.map((faq) => ({
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
      {/* 🚀 A. LIVE GLOBAL TICKER MARQUEE */}
      <div className="group hidden w-full overflow-hidden rounded-xl border border-line/60 bg-elevate/45 py-2.5 shadow-sm sm:block">
        <div className="flex w-max animate-marquee whitespace-nowrap gap-10 text-xs font-mono font-bold select-none group-hover:[animation-play-state:paused]">
          {tickerStocks.concat(tickerStocks).map((stock, idx) => {
            const val = computeValuation(stock, defaultDCFParams(stock));
            const mos = val.marginOfSafety;
            const hasMos =
              Number.isFinite(mos) &&
              (stock.assetType === "TH_STOCK" || stock.assetType === "US_STOCK");
            const change =
              stock.prevClose > 0 ? ((stock.price - stock.prevClose) / stock.prevClose) * 100 : 0;
            const isUp = change >= 0;
            return (
              <button
                key={`${stock.symbol}-${idx}`}
                onClick={() => handleSelectStockForSandbox(stock.symbol)}
                className="flex items-center gap-2 hover:text-brand transition shrink-0"
              >
                <span className="text-ink">{stock.symbol}</span>
                <span className="text-muted">{formatPrice(stock, stock.price)}</span>
                <span className={isUp ? "text-up" : "text-down"}>
                  {isUp ? "▲" : "▼"} {change.toFixed(1)}%
                </span>
                <span
                  className={`text-xs px-1 border rounded ${
                    hasMos && mos >= 15
                      ? "border-up/40 text-up bg-up/5"
                      : hasMos && mos <= -15
                      ? "border-down/40 text-down bg-down/5"
                      : "border-line text-muted bg-surface"
                  }`}
                >
                  {hasMos ? `MOS ${mos.toFixed(0)}%` : stock.assetType || "MARKET"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page title and primary mode controls */}
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Layers className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 font-display text-xl font-black leading-tight text-ink sm:text-2xl md:text-3xl">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {lang === "th" ? "Stock Screener ตลาดไทยและสหรัฐฯ" : "Thai and US Market Screener"}
                </span>
                <span className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 font-sans text-xs font-bold uppercase text-brand animate-pulse">
                  Live
                </span>
              </h1>
              <p className="mt-2 max-w-3xl text-xs font-medium leading-6 text-muted [overflow-wrap:anywhere] sm:text-sm">
                {lang === "th"
                  ? "หน้ารวมตลาดไทย, NYSE, Nasdaq, ดัชนีหลัก, Bitcoin และทองคำ พร้อมตารางคัดกรองแบบมืออาชีพ"
                  : "A professional screener for Thai equities, NYSE, Nasdaq, major indices, Bitcoin, and gold."}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted">
                <span className="rounded-full border border-line bg-surface px-2.5 py-1">
                  {isUniverseLoading
                    ? lang === "th" ? "กำลังซิงก์ข้อมูลตลาด..." : "Syncing market data..."
                    : lang === "th" ? "ซิงก์ล่าสุด" : "Last sync"}{" "}
                  {marketUniverseMeta?.updatedAt ? new Date(marketUniverseMeta.updatedAt).toLocaleTimeString() : "—"}
                </span>
                {universeError && (
                  <span className="rounded-full border border-down/30 bg-down/10 px-2.5 py-1 text-down">
                    {lang === "th" ? "ใช้ข้อมูล fallback" : "Fallback data"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Presets */}
        <div className="flex flex-col gap-3 sm:items-end">
          {/* Switcher Toggle */}
          <div className="inline-flex rounded-xl bg-surface/60 border border-line p-1 select-none self-start sm:self-auto">
            <button
              onClick={() => {
                setViewMode("beginner");
                applyPreset("reset");
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === "beginner"
                  ? "bg-brand text-bg shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {lang === "th" ? "โหมดมือใหม่" : "Beginner"}
            </button>
            <button
              onClick={() => setViewMode("pro")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === "pro"
                  ? "bg-brand text-bg shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
                  {lang === "th" ? "โหมดมืออาชีพ" : "Pro View"}
            </button>
          </div>

          {/* Action Presets (only show in Pro mode) */}
          {viewMode === "pro" && (
            <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center">
              <span className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted sm:mr-1">
                {lang === "th" ? "สูตรคัดกรองด่วน:" : "Quick filters:"}
              </span>
              <button
                onClick={() => applyPreset("buffett")}
                disabled={!canScreen}
                className="inline-flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-xl border border-gold/30 bg-gold/5 px-2.5 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/15 disabled:opacity-50"
              >
                <Crown className="h-3.5 w-3.5" />
                <span className="sm:hidden">Value</span>
                <span className="hidden sm:inline">Value Core</span>
              </button>
              <button
                onClick={() => applyPreset("dividend")}
                disabled={!canScreen}
                className="inline-flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-xl border border-brand/30 bg-brand/5 px-2.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/15 disabled:opacity-50"
              >
                <CircleDollarSign className="h-3.5 w-3.5" />
                <span className="sm:hidden">Dividend</span>
                <span className="hidden sm:inline">Dividend</span>
              </button>
              <button
                onClick={() => applyPreset("growth")}
                disabled={!canScreen}
                className="inline-flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-xl border border-up/30 bg-up/5 px-2.5 py-1.5 text-xs font-semibold text-up transition hover:bg-up/15 disabled:opacity-50"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="sm:hidden">Growth</span>
                <span className="hidden sm:inline">Growth</span>
              </button>
              <button
                onClick={() => applyPreset("reset")}
                className="inline-flex min-w-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-elevate"
              >
                <span className="truncate">{lang === "th" ? "ล้างฟิลเตอร์" : "Reset Terminal"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Market summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
          <Card className="border border-line/60 p-4 bg-surface/30 flex items-center gap-3.5 relative overflow-hidden group hover:border-brand/40 transition min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-muted uppercase tracking-wider leading-none">
              {lang === "th" ? "หุ้นและสินทรัพย์ในระบบ" : "Assets covered"}
            </div>
            <div className="text-xl font-display font-extrabold text-ink mt-1.5">
              {kpis.totalCovered} <span className="text-xs text-muted font-normal">{lang === "th" ? "รายการ" : "assets"}</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              {marketUniverseMeta?.counts
                ? `TH ${marketUniverseMeta.counts.thai} · NYSE ${marketUniverseMeta.counts.nyse} · Nasdaq ${marketUniverseMeta.counts.nasdaq} · Crypto ${marketUniverseMeta.counts.crypto || 0} · Gold ${marketUniverseMeta.counts.futures || 0}`
                : "SET, mai, NYSE, Nasdaq, Bitcoin, Gold"}
            </div>
          </div>
        </Card>

        {/* KPI 2 */}
          <Card className="border border-line/60 p-4 bg-surface/30 flex items-center gap-3.5 relative overflow-hidden group hover:border-up/40 transition min-w-0">
          <div className="h-10 w-10 rounded-xl bg-up/10 text-up flex items-center justify-center shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-muted uppercase tracking-wider leading-none">
              {lang === "th" ? "พบราคาต่ำกว่ามูลค่า" : "Undervalued rate"}
            </div>
            <div className="text-xl font-display font-extrabold text-up mt-1.5">
              {kpis.bargainRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted mt-0.5">
              {kpis.bargainCount} {lang === "th" ? "รายการมี MOS >= 15%" : "assets with MOS >= 15%"}
            </div>
          </div>
        </Card>

        {/* KPI 3 */}
          <Card className="border border-line/60 p-4 bg-surface/30 flex items-center gap-3.5 relative overflow-hidden group hover:border-gold/40 transition min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-muted uppercase tracking-wider leading-none">
              {lang === "th" ? "ปันผลเฉลี่ย" : "Average yield"}
            </div>
            <div className="text-xl font-display font-extrabold text-gold mt-1.5">
              {kpis.avgYield.toFixed(2)}%
            </div>
            <div className="text-xs text-muted mt-0.5">
              {lang === "th" ? "ค่าเฉลี่ยจากหุ้นที่มีข้อมูล" : "Across covered equities"}
            </div>
          </div>
        </Card>

        {/* KPI 4 */}
          <Card className="border border-line/60 p-4 bg-surface/30 flex items-center gap-3.5 relative overflow-hidden group hover:border-brand/40 transition min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-muted uppercase tracking-wider leading-none">
              {lang === "th" ? "ตัวอย่างที่ MOS สูงสุด" : "Highest MOS example"}
            </div>
            <div className="text-xs font-bold text-ink mt-2 truncate flex items-center gap-1.5">
              <span className="text-brand font-mono font-extrabold">{kpis.topStar?.s.symbol}</span>
              <span className="text-muted font-normal truncate">
                {lang === "th" ? kpis.topStar?.s.name : kpis.topStar?.s.enName}
              </span>
            </div>
            <button
              onClick={() => handleSelectStockForSandbox(kpis.topStar!.s.symbol)}
              className="text-xs text-brand font-bold hover:underline mt-0.5 block flex items-center gap-0.5"
            >
              {lang === "th" ? "ลองจำลองมูลค่า" : "Open in simulator"}
            </button>
          </div>
        </Card>
      </div>

      {viewMode === "beginner" && marketMovers && (marketMovers.gainers.length > 0 || marketMovers.losers.length > 0 || marketMovers.volatile.length > 0) && (
        <Card className="border border-line/70 bg-surface/35 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <TrendingUp className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-sm font-bold text-ink">
                  {lang === "th" ? "Market Pulse" : "Market Pulse"}
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  {lang === "th"
                    ? "สรุปแรงเคลื่อนไหวล่าสุดของตลาดจากข้อมูลราคาที่อัปเดตแล้ว"
                    : "Fresh market movement signals from the latest available pricing data."}
                </p>
              </div>
            </div>
            <Badge tone="muted" className="self-start text-xs sm:self-auto">
              {lang === "th" ? "สัญญาณล่าสุด" : "Latest signals"}
            </Badge>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {[
              {
                title: lang === "th" ? "ตัวขึ้นเด่น" : "Top Gainers",
                rows: marketMovers.gainers,
                tone: "up" as const,
              },
              {
                title: lang === "th" ? "ตัวลงแรง" : "Top Losers",
                rows: marketMovers.losers,
                tone: "down" as const,
              },
              {
                title: lang === "th" ? "ผันผวนสูง" : "Most Active Moves",
                rows: marketMovers.volatile,
                tone: "gold" as const,
              },
            ].map((group) => (
              <div key={group.title} className="rounded-xl border border-line bg-elevate/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-black uppercase tracking-wider text-muted">{group.title}</div>
                  <Badge tone={group.tone} className="text-xs">
                    {group.rows.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {group.rows.slice(0, 5).map((mover) => {
                    const isUpMove = mover.changePct >= 0;
                    return (
                      <Link
                        key={`${group.title}-${mover.symbol}`}
                        href={`/stocks/${mover.symbol}`}
                        className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-surface"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-ink">{mover.symbol}</span>
                            <span className="truncate text-xs text-muted">{moverName(mover.symbol)}</span>
                          </div>
                          <div className="mt-0.5 text-xs text-muted">
                            {formatMoverPrice(mover)} · {mover.isDelayed ? `${mover.delayMinutes}m delayed` : "Market data"}
                          </div>
                        </div>
                        <div className={`num shrink-0 text-xs font-black ${isUpMove ? "text-up" : "text-down"}`}>
                          {isUpMove ? "+" : ""}
                          {mover.changePct.toFixed(2)}%
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sector guide for beginner mode */}
      {viewMode === "beginner" && (
      <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-muted tracking-widest block">
          {lang === "th" ? "หมวดธุรกิจเฉลี่ยส่วนเผื่อความปลอดภัย (Sector MOS Health)" : "Industry Heatmap (Avg Margin of Safety)"}
        </label>
        <div className="flex flex-wrap gap-2.5 pb-2 select-none">
          {sectorStats.map((sec) => {
            const isActive = sector === sec.name;
            const isGood = sec.avgMos >= 10;
            const label = lang === "th" ? sec.name : SECTOR_TRANS[sec.name] || sec.name;
            return (
              <button
                key={sec.name}
                onClick={() => setSector(sector === sec.name ? null : sec.name)}
                className={`min-w-0 flex-1 basis-[calc(50%-0.375rem)] flex flex-col items-start p-2.5 rounded-xl border transition-all text-left sm:shrink-0 sm:basis-auto sm:min-w-[140px] ${
                  isActive
                    ? "border-brand bg-brand/5 shadow-glow"
                    : "border-line bg-surface/30 hover:border-line/85 hover:bg-elevate/40"
                }`}
              >
                <span className="text-xs font-extrabold text-ink truncate w-full">
                  {label}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5 w-full justify-between">
                  <span className="text-xs font-mono text-muted">
                    {sec.count} {lang === "th" ? "บริษัท" : "assets"}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-1 rounded ${
                      isGood ? "text-up bg-up/5" : "text-down bg-down/5"
                    }`}
                  >
                    {sec.avgMos >= 0 ? "+" : ""}
                    {sec.avgMos.toFixed(0)}% MOS
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* 🚀 E. TWO-COLUMN LAYOUT: WORKSPACE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* COLUMNS 1-8: SCREENER FILTER & TABLE EXPAND */}
        <div className={`${viewMode === "pro" ? "lg:col-span-12" : "lg:col-span-9"} space-y-4`}>
          {viewMode === "beginner" ? (
            <div className="space-y-4">
              {/* Beginner Friendly Hero/Intro with Quick presets */}
              <Card className="border border-line bg-surface/40 backdrop-blur-md p-5 rounded-2xl relative overflow-hidden">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-brand" />
                      {lang === "th" ? "เริ่มจากเป้าหมายการลงทุนของคุณ" : "Start with your investing goal"}
                    </h3>
                    <p className="text-sm text-muted mt-2 leading-7">
                      {lang === "th"
                        ? "เลือกแนวทางด้านล่างเพื่อให้ระบบตั้งตัวกรองเริ่มต้นให้ก่อน จากนั้นค่อยอ่านราคาเหมาะสม MOS ปันผล และคุณภาพธุรกิจทีละตัว"
                        : "Pick a goal below to apply sensible starter filters, then review fair value, MOS, dividends, and business quality one stock at a time."}
                    </p>
                  </div>

                  {/* 3 Interactive Style Cards */}
                  <div className="grid gap-3 sm:grid-cols-3 mt-1">
                    {/* Card 1: Buffett Core */}
                    <button
                      onClick={() => {
                        applyPreset("buffett");
                        setSelectedAssetType("ALL");
                      }}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        minMos === 15 && maxPe === 15 && minYield === 1.0
                          ? "border-gold bg-gold/10 shadow-glow"
                          : "border-line bg-surface/30 hover:bg-elevate/45 hover:border-line/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <Crown className="h-4 w-4 text-gold" />
                          {lang === "th" ? "หุ้นคุณค่าเน้นปลอดภัย" : "Value stocks"}
                        </span>
                        {minMos === 15 && maxPe === 15 && minYield === 1.0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
                        )}
                      </div>
                      <p className="text-sm text-muted mt-2 leading-6">
                        {lang === "th"
                          ? "เหมาะกับคนที่อยากซื้อธุรกิจดีในราคาที่เผื่อความผิดพลาดไว้แล้ว"
                          : "For investors who want quality businesses with a buffer against valuation mistakes."}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2 text-xs font-mono text-gold font-bold">
                        <span>MOS ≥ 15%</span>
                        <span>P/E ≤ 15x</span>
                      </div>
                    </button>

                    {/* Card 2: Dividend Rich */}
                    <button
                      onClick={() => {
                        applyPreset("dividend");
                        setSelectedAssetType("TH_STOCK");
                      }}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        minMos === 5 && maxPe === 12 && minYield === 4.5 && selectedAssetType === "TH_STOCK"
                          ? "border-brand bg-brand/10 shadow-glow"
                          : "border-line bg-surface/30 hover:bg-elevate/45 hover:border-line/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <CircleDollarSign className="h-4 w-4 text-brand" />
                          {lang === "th" ? "หุ้นปันผลสม่ำเสมอ" : "Dividend stocks"}
                        </span>
                        {minMos === 5 && maxPe === 12 && minYield === 4.5 && selectedAssetType === "TH_STOCK" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ping" />
                        )}
                      </div>
                      <p className="text-sm text-muted mt-2 leading-6">
                        {lang === "th"
                          ? "เหมาะกับคนที่ต้องการกระแสเงินสดจากปันผล และยังอยากคุมราคาไม่ให้แพงเกินไป"
                          : "For investors seeking cash flow while keeping valuation discipline."}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2 text-xs font-mono text-brand font-bold">
                        <span>Yield ≥ 4.5%</span>
                        <span>P/E ≤ 12x</span>
                      </div>
                    </button>

                    {/* Card 3: Tech Growth */}
                    <button
                      onClick={() => {
                        applyPreset("growth");
                        setSelectedAssetType("US_STOCK");
                      }}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        minMos === 0 && maxPe === 30 && minYield === 0 && selectedAssetType === "US_STOCK"
                          ? "border-up bg-up/10 shadow-glow"
                          : "border-line bg-surface/30 hover:bg-elevate/45 hover:border-line/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <TrendingUp className="h-4 w-4 text-up" />
                          {lang === "th" ? "หุ้นเติบโต" : "Growth stocks"}
                        </span>
                        {minMos === 0 && maxPe === 30 && minYield === 0 && selectedAssetType === "US_STOCK" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-up animate-ping" />
                        )}
                      </div>
                      <p className="text-sm text-muted mt-2 leading-6">
                        {lang === "th"
                          ? "เหมาะกับคนรับความผันผวนได้ และอยากดูธุรกิจที่รายได้หรือกำไรมีโอกาสโตเร็ว"
                          : "For investors who can tolerate volatility and want faster growth potential."}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2 text-xs font-mono text-up font-bold">
                        <span>Growth Focus</span>
                        <span>P/E ≤ 30x</span>
                      </div>
                    </button>
                  </div>
                </div>
              </Card>

              {/* Simple Search & Filter Row */}
              <div className="grid gap-3 sm:grid-cols-4">
                {/* Search Bar (Cols 1-2) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-bold text-muted uppercase tracking-wider">
                    {lang === "th" ? "ค้นหาชื่อหุ้นหรือสัญลักษณ์" : "Search Stock Ticker"}
                  </label>
                  <div className="relative">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted" />
                    <input
                      type="text"
                      placeholder={lang === "th" ? "เช่น PTT, BDMS, AAPL..." : "e.g. KBANK, NVDA..."}
                      className="input-base pl-9 pr-28 text-sm uppercase"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    {q.trim() && (
                      <button
                        onClick={() => {
                          setQ("");
                          applyPreset("reset");
                        }}
                        className="absolute right-2 top-1.5 rounded-lg border border-line bg-elevate px-3 py-1 text-sm font-bold text-ink transition"
                      >
                        {lang === "th" ? "ล้างค่า" : "Clear"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Asset Selector Dropdown (Col 3) */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-bold text-muted uppercase tracking-wider">
                    {lang === "th" ? "ประเภทตลาด" : "Market Type"}
                  </label>
                  <select
                    className="input-base text-sm font-bold"
                    value={selectedAssetType}
                    onChange={(e) => setSelectedAssetType(e.target.value)}
                  >
                    <option value="ALL">{lang === "th" ? "ทั้งหมด" : "All markets"}</option>
                    <option value="INDEX">{lang === "th" ? "ดัชนีหลัก" : "Major indices"}</option>
                    <option value="TH_STOCK">{lang === "th" ? "ตลาดหุ้นไทย" : "Thai exchange"}</option>
                    <option value="NYSE">NYSE</option>
                    <option value="NASDAQ">Nasdaq</option>
                    <option value="US_STOCK">{lang === "th" ? "หุ้นสหรัฐฯ ทั้งหมด" : "All US stocks"}</option>
                    <option value="CRYPTO">{lang === "th" ? "Bitcoin / คริปโต" : "Bitcoin / Crypto"}</option>
                    <option value="FUTURES">{lang === "th" ? "ทองคำ / สินค้าโภคภัณฑ์" : "Gold / Commodities"}</option>
                    <option value="FUND">{lang === "th" ? "กองทุนรวมไทย" : "Thai funds"}</option>
                    <option value="US_FUND">{lang === "th" ? "กองทุนสหรัฐฯ" : "US funds"}</option>
                  </select>
                </div>

                {/* Valuation Selector Dropdown (Col 4) */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-bold text-muted uppercase tracking-wider">
                    {lang === "th" ? "สถานะความถูกแพง" : "Valuation Status"}
                  </label>
                  <select
                    className="input-base text-sm font-bold"
                    value={selectedVerdict}
                    onChange={(e) => setSelectedVerdict(e.target.value)}
                  >
                    <option value="ALL">{lang === "th" ? "ทุกสถานะราคา" : "All Verdicts"}</option>
                    <option value="undervalued">{lang === "th" ? "ราคาต่ำกว่ามูลค่า" : "Undervalued"}</option>
                    <option value="fair">{lang === "th" ? "ราคาใกล้มูลค่าเหมาะสม" : "Fair Value"}</option>
                    <option value="overvalued">{lang === "th" ? "ราคาสูงกว่ามูลค่า" : "Overvalued"}</option>
                  </select>
                </div>
              </div>

              {/* Beginner table with guided tabs */}
              <Card className="overflow-hidden border border-line/80 bg-surface/30">
                <div className="border-b border-line bg-elevate/25 px-3 py-2.5">
	                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
	                    <div>
	                      <h3 className="text-sm font-extrabold text-ink">
	                        {lang === "th" ? "ตารางคัดกรองแบบเข้าใจง่าย" : "Simple screener table"}
	                      </h3>
	                      <p className="mt-0.5 text-xs text-muted">
	                        {lang === "th" ? "แสดงรายการแรกแบบย่อ แยกดูตามประเภทตลาดและหัวข้อข้อมูล" : "A shorter table grouped by market type and topic."}
	                      </p>
	                    </div>
	                    <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:flex">
	                      {[
	                        { key: "valuation" as TabType, label: lang === "th" ? "ภาพรวม" : "Overview", icon: Calculator },
                        { key: "performance" as TabType, label: lang === "th" ? "คุณภาพ" : "Quality", icon: TrendingUp },
                        { key: "dividends" as TabType, label: lang === "th" ? "ปันผล" : "Dividend", icon: CircleDollarSign },
                        { key: "funds" as TabType, label: lang === "th" ? "กองทุน" : "Funds", icon: PieChart },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                          <button
                            key={`beginner-tab-${tab.key}`}
                            onClick={() => setActiveTab(tab.key)}
                            className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 font-bold transition ${
                              isActive
                                ? "border-brand/50 bg-brand/15 text-brand"
                                : "border-line bg-bg/35 text-muted hover:text-ink"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
	                      })}
	                    </div>
	                  </div>
	                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
	                    {[
	                      { value: "ALL", label: lang === "th" ? "ทั้งหมด" : "All" },
	                      { value: "TH_STOCK", label: lang === "th" ? "ไทย" : "Thai" },
	                      { value: "NYSE", label: "NYSE" },
	                      { value: "NASDAQ", label: "Nasdaq" },
	                      { value: "INDEX", label: lang === "th" ? "ดัชนี" : "Index" },
	                    ].map((typeTab) => {
	                      const isActive = selectedAssetType === typeTab.value;
	                      return (
	                        <button
	                          key={`beginner-type-${typeTab.value}`}
	                          onClick={() => {
	                            setSelectedAssetType(typeTab.value);
	                            setSector(null);
	                            setBeginnerShowAll(false);
	                          }}
	                          className={`h-7 shrink-0 rounded-full border px-3 font-bold transition ${
	                            isActive
	                              ? "border-brand/50 bg-brand/15 text-brand"
	                              : "border-line bg-bg/35 text-muted hover:text-ink"
	                          }`}
	                        >
	                          {typeTab.label}
	                        </button>
	                      );
	                    })}
	                  </div>
	                </div>

	                <div className="divide-y divide-line/60 md:hidden">
	                  {visibleRows.length === 0 ? (
	                    <div className="px-4 py-7 text-center">
	                      <h3 className="text-sm font-bold text-ink">
	                        {lang === "th" ? "ไม่พบหลักทรัพย์ที่ตรงตามเงื่อนไข" : "No matching assets"}
	                      </h3>
	                      <Button size="sm" className="mt-3 text-xs" onClick={() => applyPreset("reset")}>
	                        {lang === "th" ? "ล้างฟิลเตอร์" : "Reset"}
	                      </Button>
	                    </div>
	                  ) : (
	                    beginnerRows.map(({ s, v }) => {
	                      const displayName = lang === "th" ? s.name : s.enName || s.name;
	                      const isFund = s.assetType === "FUND" || s.assetType === "US_FUND";
	                      const isNonStock = isFund || s.assetType === "CRYPTO" || s.assetType === "FUTURES" || s.assetType === "INDEX";
	                      const netMargin = s.financials.revenue > 0 ? (s.financials.netIncome / s.financials.revenue) * 100 : 0;
	                      const deRatio =
	                        s.financials.totalDebt > 0 && s.financials.bookValuePerShare > 0
	                          ? s.financials.totalDebt / (s.financials.bookValuePerShare * s.sharesOutstanding)
	                          : 0;
	                      const payoutRatio =
	                        s.financials.eps > 0 && s.financials.dividendPerShare > 0
	                          ? (s.financials.dividendPerShare / s.financials.eps) * 100
	                          : 0;
	                      const assetLabel =
	                        s.assetType === "TH_STOCK"
	                          ? "TH"
	                          : s.market === "NYSE" || s.market === "NASDAQ"
	                            ? s.market
	                            : s.assetType === "INDEX"
	                              ? "INDEX"
	                              : s.assetType || "ASSET";
	                      const primaryMetrics =
	                        activeTab === "valuation"
	                          ? [
	                              { label: lang === "th" ? "ราคา" : "Price", value: formatPrice(s, s.price), tone: "text-ink" },
	                              { label: "FV", value: isNonStock ? "—" : formatPrice(s, v.fairValue), tone: "text-gold" },
	                              { label: "P/E", value: isFinite(v.ratios.pe) ? `${v.ratios.pe.toFixed(1)}x` : "—", tone: "text-ink" },
	                            ]
	                          : activeTab === "performance"
	                            ? [
	                                { label: "ROE", value: isNonStock || isNaN(v.ratios.roe) ? "—" : pct(v.ratios.roe), tone: "text-brand" },
	                                { label: "Margin", value: isNonStock ? "—" : pct(netMargin), tone: "text-ink" },
	                                { label: "D/E", value: isNonStock || deRatio === 0 ? "—" : deRatio.toFixed(2), tone: "text-muted" },
	                              ]
	                            : activeTab === "dividends"
	                              ? [
	                                  { label: "Yield", value: `${num(v.ratios.dividendYield, 2)}%`, tone: "text-gold" },
	                                  { label: "DPS", value: s.financials.dividendPerShare > 0 ? formatPrice(s, s.financials.dividendPerShare) : "0.00", tone: "text-ink" },
	                                  { label: "Payout", value: payoutRatio > 0 ? pct(payoutRatio) : "0%", tone: "text-muted" },
	                                ]
	                              : [
	                                  { label: lang === "th" ? "ประเภท" : "Type", value: s.fundType || s.assetType || "—", tone: "text-ink" },
	                                  { label: "Fee", value: s.expenseRatio ? `${s.expenseRatio.toFixed(2)}%` : "—", tone: "text-ink" },
	                                  { label: "Risk", value: s.riskLevel ? String(s.riskLevel) : "—", tone: "text-muted" },
	                                ];

	                      return (
	                        <div key={`beginner-mobile-${s.symbol}`} className="px-3 py-2.5">
	                          <div className="flex items-start justify-between gap-3">
	                            <div className="flex min-w-0 items-center gap-2">
	                              <span
	                                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border font-mono text-[9px] font-black leading-none text-white"
	                                style={{
	                                  background: `linear-gradient(135deg, ${s.color || "#3B82F6"} 0%, ${s.color || "#3B82F6"}99 100%)`,
	                                  borderColor: `${s.color || "#3B82F6"}55`,
	                                }}
	                              >
	                                {s.symbol.slice(0, 3)}
	                              </span>
	                              <div className="min-w-0">
	                                <div className="flex min-w-0 items-center gap-1.5">
	                                  <span className="truncate text-sm font-extrabold text-ink">{s.symbol}</span>
	                                  <span className="rounded border border-line bg-bg/60 px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-muted">
	                                    {assetLabel}
	                                  </span>
	                                </div>
	                                <span className="mt-0.5 block truncate text-[11px] text-muted" title={displayName}>
	                                  {displayName}
	                                </span>
	                              </div>
	                            </div>
	                            <Link href={`/stocks/${s.symbol}`} className="shrink-0">
	                              <button className="rounded bg-brand-soft p-1.5 text-brand">
	                                <ChevronRight className="h-3.5 w-3.5" />
	                              </button>
	                            </Link>
	                          </div>
	                          <div className="mt-2 grid grid-cols-3 gap-1.5">
	                            {primaryMetrics.map((metric) => (
	                              <div key={`${s.symbol}-${metric.label}`} className="rounded-lg border border-line bg-bg/35 px-2 py-1.5">
	                                <div className="truncate text-[9px] font-black uppercase tracking-wide text-muted">{metric.label}</div>
	                                <div className={`mt-1 truncate font-mono text-xs font-bold ${metric.tone}`}>{metric.value}</div>
	                              </div>
	                            ))}
	                          </div>
	                          {activeTab === "valuation" && (
	                            <div className="mt-2">
	                              <CompactValuationMosBar
	                                mos={v.marginOfSafety}
	                                disabledLabel={isFund ? "NAV" : s.assetType === "INDEX" ? "Index" : s.assetType === "CRYPTO" || s.assetType === "FUTURES" ? "Market" : undefined}
	                              />
	                            </div>
	                          )}
	                        </div>
	                      );
	                    })
	                  )}
	                </div>

	                <div className="hidden overflow-hidden md:block">
	                  <table className="w-full table-fixed border-collapse text-left text-[11px] leading-none">
                    {activeTab === "valuation" && (
                      <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[13%]" />
                        <col className="w-[13%]" />
                        <col className="w-[18%]" />
                        <col className="w-[10%]" />
                        <col className="w-[18%]" />
                      </colgroup>
                    )}
                    {activeTab === "performance" && (
                      <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[12%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                    )}
                    {activeTab === "dividends" && (
                      <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[12%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                    )}
                    {activeTab === "funds" && (
                      <colgroup>
                        <col className="w-[32%]" />
                        <col className="w-[18%]" />
                        <col className="w-[16%]" />
                        <col className="w-[12%]" />
                        <col className="w-[22%]" />
                      </colgroup>
                    )}
                    <thead>
                      <tr className="border-b border-line bg-elevate/35 text-[10px] font-black uppercase tracking-wide text-muted">
                        <th className="px-3 py-2">{lang === "th" ? "หลักทรัพย์" : "Asset"}</th>
                        {activeTab === "valuation" && (
                          <>
                            <th className="px-2.5 py-2 text-right">{lang === "th" ? "ราคา" : "Price"}</th>
                            <th className="px-2.5 py-2 text-right">FV</th>
                            <th className="px-2.5 py-2">MOS</th>
                            <th className="px-2.5 py-2 text-right">P/E</th>
                            <th className="px-3 py-2 text-right">{lang === "th" ? "ดำเนินการ" : "Action"}</th>
                          </>
                        )}
                        {activeTab === "performance" && (
                          <>
                            <th className="px-2.5 py-2 text-right">ROE</th>
                            <th className="px-2.5 py-2 text-right">{lang === "th" ? "Margin" : "Margin"}</th>
                            <th className="px-2.5 py-2 text-right">{lang === "th" ? "เติบโต" : "Growth"}</th>
                            <th className="px-2.5 py-2 text-right">D/E</th>
                            <th className="px-3 py-2 text-right">{lang === "th" ? "เปิด" : "Open"}</th>
                          </>
                        )}
                        {activeTab === "dividends" && (
                          <>
                            <th className="px-2.5 py-2 text-right">Yield</th>
                            <th className="px-2.5 py-2 text-right">DPS</th>
                            <th className="px-2.5 py-2 text-right">Payout</th>
                            <th className="px-2.5 py-2 text-right">{lang === "th" ? "เงินสด" : "Cash"}</th>
                            <th className="px-3 py-2 text-right">{lang === "th" ? "เปิด" : "Open"}</th>
                          </>
                        )}
                        {activeTab === "funds" && (
                          <>
                            <th className="px-2.5 py-2">{lang === "th" ? "ประเภท" : "Type"}</th>
                            <th className="px-2.5 py-2 text-right">Fee</th>
                            <th className="px-2.5 py-2 text-center">Risk</th>
                            <th className="px-3 py-2 text-right">{lang === "th" ? "เปิด" : "Open"}</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <h3 className="text-sm font-bold text-ink">
                        {lang === "th" ? "ไม่พบหลักทรัพย์ที่ตรงตามเงื่อนไข" : "No matching assets"}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {lang === "th" ? "ลองล้างฟิลเตอร์หรือเปลี่ยนตลาดที่เลือก" : "Try resetting filters or changing the selected market."}
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 text-xs"
                        onClick={() => {
                          applyPreset("reset");
                        }}
                      >
                        {lang === "th" ? "ล้างฟิลเตอร์" : "Reset"}
                      </Button>
                    </td>
                  </tr>
                ) : (
	                  beginnerRows.map(({ s, v }) => {
                    const displayName = lang === "th" ? s.name : s.enName || s.name;
                    const isFund = s.assetType === "FUND" || s.assetType === "US_FUND";
                    const isNonStock = isFund || s.assetType === "CRYPTO" || s.assetType === "FUTURES" || s.assetType === "INDEX";
                    const netMargin = s.financials.revenue > 0 ? (s.financials.netIncome / s.financials.revenue) * 100 : 0;
                    const deRatio =
                      s.financials.totalDebt > 0 && s.financials.bookValuePerShare > 0
                        ? s.financials.totalDebt / (s.financials.bookValuePerShare * s.sharesOutstanding)
                        : 0;
                    const payoutRatio =
                      s.financials.eps > 0 && s.financials.dividendPerShare > 0
                        ? (s.financials.dividendPerShare / s.financials.eps) * 100
                        : 0;
                    const verdictColor = {
                      undervalued: "up",
                      fair: "muted",
                      overvalued: "down",
                    }[v.verdict] as "up" | "muted" | "down";
                    const assetLabel =
                      s.assetType === "TH_STOCK"
                        ? "TH"
                        : s.market === "NYSE" || s.market === "NASDAQ"
                          ? s.market
                          : s.assetType === "INDEX"
                            ? "INDEX"
                            : s.assetType || "ASSET";

                    return (
                      <tr key={`beginner-row-${s.symbol}`} className="transition hover:bg-elevate/25">
                        <td className="px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-md border font-mono text-[8px] font-black leading-none text-white"
                              style={{
                                background: `linear-gradient(135deg, ${s.color || "#3B82F6"} 0%, ${s.color || "#3B82F6"}99 100%)`,
                                borderColor: `${s.color || "#3B82F6"}55`,
                              }}
                            >
                              {s.symbol.slice(0, 3)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate font-display text-xs font-extrabold text-ink">{s.symbol}</span>
                                <span className="shrink-0 rounded border border-line bg-bg/60 px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-muted">
                                  {assetLabel}
                                </span>
                              </div>
                              <span className="mt-0.5 block truncate text-[10px] leading-none text-muted" title={displayName}>
                                {displayName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {activeTab === "valuation" && (
                          <>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-ink">{formatPrice(s, s.price)}</td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-gold">{isNonStock ? "—" : formatPrice(s, v.fairValue)}</td>
                            <td className="px-2.5 py-2">
                              <CompactValuationMosBar
                                mos={v.marginOfSafety}
                                disabledLabel={isFund ? "NAV" : s.assetType === "INDEX" ? "Index" : s.assetType === "CRYPTO" || s.assetType === "FUTURES" ? "Market" : undefined}
                              />
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-ink">
                              {isFinite(v.ratios.pe) ? `${v.ratios.pe.toFixed(1)}x` : "—"}
                            </td>
                          </>
                        )}

                        {activeTab === "performance" && (
                          <>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-brand">
                              {isNonStock || isNaN(v.ratios.roe) ? "—" : pct(v.ratios.roe)}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-ink">
                              {isNonStock ? "—" : pct(netMargin)}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-up">
                              {isNonStock ? "—" : pct(s.financials.growthRate * 100)}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs text-muted">
                              {isNonStock || deRatio === 0 ? "—" : deRatio.toFixed(2)}
                            </td>
                          </>
                        )}

                        {activeTab === "dividends" && (
                          <>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-gold">
                              {num(v.ratios.dividendYield, 2)}%
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-ink">
                              {s.financials.dividendPerShare > 0 ? formatPrice(s, s.financials.dividendPerShare) : "0.00"}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs text-muted">
                              {payoutRatio > 0 ? pct(payoutRatio) : "0%"}
                            </td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs text-muted">
                              {isNonStock ? "—" : formatPrice(s, s.financials.cash)}
                            </td>
                          </>
                        )}

                        {activeTab === "funds" && (
                          <>
                            <td className="truncate px-2.5 py-2 text-xs text-muted">{s.fundType || s.assetType || "—"}</td>
                            <td className="px-2.5 py-2 text-right font-mono text-xs font-bold text-ink">
                              {s.expenseRatio ? `${s.expenseRatio.toFixed(2)}%` : "—"}
                            </td>
                            <td className="px-2.5 py-2 text-center font-mono text-xs font-bold text-muted">{s.riskLevel || "—"}</td>
                          </>
                        )}

                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Badge tone={verdictColor} className="hidden px-1.5 py-0.5 text-[9px] font-bold leading-none lg:inline-flex">
                              {v.verdict === "undervalued"
                                ? lang === "th" ? "น่าสนใจ" : "Value"
                                : v.verdict === "overvalued"
                                  ? lang === "th" ? "แพง" : "Rich"
                                  : lang === "th" ? "เหมาะสม" : "Fair"}
                            </Badge>
                            <button
                              onClick={() => handleSelectStockForSandbox(s.symbol)}
                              className="rounded bg-elevate p-1 text-muted transition hover:bg-brand/10 hover:text-brand"
                              title={lang === "th" ? "จำลองราคา" : "Sandbox"}
                            >
                              <Calculator className="h-3 w-3" />
                            </button>
                            <Link href={`/stocks/${s.symbol}`}>
                              <button className="rounded bg-brand-soft p-1 text-brand transition hover:bg-brand hover:text-white" title={lang === "th" ? "ดูรายละเอียด" : "Open details"}>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                    </tbody>
	                  </table>
	                </div>
	                {visibleRows.length > 8 && (
	                  <div className="flex flex-col gap-2 border-t border-line bg-elevate/20 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
	                    <span className="text-muted">
	                      {lang === "th"
	                        ? `แสดง ${beginnerRows.length} จาก ${visibleRows.length} รายการในประเภทนี้`
	                        : `Showing ${beginnerRows.length} of ${visibleRows.length} results in this segment`}
	                    </span>
	                    <button
	                      onClick={() => setBeginnerShowAll((value) => !value)}
	                      className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-bg/50 px-3 font-bold text-ink transition hover:border-brand/40 hover:text-brand"
	                    >
	                      {beginnerShowAll
	                        ? lang === "th" ? "ย่อรายการ" : "Show less"
	                        : lang === "th" ? "ดูเพิ่ม" : "Show more"}
	                    </button>
	                  </div>
	                )}
	              </Card>

              {/* Glossary Accordion at bottom of cards */}
              <Card className="border border-line bg-surface/20 p-5 rounded-2xl">
                <h4 className="mb-3 flex items-center gap-1.5 font-display text-base font-extrabold text-ink">
                  <Info className="h-4 w-4 text-brand" />
                  {lang === "th" ? "ความรู้เบื้องต้น: ตัวเลขเหล่านี้คืออะไร?" : "Beginner Guide: What do these mean?"}
                </h4>
                <div className="grid gap-4 text-sm leading-7 text-muted sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1">
                    <span className="font-bold text-ink block">1. ราคาเหมาะสม</span>
                    <span>มูลค่าที่ระบบประเมินจากกำไร กระแสเงินสด และการเติบโต ไม่ใช่ราคาซื้อขายจริงในตลาด</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-ink block">2. MOS</span>
                    <span>ส่วนต่างระหว่างราคาตลาดกับราคาเหมาะสม ค่าเป็นบวกมากแปลว่ามีส่วนเผื่อความผิดพลาดมากขึ้น</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-ink block">3. P/E</span>
                    <span>ราคาหุ้นเทียบกับกำไรต่อหุ้น ใช้ดูว่าตลาดจ่ายแพงแค่ไหนต่อกำไร 1 บาทของบริษัท</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-ink block">4. Dividend Yield</span>
                    <span>ผลตอบแทนปันผลต่อปีเมื่อเทียบกับราคาหุ้น ควรดูคู่กับกระแสเงินสดและ payout ratio</span>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <>
              <Card className="border border-line bg-surface/40 backdrop-blur-md p-4">
            <div className="space-y-4">
              {/* 🌍 PROFESSIONAL MARKET SEGMENTED TABS */}
              <div className="grid grid-cols-2 gap-2 border-b border-line pb-3 mb-4 select-none sm:flex sm:overflow-x-auto sm:scrollbar-none">
                {[
                  { value: "ALL", label: lang === "th" ? "ทั้งหมด" : "All", count: allStocks.length },
                  { value: "INDEX", label: lang === "th" ? "ดัชนีหลัก" : "Major indices", count: allStocks.filter(s => s.assetType === "INDEX").length },
                  { value: "TH_STOCK", label: lang === "th" ? "ตลาดไทย" : "Thai exchange", count: allStocks.filter(s => s.assetType === "TH_STOCK").length },
                  { value: "NYSE", label: "NYSE", count: allStocks.filter(s => s.assetType === "US_STOCK" && s.market === "NYSE").length },
                  { value: "NASDAQ", label: "Nasdaq", count: allStocks.filter(s => s.assetType === "US_STOCK" && s.market === "NASDAQ").length },
                  { value: "US_STOCK", label: lang === "th" ? "หุ้นสหรัฐฯ" : "US stocks", count: allStocks.filter(s => s.assetType === "US_STOCK").length },
                  { value: "CRYPTO", label: lang === "th" ? "Bitcoin / คริปโต" : "Bitcoin / Crypto", count: allStocks.filter(s => s.assetType === "CRYPTO").length },
                  { value: "FUTURES", label: lang === "th" ? "ทองคำ / สินค้าโภคภัณฑ์" : "Gold / Commodities", count: allStocks.filter(s => s.assetType === "FUTURES").length },
                  { value: "FUND", label: lang === "th" ? "กองทุนไทย" : "Thai funds", count: allStocks.filter(s => s.assetType === "FUND").length },
                  { value: "US_FUND", label: lang === "th" ? "กองทุนสหรัฐฯ" : "US funds", count: allStocks.filter(s => s.assetType === "US_FUND").length },
                ].map((mkt) => {
                  const isActive = selectedAssetType === mkt.value;
                  return (
                    <button
                      key={mkt.value}
                      onClick={() => {
                        setSelectedAssetType(mkt.value);
                        setSector(null); // Clean sector selection for context consistency
                      }}
                      className={`min-w-0 justify-between px-3 py-2.5 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all duration-200 sm:shrink-0 sm:px-4 ${
                        isActive
                          ? "bg-brand/10 text-brand border-brand/40 shadow-glow-brand font-extrabold"
                          : "bg-surface/30 text-muted border-line hover:border-line/80 hover:text-ink"
                      }`}
                    >
                      <span className="min-w-0 truncate whitespace-nowrap text-left leading-snug">{mkt.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                        isActive 
                          ? "bg-brand/20 text-brand" 
                          : "bg-line/60 text-muted"
                      }`}>
                        {mkt.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Screener Controls Row 1 */}
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Search (Takes 2 Columns for Spacious Professional Feel) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">
                    {lang === "th" ? "ค้นหาตัวย่อ ชื่อย่อ หรือบริษัท" : "Search Ticker or Company Name"}
                  </label>
                  <div className="relative">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted" />
                    <input
                      type="text"
                      placeholder={lang === "th" ? "เช่น PTT, AAPL, MINT..." : "e.g. ADVANC, NVDA..."}
                      className="input-base pl-9 pr-28 text-xs uppercase"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleDeepSearch();
                        }
                      }}
                    />
                    {q.trim() && (
                      <button
                        onClick={handleDeepSearch}
                        disabled={isSearchingApi}
                        className="absolute right-2 top-1.5 rounded-lg bg-brand px-3 py-1 text-xs font-bold text-ink shadow transition hover:bg-brand-hover disabled:opacity-50"
                      >
                        {isSearchingApi ? (
                          <span className="animate-spin inline-block h-2.5 w-2.5 border-2 border-ink border-t-transparent rounded-full" />
                        ) : (
                          lang === "th" ? "ดึงข้อมูล" : "Fetch"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Valuation Verdict Filter (Takes 1 Column) */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">
                    {lang === "th" ? "สถานะการประเมินมูลค่า" : "Valuation Verdict"}
                  </label>
                  <select
                    className="input-base text-xs font-bold"
                    value={selectedVerdict}
                    onChange={(e) => setSelectedVerdict(e.target.value)}
                  >
                    <option value="ALL">
                      {lang === "th" ? "ทุกสถานะมูลค่า" : "All Verdicts"}
                    </option>
                    <option value="undervalued">
                      {lang === "th" ? "ราคาต่ำกว่ามูลค่า (MOS >= 15%)" : "Undervalued"}
                    </option>
                    <option value="fair">
                      {lang === "th" ? "ราคาใกล้มูลค่าเหมาะสม" : "Fair Value"}
                    </option>
                    <option value="overvalued">
                      {lang === "th" ? "ราคาสูงกว่ามูลค่า (MOS <= -15%)" : "Overvalued"}
                    </option>
                  </select>
                </div>
              </div>

              {/* Slider screeners - Enabled for Pro/Premium */}
              {!canScreen ? (
                <div className="rounded-xl border border-line bg-elevate/45 p-3.5 text-center flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3 text-left">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gold/10 text-gold shrink-0">
                      <Lock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-ink [overflow-wrap:anywhere]">
                        {lang === "th" ? "ต้องการคัดกรองส่วนต่าง MOS & P/E ละเอียด?" : "Unlock Advanced Screen Sliders?"}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed [overflow-wrap:anywhere]">
                        {lang === "th"
                          ? "ปลดล็อกตัวคัดกรอง MOS, P/E และ Div % แบบละเอียด"
                          : "Unlock MOS, P/E and dividend yield sliders."}
                      </p>
                    </div>
                  </div>
                  <Link href="/pricing" className="w-full sm:w-auto">
                    <Button size="sm" variant="gold" className="flex w-full shrink-0 items-center gap-1 sm:w-auto">
                      <Crown className="h-3.5 w-3.5" />
                      {lang === "th" ? "อัปเกรดโปร" : "Upgrade to Pro"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3 border-t border-line/40 pt-3">
                  {/* MOS Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-muted">
                      <span>{lang === "th" ? "ส่วนลดขั้นต่ำ (MOS %)" : "Min Safety Margin (MOS)"}</span>
                      <span className="text-brand font-mono">{minMos}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                      value={minMos}
                      onChange={(e) => setMinMos(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* P/E Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-muted">
                      <span>{lang === "th" ? "อัตราส่วน P/E สูงสุด" : "Max Valuation P/E"}</span>
                      <span className="text-brand font-mono">
                        {maxPe >= 100 ? "UNLIMITED" : maxPe + "x"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                      value={maxPe}
                      onChange={(e) => setMaxPe(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Dividend Yield Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-muted">
                      <span>{lang === "th" ? "อัตราปันผลขั้นต่ำ %" : "Min Dividend Yield %"}</span>
                      <span className="text-brand font-mono">{minYield}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                      value={minYield}
                      onChange={(e) => setMinYield(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* TABLE TAB SYSTEM */}
          <div className="flex flex-col space-y-2">
            <div className="space-y-2 border-b border-line pb-2">
              <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:overflow-x-auto sm:scrollbar-none">
                <button
                  onClick={() => setActiveTab("valuation")}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-bold transition-all sm:shrink-0 sm:justify-start sm:border-x-0 sm:border-t-0 sm:rounded-none sm:border-b-2 sm:px-4 ${
                    activeTab === "valuation"
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <Calculator className="h-3.5 w-3.5" />
                  {lang === "th" ? "ประเมินราคา" : "Valuation"}
                </button>
                <button
                  onClick={() => setActiveTab("performance")}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-bold transition-all sm:shrink-0 sm:justify-start sm:border-x-0 sm:border-t-0 sm:rounded-none sm:border-b-2 sm:px-4 ${
                    activeTab === "performance"
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {lang === "th" ? "งบการเงิน" : "Financials"}
                </button>
                <button
                  onClick={() => setActiveTab("dividends")}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-bold transition-all sm:shrink-0 sm:justify-start sm:border-x-0 sm:border-t-0 sm:rounded-none sm:border-b-2 sm:px-4 ${
                    activeTab === "dividends"
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  {lang === "th" ? "ปันผล" : "Dividends"}
                </button>
                <button
                  onClick={() => setActiveTab("funds")}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-bold transition-all sm:shrink-0 sm:justify-start sm:border-x-0 sm:border-t-0 sm:rounded-none sm:border-b-2 sm:px-4 ${
                    activeTab === "funds"
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  <PieChart className="h-3.5 w-3.5" />
                  {lang === "th" ? "กองทุน/ETF" : "Funds / ETFs"}
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Table Sorting Trigger */}
                <div className="flex items-center justify-between gap-1.5 rounded-lg border border-line bg-surface/30 px-2 py-1 text-xs sm:justify-start">
                  <span className="font-bold uppercase tracking-wider text-muted">{lang === "th" ? "เรียงตาม:" : "Sort:"}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="min-w-0 bg-transparent font-mono font-bold text-ink focus:outline-none"
                  >
                    <option value="mos">MOS %</option>
                    <option value="pe">P/E Ratio</option>
                    <option value="growth">FCF Growth</option>
                    <option value="yield">Dividend Yield</option>
                    <option value="symbol">A-Z Ticker</option>
                  </select>
                </div>

                {/* 📥 CSV Screener Export Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex h-8 w-full items-center gap-1.5 overflow-hidden px-3 text-xs sm:w-auto"
                  onClick={handleExportScreenerCSV}
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="truncate">{lang === "th" ? "ส่งออก CSV" : "Export CSV"}</span>
                </Button>
              </div>
            </div>

            {/* MOBILE SCREENER CARDS */}
            <div className="space-y-3 md:hidden">
              {visibleRows.length === 0 && isInitialQuoteLoading ? (
                <QuoteLoadingCard
                  title={lang === "th" ? "กำลังโหลดราคาล่าสุด" : "Loading latest market prices"}
                  subtitle={lang === "th" ? "กำลังซิงก์ราคาล่าสุดจากแหล่งข้อมูลตลาด..." : "Syncing latest market prices..."}
                />
              ) : visibleRows.length === 0 ? (
                <Card className="border border-line p-5 text-center">
                  <span className="text-xl">🔍</span>
                  <h3 className="mt-3 text-sm font-bold text-ink">
                    {lang === "th" ? "ไม่พบหลักทรัพย์ที่ค้นหา" : "No matching assets"}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {lang === "th" ? "ลองล้างฟิลเตอร์ หรือค้นหาด้วยสัญลักษณ์หุ้นอีกครั้ง" : "Try clearing filters or searching by ticker symbol."}
                  </p>
                  {q.trim() && (
                    <Button size="sm" className="mt-4 w-full text-xs" onClick={handleDeepSearch} disabled={isSearchingApi}>
                      {isSearchingApi ? (lang === "th" ? "กำลังดึงข้อมูล..." : "Fetching data...") : (lang === "th" ? `ดึงข้อมูล ${q.toUpperCase().trim()}` : `Fetch ${q.toUpperCase().trim()}`)}
                    </Button>
                  )}
                </Card>
              ) : (
                visibleRows.map(({ s, v }) => {
                  const displayName = lang === "th" ? s.name : s.enName || s.name;
                  const isFund = s.assetType === "FUND" || s.assetType === "US_FUND";
                  const isNonStock = isFund || s.assetType === "CRYPTO" || s.assetType === "FUTURES" || s.assetType === "INDEX";
                  const netMargin = s.financials.revenue > 0 ? (s.financials.netIncome / s.financials.revenue) * 100 : 0;
                  const payoutRatio =
                    s.financials.eps > 0 && s.financials.dividendPerShare > 0
                      ? (s.financials.dividendPerShare / s.financials.eps) * 100
                      : 0;
                  const verdictColor = {
                    undervalued: "up",
                    fair: "muted",
                    overvalued: "down",
                  }[v.verdict] as "up" | "muted" | "down";

                  return (
                    <Card key={`mobile-${s.symbol}`} className="w-full max-w-full overflow-hidden border border-line/80 bg-surface/35 p-4">
                      <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
                        <button
                          onClick={() => handleSelectStockForSandbox(s.symbol)}
                          className="flex min-w-0 max-w-full items-center gap-2 text-left"
                        >
                          <AssetLogo symbol={s.symbol} color={s.color} size="sm" />
                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                              <span className="font-display text-sm font-bold text-ink">{s.symbol}</span>
                              <span className="rounded border border-line bg-elevate px-1.5 py-0.5 text-sm font-bold text-muted">
                                {s.assetType || "STOCK"}
                              </span>
                            </div>
                            <span className="mt-0.5 block max-w-[260px] text-xs leading-snug text-muted [overflow-wrap:anywhere]">
                              {displayName}
                            </span>
                          </div>
                        </button>
                        <Badge tone={verdictColor} className="w-fit max-w-full shrink-0 px-1.5 py-0.5 text-xs font-bold">
                          {t(`verdict.${v.verdict}`)}
                        </Badge>
                      </div>

                      {activeTab === "valuation" && (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl border border-line bg-bg/55 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-black uppercase tracking-wide text-muted">
                                  {lang === "th" ? "ราคาตลาด" : "Market"}
                                </div>
                                <div className="mt-1 font-mono text-base font-black text-ink">{formatPrice(s, s.price)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-black uppercase tracking-wide text-muted">
                                  {lang === "th" ? "ราคาเหมาะสม" : "Fair Value"}
                                </div>
                                <div className="mt-1 font-mono text-base font-black text-gold">
                                  {isNonStock ? "—" : formatPrice(s, v.fairValue)}
                                </div>
                              </div>
                            </div>
                            <ValuationMosBar
                              mos={v.marginOfSafety}
                              disabledLabel={isFund ? "NAV" : s.assetType === "INDEX" ? "Index" : s.assetType === "CRYPTO" || s.assetType === "FUTURES" ? "Market" : undefined}
                              compact
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <MetricChip label="P/E" value={isFinite(v.ratios.pe) ? `${num(v.ratios.pe, 1)}x` : "—"} />
                            <MetricChip label="Yield" value={`${num(v.ratios.dividendYield, 1)}%`} tone="gold" />
                            <MetricChip label="ROE" value={isNonStock || isNaN(v.ratios.roe) ? "—" : pct(v.ratios.roe)} tone="brand" />
                          </div>
                        </div>
                      )}

                      {activeTab === "performance" && (
                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          <MobileMetric label={lang === "th" ? "รายได้" : "Revenue"} value={isNonStock ? "—" : formatPrice(s, s.financials.revenue)} />
                          <MobileMetric label={lang === "th" ? "กำไรสุทธิ" : "Net Income"} value={isNonStock ? "—" : formatPrice(s, s.financials.netIncome)} />
                          <MobileMetric label={lang === "th" ? "อัตรากำไร" : "Margin"} value={isNonStock ? "—" : pct(netMargin)} />
                          <MobileMetric label={lang === "th" ? "เติบโต" : "Growth"} value={isNonStock ? "—" : pct(s.financials.growthRate * 100)} accent />
                        </div>
                      )}

                      {activeTab === "dividends" && (
                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          <MobileMetric label={lang === "th" ? "ปันผล/หุ้น" : "DPS"} value={s.financials.dividendPerShare > 0 ? formatPrice(s, s.financials.dividendPerShare) : "0.00"} accent />
                          <MobileMetric label={lang === "th" ? "Yield" : "Yield"} value={`${num(v.ratios.dividendYield, 2)}%`} accent />
                          <MobileMetric label={lang === "th" ? "Payout" : "Payout"} value={payoutRatio > 0 ? pct(payoutRatio) : "0%"} />
                          <MobileMetric label={lang === "th" ? "เงินสด" : "Cash"} value={isNonStock ? "—" : formatPrice(s, s.financials.cash)} />
                        </div>
                      )}

                      {activeTab === "funds" && (
                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                          <MobileMetric label={lang === "th" ? "ประเภท" : "Type"} value={s.fundType || s.assetType || "—"} />
                          <MobileMetric label={lang === "th" ? "ค่าธรรมเนียม" : "Fee"} value={s.expenseRatio ? `${s.expenseRatio.toFixed(2)}%` : "—"} />
                          <MobileMetric label="AUM" value={s.aum ? (s.currency === "USD" ? dollar(s.aum) : baht(s.aum)) : "—"} accent />
                          <MobileMetric label={lang === "th" ? "ความเสี่ยง" : "Risk"} value={s.riskLevel ? String(s.riskLevel) : "—"} />
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-2 border-t border-line/50 pt-3 sm:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs sm:flex-1"
                          onClick={() => handleSelectStockForSandbox(s.symbol)}
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          {lang === "th" ? "จำลอง" : "Sandbox"}
                        </Button>
                        <Link href={`/stocks/${s.symbol}`} className="block w-full sm:flex-1">
                          <Button size="sm" className="w-full text-xs">
                            {lang === "th" ? "วิเคราะห์" : "Open"}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* DENSE INSTITUTIONAL TABLE */}
            <Card className="hidden overflow-hidden border border-line/80 md:block">
              <div className="overflow-hidden">
                <table className="w-full table-fixed border-collapse text-left text-[11px] leading-none">
                  {activeTab === "valuation" && (
                    <colgroup>
                      <col className="w-[23%]" />
                      <col className="w-[23%]" />
                      <col className="w-[12%]" />
                      <col className="w-[8%]" />
                      <col className="w-[8%]" />
                      <col className="w-[8%]" />
                      <col className="w-[10%]" />
                      <col className="w-[8%]" />
                    </colgroup>
                  )}
                  <thead>
                    <tr className="border-b border-line bg-elevate/50 text-muted font-bold tracking-wider">
                      <th className="whitespace-nowrap px-2.5 py-2">{lang === "th" ? "หลักทรัพย์" : "TICKER"}</th>

                      {activeTab === "valuation" && (
                        <>
                          <th className="whitespace-nowrap px-2.5 py-2">{lang === "th" ? "MOS / สถานะ" : "MOS / STATUS"}</th>
                          <th className="whitespace-nowrap px-2.5 py-2 text-right">{lang === "th" ? "ราคา / FV" : "PRICE / FV"}</th>
                          <th className="whitespace-nowrap px-2.5 py-2 text-right">P/E</th>
                          <th className="whitespace-nowrap px-2.5 py-2 text-right">Yield</th>
                          <th className="whitespace-nowrap px-2.5 py-2 text-right">ROE</th>
                          <th className="whitespace-nowrap px-2.5 py-2 text-center">{lang === "th" ? "เทรนด์" : "TREND"}</th>
                        </>
                      )}

                      {activeTab === "performance" && (
                        <>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "รายได้" : "REVENUE"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "กำไรสุทธิ" : "NET INCOME"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "Margin" : "NET MARGIN"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "เติบโต" : "GROWTH"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">EBITDA</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">D/E</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">ROE</th>
                        </>
                      )}

                      {activeTab === "dividends" && (
                        <>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "ราคา" : "PRICE"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">DPS</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">Yield</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">Payout</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">FCF</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "เงินสด" : "CASH"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "หนี้สุทธิ" : "NET DEBT"}</th>
                        </>
                      )}

                      {activeTab === "funds" && (
                        <>
                          <th className="whitespace-nowrap px-3 py-2.5">{lang === "th" ? "ประเภท" : "FUND TYPE"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5">{lang === "th" ? "กองทุนหลัก" : "MASTER FUND"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "Fee" : "EXPENSE"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right">AUM</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-center">{lang === "th" ? "Risk" : "RISK"}</th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-center">{lang === "th" ? "Top Holding" : "TOP HOLDING"}</th>
                        </>
                      )}

                      <th className="whitespace-nowrap px-3 py-2.5 text-right">{lang === "th" ? "เปิด" : "OPEN"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-12 text-center">
                          {isInitialQuoteLoading ? (
                            <div className="mx-auto max-w-md">
                              <QuoteLoadingCard
                                title={lang === "th" ? "กำลังโหลดราคาล่าสุด" : "Loading latest market prices"}
                                subtitle={lang === "th" ? "กำลังซิงก์ราคาล่าสุดจากแหล่งข้อมูลตลาด..." : "Syncing latest market prices..."}
                              />
                            </div>
                          ) : (
                          <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
                            <span className="text-xl">🔍</span>
                            <h3 className="text-sm font-bold text-ink">
                              {lang === "th"
                                ? "ไม่พบหลักทรัพย์ที่กำลังค้นหาในรายการหลัก?"
                                : "Not found in the primary asset list?"}
                            </h3>
                            <p className="text-xs text-muted leading-relaxed">
                              {lang === "th"
                                ? "คุณสามารถค้นหาเชิงลึกเพื่อดึงข้อมูลหลักทรัพย์จากฐานข้อมูลตลาดสากลได้โดยตรง"
                                : "You can run deep ticker lookup to fetch asset details from global market data."}
                            </p>
                            
                            {q.trim() && (
                              <button
                                onClick={handleDeepSearch}
                                disabled={isSearchingApi}
                                className="button-brand text-xs px-6 py-2 rounded-xl flex items-center justify-center space-x-2 font-bold shadow-glow hover:scale-[1.02] transition active:scale-95 disabled:opacity-50"
                              >
                                {isSearchingApi ? (
                                  <>
                                    <span className="animate-spin inline-block mr-1 h-3 w-3 border-2 border-ink border-t-transparent rounded-full" />
                                    <span>
                                      {lang === "th" ? "กำลังดึงข้อมูล..." : "Fetching data..."}
                                    </span>
                                  </>
                                ) : (
                                  <span>
                                    {lang === "th" 
                                      ? `ดึงข้อมูลสัญลักษณ์ "${q.toUpperCase().trim()}"`
                                      : `Fetch "${q.toUpperCase().trim()}"`}
                                  </span>
                                )}
                              </button>
                            )}

                            {apiSearchError && (
                              <p className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                                ⚠️ {apiSearchError}
                              </p>
                            )}
                          </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => {
                        const s = row.s;
                        const v = row.v;
                        const displayName = lang === "th" ? s.name : s.enName || s.name;
                        const isFund = s.assetType === "FUND" || s.assetType === "US_FUND";
                        const isNonStock = isFund || s.assetType === "CRYPTO" || s.assetType === "FUTURES" || s.assetType === "INDEX";

                        // Ratios calculations
                        const netMargin = s.financials.revenue > 0 ? (s.financials.netIncome / s.financials.revenue) * 100 : 0;
                        const deRatio =
                          s.financials.totalDebt > 0 && s.financials.bookValuePerShare > 0
                            ? s.financials.totalDebt / (s.financials.bookValuePerShare * s.sharesOutstanding)
                            : 0;
                        const payoutRatio =
                          s.financials.eps > 0 && s.financials.dividendPerShare > 0
                            ? (s.financials.dividendPerShare / s.financials.eps) * 100
                            : 0;
                        const netDebtVal = s.financials.totalDebt - s.financials.cash;

                        const verdictColor = {
                          undervalued: "up",
                          fair: "muted",
                          overvalued: "down",
                        }[v.verdict] as "up" | "muted" | "down";
                        const compactVerdict =
                          lang === "th"
                            ? v.verdict === "undervalued"
                              ? "ถูก"
                              : v.verdict === "overvalued"
                                ? "แพง"
                                : "เหมาะสม"
                            : v.verdict === "undervalued"
                              ? "Value"
                              : v.verdict === "overvalued"
                                ? "Rich"
                                : "Fair";

                        const isSelectedSandbox = s.symbol === sandboxSymbol;

                        return (
                          <tr
                            key={s.symbol}
                            className={`hover:bg-elevate/30 transition group ${
                              isSelectedSandbox ? "bg-brand/5 border-l-2 border-brand" : ""
                            }`}
                          >
                            {/* Symbol & Name */}
                            <td className="px-2.5 py-1.5 leading-none">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-md border text-[8px] font-black leading-none text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${s.color || "#3B82F6"} 0%, ${s.color || "#3B82F6"}99 100%)`,
                                    borderColor: `${s.color || "#3B82F6"}55`,
                                  }}
                                >
                                  {s.symbol.slice(0, 3)}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex min-w-0 items-center gap-1">
                                    <span className="truncate font-display text-[11px] font-extrabold leading-none text-ink transition group-hover:text-brand">
                                      {s.symbol}
                                    </span>
                                    {s.assetType === "TH_STOCK" ? (
                                      <span className="shrink-0 rounded border border-blue-500/20 bg-blue-500/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-blue-400">
                                        🇹🇭 TH
                                      </span>
                                    ) : s.assetType === "US_STOCK" ? (
                                      <span className="shrink-0 rounded border border-purple-500/20 bg-purple-500/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-purple-400">
                                        🇺🇸 US
                                      </span>
                                    ) : s.assetType === "FUND" ? (
                                      <span className="shrink-0 rounded border border-gold/30 bg-gold/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-gold">
                                        📊 TH_FUND
                                      </span>
                                    ) : s.assetType === "US_FUND" ? (
                                      <span className="shrink-0 rounded border border-pink-500/30 bg-pink-500/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-pink-400">
                                        🇺🇸 US_FUND
                                      </span>
                                    ) : s.assetType === "INDEX" ? (
                                      <span className="shrink-0 rounded border border-brand/30 bg-brand/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-brand">
                                        INDEX
                                      </span>
                                    ) : s.assetType === "CRYPTO" ? (
                                      <span className="shrink-0 rounded border border-orange-500/30 bg-orange-500/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-orange-400">
                                        🪙 CRYPTO
                                      </span>
                                    ) : s.assetType === "FUTURES" ? (
                                      <span className="shrink-0 rounded border border-cyan-500/30 bg-cyan-500/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-cyan-400">
                                        📈 FUTURE
                                      </span>
                                    ) : (
                                      <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/5 px-1 font-mono text-[9px] font-bold uppercase leading-none text-emerald-400">
                                        🌍 ETF
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className="mt-1 block max-w-full truncate text-[10px] font-semibold leading-none text-muted"
                                    title={displayName}
                                  >
                                    {displayName}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* TAB 1: VALUATION HUB */}
                            {activeTab === "valuation" && (
                              <>
                                <td className="px-2.5 py-1.5 leading-none">
                                  <div className="flex items-center justify-between gap-3">
                                    <CompactValuationMosBar
                                      mos={v.marginOfSafety}
                                      disabledLabel={isFund ? "NAV" : s.assetType === "INDEX" ? "Index" : s.assetType === "CRYPTO" || s.assetType === "FUTURES" ? "Market" : undefined}
                                    />
                                    <Badge tone={verdictColor} className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold leading-none">
                                      {compactVerdict}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-2.5 py-1.5 text-right leading-none">
                                  <div className="font-mono text-xs font-black text-ink">{formatPrice(s, s.price)}</div>
                                  <div className="mt-0.5 font-mono text-[11px] font-bold text-muted">
                                    {lang === "th" ? "FV " : "FV "}
                                    <span className="text-gold">{isNonStock ? "—" : formatPrice(s, v.fairValue)}</span>
                                  </div>
                                </td>
                                <td className="px-2.5 py-1.5 text-right font-mono text-[11px] font-bold leading-none text-ink">
                                  {isFinite(v.ratios.pe) ? `${num(v.ratios.pe, 1)}x` : "—"}
                                </td>
                                <td className="px-2.5 py-1.5 text-right font-mono text-[11px] font-bold leading-none text-gold">
                                  {num(v.ratios.dividendYield, 1)}%
                                </td>
                                <td className="px-2.5 py-1.5 text-right font-mono text-[11px] font-bold leading-none text-brand">
                                  {isNonStock || isNaN(v.ratios.roe) ? "—" : pct(v.ratios.roe)}
                                </td>
                                <td className="px-2.5 py-1.5 text-center align-middle leading-none">
                                  <div className="inline-flex items-center justify-center">
                                    <Sparkline history={s.priceHistory} symbol={s.symbol} />
                                  </div>
                                </td>
                              </>
                            )}

                            {/* TAB 2: FINANCIAL AUDITS */}
                            {activeTab === "performance" && (
                              <>
                                <td className="px-3 py-2 text-right font-mono text-ink">
                                  {isNonStock ? "—" : formatPrice(s, s.financials.revenue)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-ink">
                                  {isNonStock ? "—" : formatPrice(s, s.financials.netIncome)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-ink">
                                  {isNonStock ? "—" : pct(netMargin)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-brand">
                                  {isNonStock ? "—" : pct(s.financials.growthRate * 100)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted">
                                  {isNonStock ? "—" : formatPrice(s, s.financials.ebitda)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted">
                                  {isNonStock || deRatio === 0 ? "—" : deRatio.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted">
                                  {isNonStock || isNaN(v.ratios.roe) ? "—" : pct(v.ratios.roe)}
                                </td>
                              </>
                            )}

                            {/* TAB 3: DIVIDENDS & CASHFLOW */}
                            {activeTab === "dividends" && (
                              <>
                                <td className="px-3 py-2 text-right font-mono text-ink">
                                  {formatPrice(s, s.price)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-gold">
                                  {s.financials.dividendPerShare > 0 ? formatPrice(s, s.financials.dividendPerShare) : "0.00"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-extrabold text-gold">
                                  {num(v.ratios.dividendYield, 2)}%
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted">
                                  {payoutRatio > 0 ? pct(payoutRatio) : "0%"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-ink">
                                  {isNonStock ? "—" : formatPrice(s, s.financials.freeCashFlow)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted">
                                  {isNonStock ? "—" : formatPrice(s, s.financials.cash)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted">
                                  {isNonStock ? "—" : formatPrice(s, netDebtVal)}
                                </td>
                              </>
                            )}

                            {/* TAB 4: FUNDS & ETFS */}
                            {activeTab === "funds" && (
                              <>
                                <td className="px-3 py-2 text-muted capitalize">
                                  {s.fundType || s.assetType}
                                </td>
                                <td className="max-w-[140px] truncate px-3 py-2 text-[11px] text-muted" title={s.masterFund || s.feederFund}>
                                  {s.masterFund || s.feederFund || "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-ink">
                                  {s.expenseRatio ? `${s.expenseRatio.toFixed(2)}%` : "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-ink">
                                  {s.aum ? (s.currency === "USD" ? dollar(s.aum) : baht(s.aum)) : "—"}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {s.riskLevel ? (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-elevate text-ink font-mono font-extrabold text-xs border border-line">
                                      {s.riskLevel}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {s.topHoldings && s.topHoldings.length > 0 ? (
                                    <span className="text-[11px] font-bold uppercase text-brand" title={s.topHoldings.map((h: any) => `${h.name} (${h.weight}%)`).join(", ")}>
                                      {s.topHoldings[0].name} ({s.topHoldings[0].weight}%)
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </>
                            )}

                            {/* Clickable Actions */}
                            <td className="shrink-0 px-2.5 py-1.5 text-right leading-none">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSelectStockForSandbox(s.symbol)}
                                  className="rounded bg-elevate p-0.5 text-muted transition hover:bg-brand/10 hover:text-brand"
                                  title={lang === "th" ? "โหลดเข้าเครื่องจำลอง" : "Load into Sandbox"}
                                >
                                  <Calculator className="h-3 w-3" />
                                </button>
                                <Link href={`/stocks/${s.symbol}`}>
                                  <button className="rounded bg-brand-soft p-0.5 text-brand transition hover:bg-brand hover:text-white">
                                    <ChevronRight className="h-3 w-3" />
                                  </button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* F. UNRESTRICTED CAPACITY LIMIT CHECK */}
            {lockedCount > 0 && (
              <Card className="border border-gold/40 bg-gold/5 p-4 text-center mt-3 animate-pulse">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gold/15 text-gold mb-2">
                  <Lock className="h-4 w-4" />
                </span>
                <h3 className="text-xs font-bold text-ink">
                  {lang === "th"
                    ? `🔒 คัดกรองเพิ่มเติมอีก ${lockedCount} บริษัท ถูกระงับสิทธิ์การรับชม`
                    : `🔒 ${lockedCount} Screened Opportunities Locked`}
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto mt-0.5">
                  {lang === "th"
                    ? `บัญชีทดลองฟรีจำกัดสิทธิ์เข้าถึงไม่เกิน ${maxStocks} บริษัท อัปเกรดเป็นแพ็กเกจ Pro เพื่อคัดกรองหุ้นและ ETF แบบไม่จำกัด`
                    : `Your current tier is capped at ${maxStocks} listings. Upgrade to Pro for unlimited stock and ETF screening.`}
                </p>
                <Link href="/pricing" className="mt-3.5 inline-block">
                  <Button size="sm" variant="gold" className="text-sm font-bold px-4">
                    {t("common.upgrade")}
                  </Button>
                </Link>
              </Card>
            )}

            {hiddenByAssetPlan > 0 && plan.id !== "premium" && plan.id !== "lifetime" && (
              <Card className="mt-3 border border-brand/30 bg-brand/5 p-4 text-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand mb-2">
                  <Lock className="h-4 w-4" />
                </span>
                <h3 className="text-xs font-bold text-ink">
                  {lang === "th"
                    ? `มีสินทรัพย์อีก ${hiddenByAssetPlan} รายการที่อยู่ในแพ็กเกจสูงกว่า`
                    : `${hiddenByAssetPlan} additional assets are available on higher tiers`}
                </h3>
                <p className="mx-auto mt-0.5 max-w-md text-xs text-muted">
                  {lang === "th"
                    ? plan.id === "free"
                      ? "อัปเกรดเป็น Pro เพื่อปลดล็อก ETF และกองทุนยอดนิยม หรือ Premium สำหรับ Crypto/Futures"
                      : "อัปเกรดเป็น Premium หรือ Lifetime เพื่อปลดล็อก Crypto, Futures และสินทรัพย์ครบทุกประเภท"
                    : plan.id === "free"
                      ? "Upgrade to Pro for ETFs and funds, or Premium for Crypto/Futures."
                      : "Upgrade to Premium or Lifetime to unlock Crypto, Futures, and every asset class."}
                </p>
                <Link href="/pricing" className="mt-3 inline-block">
                  <Button size="sm" variant={nextAssetPlan === "premium" ? "gold" : "primary"} className="px-4 text-sm font-bold">
                    {t("common.upgrade")}
                  </Button>
                </Link>
              </Card>
            )}
          </div>
          </>
          )}
        </div>

        {/* COLUMNS 9-12: HIGH-DENSITY INTERACTIVE VALUATION SANDBOX */}
        <div className={`${viewMode === "pro" ? "hidden" : "lg:col-span-3"} space-y-4`}>
          <Card 
            id="valuation-sandbox"
            className="border-2 border-brand/60 bg-surface/50 backdrop-blur-md p-4 relative overflow-hidden shadow-glow-brand rounded-2xl flex flex-col justify-between scroll-mt-24"
          >
            {/* Header Badge */}
            <div className="absolute top-3 right-3">
              {isCustomSandbox ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/30">
                  Simulation
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-up/10 text-up border border-up/30">
                  Standard
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Title Widget */}
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Calculator className="h-5 w-5 text-brand" />
                <div>
                  <h3 className="font-display text-sm font-extrabold text-ink">
                    {lang === "th" ? "จำลองราคาเหมาะสม" : "Valuation Simulator"}
                  </h3>
                  <p className="text-xs text-muted leading-5">
                    {lang === "th"
                      ? "ลองปรับการเติบโตและความเสี่ยง เพื่อดูว่าราคาเหมาะสมเปลี่ยนอย่างไร"
                      : "Adjust growth and risk assumptions to see how fair value changes."}
                  </p>
                </div>
              </div>

              {/* Selected Asset Profile info */}
              <div className="flex items-center justify-between bg-elevate/30 p-2.5 rounded-xl border border-line/60">
                <div className="flex items-center gap-2">
                  <AssetLogo symbol={selectedStock.symbol} color={selectedStock.color} size="md" />
                  <div>
                    <h4 className="font-display font-extrabold text-sm text-ink leading-none">
                      {selectedStock.symbol}
                    </h4>
                    <span className="text-xs text-muted truncate max-w-[120px] block mt-0.5">
                      {lang === "th" ? selectedStock.name : selectedStock.enName}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted uppercase font-bold leading-none">
                    {lang === "th" ? "ราคาปัจจุบัน" : "Mkt Price"}
                  </div>
                  <div className="text-xs font-mono font-extrabold text-ink mt-1">
                    {formatPrice(selectedStock, selectedStock.price)}
                  </div>
                </div>
              </div>

              {/* Valuation simulated output */}
              {selectedStock.assetType === "INDEX" ? (
                <div className="p-4 bg-elevate/45 border border-line rounded-xl text-center space-y-1">
                  <BarChart3 className="mx-auto h-5 w-5 text-brand" />
                  <h4 className="text-xs font-bold text-ink">
                    {lang === "th" ? "ดัชนีใช้ดูภาพรวมตลาด" : "Index market benchmark"}
                  </h4>
                  <p className="text-xs text-muted leading-normal">
                    {lang === "th"
                      ? "ดัชนีไม่มีงบการเงินรายบริษัท จึงแสดงระดับดัชนีและการเปลี่ยนแปลงล่าสุดแทนการคำนวณ DCF"
                      : "Indices do not have company financial statements, so the page shows live index level and movement instead of DCF."}
                  </p>
                </div>
              ) : selectedStock.assetType === "FUND" || selectedStock.assetType === "US_FUND" ? (
                <div className="p-4 bg-elevate/45 border border-line rounded-xl text-center space-y-1">
                  <span className="text-xl">📊</span>
                  <h4 className="text-xs font-bold text-ink">
                    {lang === "th" ? "ไม่เปิดใช้งานการประเมิน DCF" : "DCF Simulation Disabled"}
                  </h4>
                  <p className="text-xs text-muted leading-normal">
                    {lang === "th"
                      ? "สินทรัพย์ประเภทกองทุนรวม มีราคาตามมูลค่าทรัพย์สินสุทธิ (NAV) อ้างอิงผลงานของกลุ่มหลักทรัพย์ภายในพอร์ต"
                      : "This asset is a mutual fund. Valuations are backed by net asset value (NAV) of underlying holdings."}
                  </p>
                </div>
              ) : selectedStock.assetType === "CRYPTO" || selectedStock.assetType === "FUTURES" ? (
                <div className="p-4 bg-elevate/45 border border-line rounded-xl text-center space-y-1">
                  <span className="text-xl">🪙</span>
                  <h4 className="text-xs font-bold text-ink">
                    {lang === "th" ? "ไม่มีโมเดลจำลอง DCF" : "DCF Simulation N/A"}
                  </h4>
                  <p className="text-xs text-muted leading-normal">
                    {lang === "th"
                      ? "สินทรัพย์ทางเลือก เช่น คริปโต หรือตราสารฟิวเจอร์ส ขับเคลื่อนโดยราคากลางตลาดตามกลไกอุปสงค์และอุปทานของโลก"
                      : "Alternative assets (Crypto, Futures) are driven purely by market demand/supply without cashflow metrics."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Intrinsic Comparison Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 border border-line/80 bg-surface rounded-xl text-center">
                      <span className="text-xs uppercase font-bold text-muted">
                        {lang === "th" ? "มูลค่าที่เหมาะสม" : "Simulated Fair"}
                      </span>
                      <div className="text-sm font-mono font-black text-gold mt-1">
                        {simulatedValuation ? formatPrice(selectedStock, simulatedValuation.fairValue) : "—"}
                      </div>
                    </div>

                    <div className="p-2.5 border border-line/80 bg-surface rounded-xl text-center flex flex-col justify-center">
                      <span className="text-xs uppercase font-bold text-muted">
                        {lang === "th" ? "ส่วนลดราคา (MOS)" : "MOS discount"}
                      </span>
                      {simulatedValuation ? (
                        <div
                          className={`text-xs font-mono font-black mt-1 ${
                            simulatedValuation.marginOfSafety >= 0 ? "text-up" : "text-down"
                          }`}
                        >
                          {simulatedValuation.marginOfSafety >= 0 ? "+" : ""}
                          {simulatedValuation.marginOfSafety.toFixed(1)}%
                        </div>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  {/* Verdict Glowing Badge */}
                  {simulatedValuation && (
                    <div
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        simulatedValuation.verdict === "undervalued"
                          ? "bg-up/5 border-up/40 text-up shadow-glow-up"
                          : simulatedValuation.verdict === "overvalued"
                          ? "bg-down/5 border-down/40 text-down shadow-glow-down"
                          : "bg-elevate border-line text-muted"
                      }`}
                    >
                      <div className="text-xs uppercase font-bold tracking-wider leading-none">
                        {lang === "th" ? "คำแนะนำสมมติฐาน" : "Simulated Verdict"}
                      </div>
                      <div className="text-xs font-black uppercase mt-1 leading-none">
                        {t(`verdict.${simulatedValuation.verdict}`)}
                      </div>
                    </div>
                  )}

                  {/* Sliders Container */}
                  <div className="space-y-3.5 border-t border-line/50 pt-3">
                    {/* Beginner Quick Scenarios */}
                    {viewMode === "beginner" && (
                      <div className="space-y-1.5 pb-2.5 border-b border-line/30">
                        <label className="block text-xs font-bold uppercase text-muted">
                          {lang === "th" ? "สถานการณ์ตัวอย่าง" : "Quick scenarios"}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setSandboxGrowth(0.01);
                              setSandboxDiscount(0.12);
                              setSandboxTerminal(0.015);
                              setIsCustomSandbox(true);
                            }}
                            className="rounded-lg border border-line bg-surface px-1.5 py-2 text-center text-xs font-bold text-muted transition hover:bg-elevate"
                            title={lang === "th" ? "เติบโตช้า / คาดหวังปานกลาง" : "Conservative"}
                          >
                            {lang === "th" ? "โตช้า" : "Conservative"}
                          </button>
                          <button
                            onClick={() => {
                              setSandboxGrowth(selectedStock.financials.growthRate);
                              setSandboxDiscount(0.09);
                              setSandboxTerminal(0.025);
                              setIsCustomSandbox(true);
                            }}
                            className="rounded-lg border border-brand/40 bg-brand-soft px-1.5 py-2 text-center text-xs font-bold text-brand transition hover:brightness-110"
                            title={lang === "th" ? "ใช้สมมติฐานสถิติเดิมของบริษัท" : "Normal"}
                          >
                            {lang === "th" ? "กรณีปกติ" : "Normal"}
                          </button>
                          <button
                            onClick={() => {
                              setSandboxGrowth(selectedStock.financials.growthRate + 0.04);
                              setSandboxDiscount(0.07);
                              setSandboxTerminal(0.03);
                              setIsCustomSandbox(true);
                            }}
                            className="rounded-lg border border-line bg-surface px-1.5 py-2 text-center text-xs font-bold text-muted transition hover:bg-elevate"
                            title={lang === "th" ? "เติบโตสูง / คาดหวังกำไรมั่นคง" : "Optimistic"}
                          >
                            {lang === "th" ? "โตเร็ว" : "Optimistic"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Forecast Growth Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-muted">
                        <span>
                          {viewMode === "beginner"
                            ? (lang === "th" ? "คาดการณ์อัตราการเติบโตธุรกิจ (Growth Rate)" : "Estimated Growth Rate (g)")
                            : (lang === "th" ? "อัตราการเติบโต 5 ปีแรก (g)" : "Growth Rate (g)")}
                        </span>
                        <span className="text-brand font-mono font-extrabold">
                          {(sandboxGrowth * 100).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="40"
                        step="0.5"
                        className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                        value={sandboxGrowth * 100}
                        onChange={(e) => {
                          setSandboxGrowth(parseFloat(e.target.value) / 100);
                          setIsCustomSandbox(true);
                        }}
                      />
                      {viewMode === "beginner" && (
                        <span className="block text-xs leading-snug text-muted">
                          {lang === "th" ? "ธุรกิจที่ขายได้มากขึ้นหรือขยายสาขาได้ดี มักใช้ค่านี้สูงขึ้น" : "Higher values imply faster business expansion."}
                        </span>
                      )}
                    </div>

                    {/* Discount Rate Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-muted">
                        <span>
                          {viewMode === "beginner"
                            ? (lang === "th" ? "ระดับความต้องการผลตอบแทน (WACC)" : "Discount Rate (WACC)")
                            : (lang === "th" ? "อัตราคิดลด (WACC)" : "Discount Rate (WACC)")}
                        </span>
                        <span className="text-brand font-mono font-extrabold">
                          {(sandboxDiscount * 100).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        step="0.5"
                        className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                        value={sandboxDiscount * 100}
                        onChange={(e) => {
                          setSandboxDiscount(parseFloat(e.target.value) / 100);
                          setIsCustomSandbox(true);
                        }}
                      />
                      {viewMode === "beginner" && (
                        <span className="block text-xs leading-snug text-muted">
                          {lang === "th" ? "ธุรกิจที่เสี่ยงสูงหรือแข่งขันรุนแรง ควรตั้งค่านี้สูงขึ้น" : "Higher discount rates account for higher investment risks."}
                        </span>
                      )}
                    </div>

                    {/* Terminal Growth Rate Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-muted">
                        <span>
                          {viewMode === "beginner"
                            ? (lang === "th" ? "อัตราการโตคงที่ระยะยาว (Terminal Growth)" : "Long-term Constant Growth")
                            : (lang === "th" ? "โตคงที่ระยะยาว (Terminal g)" : "Terminal Growth")}
                        </span>
                        <span className="text-brand font-mono font-extrabold">
                          {(sandboxTerminal * 100).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-brand"
                        value={sandboxTerminal * 100}
                        onChange={(e) => {
                          setSandboxTerminal(parseFloat(e.target.value) / 100);
                          setIsCustomSandbox(true);
                        }}
                      />
                      {viewMode === "beginner" && (
                        <span className="block text-xs leading-snug text-muted">
                          {lang === "th" ? "อัตราเติบโตหลังธุรกิจเริ่มอิ่มตัว โดยทั่วไปควรตั้งแบบระมัดระวัง" : "Growth rate after maturity; keep this assumption conservative."}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick breakdown notes */}
                  <div className="text-xs text-muted leading-relaxed bg-surface/30 p-2.5 rounded-xl border border-line/45 flex items-start gap-1.5">
                    <Info className="h-3 w-3 text-brand shrink-0 mt-0.5" />
                    <span>
                      {lang === "th"
                        ? `ระบบผสม DCF 60% (${
                            simulatedValuation?.dcf.intrinsicValue.toFixed(1) || 0
                          } บาท) กับ Graham 40% (${
                            simulatedValuation?.grahamNumber.toFixed(1) || 0
                          } บาท) เพื่อไม่พึ่งโมเดลใดโมเดลหนึ่งมากเกินไป`
                        : `Formula combines 60% DCF (${
                            simulatedValuation?.dcf.intrinsicValue.toFixed(1) || 0
                          }) and 40% Graham Number (${
                            simulatedValuation?.grahamNumber.toFixed(1) || 0
                          }) to balance earnings flow.`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox Operations */}
            {isCustomSandbox && (
              <div className="flex gap-2 mt-4 border-t border-line/50 pt-3">
                <button
                  onClick={() => {
                    setSandboxGrowth(selectedStock.financials.growthRate);
                    setSandboxDiscount(0.09);
                    setSandboxTerminal(0.025);
                    setIsCustomSandbox(false);
                  }}
                  className="w-full py-1.5 text-xs font-bold rounded-xl border border-line bg-surface hover:bg-elevate text-muted hover:text-ink transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  {lang === "th" ? "คืนค่าเริ่มต้น" : "Reset Simulation"}
                </button>
              </div>
            )}
          </Card>

          {/* SIDEBAR: EXTRA OPPORTUNITIES LIST */}
          <Card className="border border-line p-4">
            <h4 className="font-display font-extrabold text-xs text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              {lang === "th" ? "โอกาสปันผลสูงแนะนำ" : "High-Dividend Leaders"}
            </h4>
            <div className="divide-y divide-line/60">
              {allStocks.map((s) => ({ s, v: computeValuation(s, defaultDCFParams(s)) }))
                .sort((a, b) => b.v.ratios.dividendYield - a.v.ratios.dividendYield)
                .slice(0, 3)
                .map((item) => {
                  const s = item.s;
                  const v = item.v;
                  const disp = lang === "th" ? s.name : s.enName || s.name;
                  return (
                    <button
                      key={s.symbol}
                      onClick={() => handleSelectStockForSandbox(s.symbol)}
                      className="w-full flex items-center justify-between py-2 text-left hover:bg-elevate/25 transition group rounded-lg px-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <AssetLogo symbol={s.symbol} color={s.color} size="sm" />
                        <div className="min-w-0">
                          <span className="font-display font-extrabold text-xs text-ink group-hover:text-brand transition block leading-tight">
                            {s.symbol}
                          </span>
                          <span className="text-xs text-muted truncate max-w-[90px] block mt-0.5">
                            {disp}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-ink">
                          {formatPrice(s, s.price)}
                        </div>
                        <div className="text-xs font-bold text-gold mt-0.5">
                          Yield: {v.ratios.dividendYield.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </Card>
        </div>
      </div>

      {/* SEO GUIDE CONTENT */}
      <section className="space-y-6 border-t border-line/60 pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="chip border-brand/35 bg-brand/10 text-brand text-xs font-bold">
            <Filter className="h-3.5 w-3.5" /> {lang === "th" ? "คู่มือใช้โปรแกรมคัดกรองหุ้น" : "Stock screener guide"}
          </span>
          <h2 className="mt-3 font-display text-2xl font-black leading-tight text-ink sm:text-3xl">
            {lang === "th" ? "Stock Screener สำหรับหาหุ้นพื้นฐานดี หุ้น Undervalue และหุ้นปันผลสูง" : "Stock Screener for quality, undervalued, and dividend stocks"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">
            {lang === "th"
              ? "หน้า Stocks ของ ValuStock ถูกออกแบบให้เป็นโปรแกรมคัดกรองหุ้นสำหรับนักลงทุนไทยที่ต้องการตอบคำถามว่า หุ้นตัวไหนดี หุ้นไทยถูกหรือแพง หุ้นตัวไหนมี Margin of Safety และหุ้นปันผลสูงตัวไหนยังมีพื้นฐานรองรับ"
              : "ValuStock Stocks helps investors screen for quality stocks, undervalued opportunities, dividend leaders, and assets trading with a visible Margin of Safety."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {screenerGuides.map((item, idx) => (
            <Card key={item.title} className="border border-line bg-surface/25 p-5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 font-mono text-xs font-black text-brand">
                {idx + 1}
              </span>
              <h3 className="mt-4 font-display text-sm font-bold leading-snug text-ink">{item.title}</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 border-t border-line/60 pt-8 md:grid-cols-[1fr_0.9fr]">
        <Card className="border border-line bg-surface/25 p-5">
          <span className="chip border-up/30 bg-up/10 text-up text-xs font-bold">
            <Shield className="h-3.5 w-3.5" /> {lang === "th" ? "วิธีอ่านผลลัพธ์" : "Reading screener results"}
          </span>
          <h2 className="mt-3 font-display text-xl font-black text-ink">
            {lang === "th" ? "อย่าเลือกหุ้นจากตัวเลขเดียว" : "Do not choose stocks from one metric"}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
            {lang === "th"
              ? "หุ้นที่มี MOS สูงหรือ P/E ต่ำอาจดูน่าสนใจ แต่ควรตรวจหลายมิติร่วมกัน ทั้งคุณภาพกำไร หนี้สิน กระแสเงินสด ปันผล และความสามารถแข่งขันของธุรกิจ เพื่อแยกหุ้นพื้นฐานดีออกจาก value trap"
              : "High MOS or low P/E can look attractive, but investors should check earnings quality, leverage, cash flow, dividends, and business durability to avoid value traps."}
          </p>
          <div className="mt-4 grid gap-2 text-xs font-bold text-muted">
            {[
              lang === "th" ? "MOS สูง: ตรวจว่าสมมติฐาน DCF สมเหตุสมผลหรือไม่" : "High MOS: verify that DCF assumptions are realistic",
              lang === "th" ? "P/E ต่ำ: ตรวจว่ากำไรเป็นกำไรปกติหรือกำไรพิเศษ" : "Low P/E: check whether earnings are recurring",
              lang === "th" ? "Yield สูง: ตรวจ payout ratio และ free cash flow" : "High yield: check payout ratio and free cash flow",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-line bg-surface/25 p-5">
          <h2 className="font-display text-xl font-black text-ink">
            {lang === "th" ? "เครื่องมือและหน้าที่เกี่ยวข้อง" : "Related tools and guides"}
          </h2>
          <div className="mt-4 space-y-2">
            {[
              { href: "/undervalued-stocks", label: lang === "th" ? "หุ้น undervalue จากระบบคัดกรอง" : "Undervalued stocks" },
              { href: "/dividend-stocks", label: lang === "th" ? "หุ้นปันผลสูงสำหรับลงทุนระยะยาว" : "High dividend stocks" },
              { href: "/dcf-calculator", label: lang === "th" ? "DCF Calculator สำหรับคำนวณราคาเหมาะสม" : "DCF Calculator" },
              { href: "/intrinsic-value-calculator", label: lang === "th" ? "Intrinsic Value Calculator และ Graham Number" : "Intrinsic Value Calculator" },
              { href: "/stock-valuation", label: lang === "th" ? "คู่มือวิธีประเมินมูลค่าหุ้น" : "Stock valuation guide" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2.5 text-xs font-bold text-muted transition hover:border-brand/40 hover:text-brand"
              >
                {item.label}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4 border-t border-line/60 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold">
            <Info className="h-3.5 w-3.5" /> FAQ
          </span>
          <h2 className="mt-3 font-display text-2xl font-black text-ink">
            {lang === "th" ? "คำถามที่พบบ่อยเกี่ยวกับโปรแกรมคัดกรองหุ้น" : "Stock Screener FAQ"}
          </h2>
        </div>

        <div className="mx-auto max-w-4xl space-y-3">
          {faqItems.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-line bg-bg/40">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-ink transition hover:bg-elevate/45"
                >
                  <span>{faq.q}</span>
                  <span className="shrink-0 font-mono text-xs text-brand">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-line/30 px-5 pb-4 pt-3 text-xs font-medium leading-relaxed text-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 💳 Premium CSV Export Paywall Modal */}
      <Modal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={lang === "th" ? "คุณสมบัติพรีเมียมเฉพาะตัว" : "Premium Feature Lock"}
      >
        <LockedCard
          required="premium"
          title={lang === "th" ? "ระบบส่งออกข้อมูลสกรีนเนอร์ (CSV)" : "Screener Data Export (CSV)"}
          desc={
            lang === "th"
              ? "ส่งออกรายชื่อและผลลัพธ์การคัดกรองหุ้นตามสกรีนเนอร์ที่คุณตั้งค่าไว้ทั้งหมดเป็นไฟล์ CSV เพื่อนำไปใช้ต่อในโปรแกรมเทรดหรือโมเดลวิเคราะห์ส่วนตัว — ปลดล็อคเต็มรูปแบบด้วยแพ็กเกจพรีเมียม"
              : "Download all filtered, sorted, and screened equity listings as raw CSV flat-files. Unlock with the Premium Plan."
          }
        />
      </Modal>
    </div>
  );
}

// ================== GORGEOUS CUSTOM SVG SPARKLINE COMPONENT ==================
function Sparkline({ history, symbol }: { history: number[]; symbol: string }) {
  if (!history || history.length === 0) return null;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min === 0 ? 1 : max - min;
  const width = 80;
  const height = 24;

  const points = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - 2 - ((val - min) / range) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = history[history.length - 1] >= history[0];
  const strokeColor = isUp ? "#10b981" : "#ef4444"; // Emerald-500 or Red-500
  const gradId = `spark-grad-${symbol}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none pointer-events-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradId})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Dynamic Endpoint Marker */}
      <circle
        cx={width}
        cy={height - 2 - ((history[history.length - 1] - min) / range) * (height - 4)}
        r="2"
        fill={strokeColor}
      />
    </svg>
  );
}

function MobileMetric({
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
    <div className="min-w-0 rounded-xl border border-line bg-bg/55 px-3 py-2.5">
      <span className="block text-xs font-bold leading-snug text-muted [overflow-wrap:anywhere]">
        {label}
      </span>
      <span
        className={`mt-1 block font-mono text-xs font-bold [overflow-wrap:anywhere] ${
          accent ? "text-gold" : up === false ? "text-down" : up ? "text-up" : "text-ink"
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: MetricTone;
}) {
  const toneClass =
    tone === "up"
      ? "text-up"
      : tone === "down"
        ? "text-down"
        : tone === "gold"
          ? "text-gold"
          : tone === "brand"
            ? "text-brand"
            : "text-ink";

  return (
    <div className="flex min-w-[88px] flex-1 items-center justify-between gap-2 rounded-lg border border-line bg-bg/55 px-2.5 py-2">
      <span className="whitespace-nowrap text-xs font-black uppercase tracking-wide text-muted">{label}</span>
      <span className={`whitespace-nowrap font-mono text-xs font-black ${toneClass}`} title={value}>
        {value}
      </span>
    </div>
  );
}

function ValuationMosBar({
  mos,
  disabledLabel,
  compact = false,
}: {
  mos: number;
  disabledLabel?: string;
  compact?: boolean;
}) {
  if (disabledLabel) {
    return (
      <div className={compact ? "mt-3" : "w-full min-w-[150px]"}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wide text-muted">MOS</span>
          <span className="font-mono text-xs font-black text-muted">{disabledLabel}</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-line">
          <div className="h-full w-1/2 rounded-full bg-muted/40" />
        </div>
      </div>
    );
  }

  const positive = mos >= 0;
  const width = Math.min(Math.max(mos + 50, 0), 100);

  return (
    <div className={compact ? "mt-3" : "w-full min-w-[150px]"}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wide text-muted">MOS</span>
        <span className={`font-mono text-xs font-black ${positive ? "text-up" : "text-down"}`}>
          {positive ? "+" : ""}
          {num(mos, 0)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${positive ? "bg-up" : "bg-down"}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function CompactValuationMosBar({
  mos,
  disabledLabel,
}: {
  mos: number;
  disabledLabel?: string;
}) {
  const positive = mos >= 0;
  const width = disabledLabel ? 50 : Math.min(Math.max(mos + 50, 0), 100);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between gap-2 leading-none">
        <span className="text-[9px] font-black uppercase tracking-wide leading-none text-muted">MOS</span>
        <span className={`font-mono text-[10px] font-black leading-none ${disabledLabel ? "text-muted" : positive ? "text-up" : "text-down"}`}>
          {disabledLabel || `${positive ? "+" : ""}${num(mos, 0)}%`}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${disabledLabel ? "bg-muted/40" : positive ? "bg-up" : "bg-down"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
