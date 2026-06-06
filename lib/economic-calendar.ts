/**
 * Economic Calendar Multi-Scraper
 *
 * Fetches calendar data from investing.com using Playwright.
 * Supports 6 calendar types: economic, holiday, earnings, dividends, stock_split, ipo
 * and 5 time filters: yesterday, today, tomorrow, thisWeek, nextWeek.
 */

import { chromium, type Browser, type Page } from "playwright";
import type { CalendarEvent, CalendarType, FetchCalendarParams, TimeFilter } from "./economic-calendar-types";

// Re-export for convenience
export type { CalendarEvent, CalendarType, FetchCalendarParams, TimeFilter };
export { CALENDAR_TYPES, TIME_FILTERS, COUNTRY_IDS, TIMEZONE_IDS } from "./economic-calendar-types";

// ── Constants ───────────────────────────────────────────────────────────────

const BASE_URL_TH = "https://th.investing.com";
const BASE_URL_EN = "https://www.investing.com";
const NAVIGATION_TIMEOUT = 45_000;
const DATA_WAIT_TIMEOUT = 30_000;

// dividends and stock_split are blocked by Cloudflare on th.investing.com
// so we use the English site for those
function getBaseUrl(calendarType: CalendarType): string {
  if (calendarType === "dividends" || calendarType === "stock_split") {
    return BASE_URL_EN;
  }
  return BASE_URL_TH;
}

// ── Browser management ──────────────────────────────────────────────────────

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser;
  _browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
      "--disable-gpu", "--disable-extensions", "--disable-background-networking",
      "--disable-sync", "--disable-translate", "--disable-default-apps",
      "--mute-audio", "--hide-scrollbars"],
  });
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}

// ── URL builder ─────────────────────────────────────────────────────────────

const CALENDAR_PATHS: Record<CalendarType, string> = {
  economic: "/economic-calendar/",
  holiday: "/holiday-calendar/",
  earnings: "/earnings-calendar/",
  dividends: "/dividends-calendar/",
  stock_split: "/stock-split-calendar/",
  ipo: "/ipo-calendar/",
};

function buildUrl(calendarType: CalendarType, timeFilter?: TimeFilter): string {
  const url = new URL(CALENDAR_PATHS[calendarType], getBaseUrl(calendarType));
  if (timeFilter) url.searchParams.set("currentTab", timeFilter);
  return url.toString();
}

// ── Resource blocking ───────────────────────────────────────────────────────

async function blockUnnecessary(page: Page) {
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "media", "font"].includes(type)) route.abort();
    else route.continue();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DOM EXTRACTION SCRIPTS (pure JS strings for page.evaluate)
// ═══════════════════════════════════════════════════════════════════════════

const ECONOMIC_SCRIPT = `(function() {
  var THAI_MONTHS = {
    "\\u0E21\\u0E01\\u0E23\\u0E32\\u0E04\\u0E21":1,"\\u0E01\\u0E38\\u0E21\\u0E20\\u0E32\\u0E1E\\u0E31\\u0E19\\u0E18\\u0E4C":2,
    "\\u0E21\\u0E35\\u0E19\\u0E32\\u0E04\\u0E21":3,"\\u0E40\\u0E21\\u0E29\\u0E32\\u0E22\\u0E19":4,
    "\\u0E1E\\u0E24\\u0E29\\u0E20\\u0E32\\u0E04\\u0E21":5,"\\u0E21\\u0E34\\u0E16\\u0E38\\u0E19\\u0E32\\u0E22\\u0E19":6,
    "\\u0E01\\u0E23\\u0E01\\u0E0E\\u0E32\\u0E04\\u0E21":7,"\\u0E2A\\u0E34\\u0E07\\u0E2B\\u0E32\\u0E04\\u0E21":8,
    "\\u0E01\\u0E31\\u0E19\\u0E22\\u0E32\\u0E22\\u0E19":9,"\\u0E15\\u0E38\\u0E25\\u0E32\\u0E04\\u0E21":10,
    "\\u0E1E\\u0E24\\u0E28\\u0E08\\u0E34\\u0E01\\u0E32\\u0E22\\u0E19":11,"\\u0E18\\u0E31\\u0E19\\u0E27\\u0E32\\u0E04\\u0E21":12
  };
  function parseThaiDate(text) {
    var m = text.match(/(\\d{1,2})\\s+(\\S+)\\s+(\\d{4})/);
    if (!m) return 0;
    var month = THAI_MONTHS[m[2]] || 0;
    if (month===0) return 0;
    return Math.floor(Date.UTC(parseInt(m[3],10), month-1, parseInt(m[1],10)) / 1000);
  }
  function cleanName(raw) {
    return raw.replace(/\\s*Act\\s*:.*$/i,"").replace(/\\s*Cons\\s*:.*$/i,"")
      .replace(/\\s*Consensus\\s*:.*$/i,"").replace(/\\s*Forecast\\s*:.*$/i,"")
      .replace(/\\s*Prev\\s*:.*$/i,"").replace(/\\s*Previous\\s*:.*$/i,"")
      .replace(/\\s*\\u0E23\\u0E32\\u0E04\\u0E32\\u0E01\\u0E48\\u0E2D\\u0E19\\u0E2B\\u0E19\\u0E49\\u0E32\\s*:.*$/,"")
      .replace(/\\s*\\u0E04\\u0E32\\u0E14\\u0E01\\u0E32\\u0E23\\u0E13\\u0E4C\\s*:.*$/,"")
      .replace(/\\s*\\u0E04\\u0E23\\u0E31\\u0E49\\u0E07\\u0E01\\u0E48\\u0E2D\\u0E19\\s*:.*$/,"").trim();
  }
  var events=[], tables=document.querySelectorAll("table");
  if (!tables.length) return events;
  var rows=tables[0].querySelectorAll("tr"), currentDay=0;
  for (var i=0;i<rows.length;i++) {
    var row=rows[i];
    if (row.querySelector("th")) continue;
    if (!row.id) {
      var td=row.querySelector("td");
      if (td) { var ts=parseThaiDate((td.textContent||"").trim()); if (ts>0) currentDay=ts; }
      continue;
    }
    var cells=row.querySelectorAll("td");
    if (cells.length<6) continue;
    var time=(cells[1]&&cells[1].textContent||"").trim();
    var flag=cells[2]&&cells[2].querySelector('[role="img"]');
    var country=(flag&&(flag.getAttribute("aria-label")||flag.getAttribute("title")))||"";
    var currency=(cells[2]&&cells[2].textContent||"").trim();
    var rawName=(cells[3]&&cells[3].textContent||"").trim();
    var name=cleanName(rawName);
    var importance=2, impCell=cells[4];
    if (impCell) {
      var icons=impCell.querySelectorAll('[class*="BullishIcon"],[class*="bullishIcon"],i,svg,[class*="star"]');
      if (icons.length>=3) importance=3; else if (icons.length===2) importance=2; else if (icons.length===1) importance=1;
      var impText=(impCell.textContent||"").trim();
      if (impText==="\\u0E27\\u0E31\\u0E19\\u0E2B\\u0E22\\u0E38\\u0E14"||impText==="Holiday") importance=1;
    }
    var actual=(cells[5]&&cells[5].textContent||"").trim();
    var forecast=(cells[6]&&cells[6].textContent||"").trim();
    var previous=(cells[7]&&cells[7].textContent||"").trim();
    if (row.id && name && currency) {
      events.push({eventId:row.id,date:currentDay,time:time,country:country,currency:currency,
        importance:importance>=3?3:importance>=2?2:1,name:name,
        actual:actual||null,forecast:forecast||null,previous:previous||null});
    }
  }
  return events;
})()`;

const HOLIDAY_SCRIPT = `(function() {
  var MONTHS={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  function parseDate(text) {
    var parts=text.split(" ");
    if (parts.length<3) return 0;
    var month=MONTHS[parts[0]];
    if (month===undefined) return 0;
    var day=parseInt(parts[1].replace(",",""),10);
    var year=parseInt(parts[2],10);
    return Math.floor(Date.UTC(year,month,day)/1000);
  }
  var events=[], tables=document.querySelectorAll("table");
  if (!tables.length) return events;
  var rows=tables[0].querySelectorAll("tr"), currentDay=0, lastDateStr="";
  for (var i=0;i<rows.length;i++) {
    var row=rows[i];
    if (row.querySelector("th")) continue;
    var cells=row.querySelectorAll("td");
    if (cells.length<4) continue;
    var dateStr=(cells[0]&&cells[0].textContent||"").trim();
    if (dateStr) { lastDateStr=dateStr; currentDay=parseDate(dateStr); }
    if (currentDay===0) continue;
    var country=(cells[1]&&cells[1].textContent||"").trim();
    var exchange=(cells[2]&&cells[2].textContent||"").trim();
    var holidayName=(cells[3]&&cells[3].textContent||"").trim();
    if (country && holidayName) {
      var eid = "hol-" + country.replace(/\\s+/g,"_") + "-" + exchange.replace(/\\s+/g,"_") + "-" + holidayName.replace(/\\s+/g,"_") + "-" + currentDay;
      events.push({eventId:eid,date:currentDay,time:"",country:country,currency:"",
        importance:1,name:holidayName,exchange:exchange,holidayName:holidayName});
    }
  }
  return events;
})()`;

const EARNINGS_SCRIPT = `(function() {
  var THAI_MONTHS = {
    "\\u0E21\\u0E01\\u0E23\\u0E32\\u0E04\\u0E21":1,"\\u0E01\\u0E38\\u0E21\\u0E20\\u0E32\\u0E1E\\u0E31\\u0E19\\u0E18\\u0E4C":2,
    "\\u0E21\\u0E35\\u0E19\\u0E32\\u0E04\\u0E21":3,"\\u0E40\\u0E21\\u0E29\\u0E32\\u0E22\\u0E19":4,
    "\\u0E1E\\u0E24\\u0E29\\u0E20\\u0E32\\u0E04\\u0E21":5,"\\u0E21\\u0E34\\u0E16\\u0E38\\u0E19\\u0E32\\u0E22\\u0E19":6,
    "\\u0E01\\u0E23\\u0E01\\u0E0E\\u0E32\\u0E04\\u0E21":7,"\\u0E2A\\u0E34\\u0E07\\u0E2B\\u0E32\\u0E04\\u0E21":8,
    "\\u0E01\\u0E31\\u0E19\\u0E22\\u0E32\\u0E22\\u0E19":9,"\\u0E15\\u0E38\\u0E25\\u0E32\\u0E04\\u0E21":10,
    "\\u0E1E\\u0E24\\u0E28\\u0E08\\u0E34\\u0E01\\u0E32\\u0E22\\u0E19":11,"\\u0E18\\u0E31\\u0E19\\u0E27\\u0E32\\u0E04\\u0E21":12
  };
  function parseThaiDate(text) {
    var m = text.match(/(\\d{1,2})\\s+(\\S+)\\s+(\\d{4})/);
    if (!m) return 0;
    var month = THAI_MONTHS[m[2]] || 0;
    if (month===0) return 0;
    return Math.floor(Date.UTC(parseInt(m[3],10), month-1, parseInt(m[1],10)) / 1000);
  }
  var events=[], tables=document.querySelectorAll("table");
  if (!tables.length) return events;
  var rows=tables[0].querySelectorAll("tr"), currentDay=0;
  for (var i=0;i<rows.length;i++) {
    var row=rows[i];
    if (row.querySelector("th")) continue;
    var cells=row.querySelectorAll("td");
    if (cells.length<8) continue;
    // Check if this is a date separator row (cells[1] contains Thai date with "วัน")
    var cell1Text=(cells[1]&&cells[1].textContent||"").trim();
    if (cell1Text.indexOf("\\u0E27\\u0E31\\u0E19")>=0 || cell1Text.indexOf("Monday")>=0 || cell1Text.indexOf("Mon")>=0) {
      var ts=parseThaiDate(cell1Text);
      if (ts>0) currentDay=ts;
      continue;
    }
    if (currentDay===0) continue;
    // Data row: [logo, company, eps, epsForecast, revenue, revenueForecast, marketCap, time, lastPrice, afterHours, adjEPS, ...]
    var company=cell1Text;
    var eps=(cells[2]&&cells[2].textContent||"").trim();
    var epsForecast=(cells[3]&&cells[3].textContent||"").trim();
    var revenue=(cells[4]&&cells[4].textContent||"").trim();
    var revenueForecast=(cells[5]&&cells[5].textContent||"").trim();
    var marketCap=(cells[6]&&cells[6].textContent||"").trim();
    var evTime=(cells[7]&&cells[7].textContent||"").trim();
    var lastPrice=(cells[8]&&cells[8].textContent||"").trim();
    if (company && company.length>3 && company.indexOf("\\u0E27\\u0E31\\u0E19")<0) {
      var eid2 = "earn-" + company.replace(/[^a-zA-Z0-9]/g,"_").substring(0,60) + "-" + currentDay;
      events.push({eventId:eid2,date:currentDay,time:evTime,country:"",currency:"",
        importance:3,name:company.split("(")[0].trim(),
        eps:eps||null,epsForecast:epsForecast||null,revenue:revenue||null,
        revenueForecast:revenueForecast||null,marketCap:marketCap||null,lastPrice:lastPrice||null});
    }
  }
  return events;
})()`;

const DIVIDENDS_SCRIPT = `(function() {
  var MONTHS={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  function parseDate(text) {
    var parts=text.split(" ");
    if (parts.length<3) return 0;
    var month=MONTHS[parts[0]];
    if (month===undefined) return 0;
    var day=parseInt(parts[1].replace(",",""),10);
    var year=parseInt(parts[2],10);
    return Math.floor(Date.UTC(year,month,day)/1000);
  }
  var events=[], tables=document.querySelectorAll("table");
  // Dividends table is usually tables[1]
  var targetTable=null;
  for (var t=0;t<tables.length;t++) {
    var rows=tables[t].querySelectorAll("tr");
    if (rows.length>20) {
      var h=rows[0]?.querySelectorAll("th,td");
      if (h&&h.length>=6) { targetTable=tables[t]; break; }
    }
  }
  if (!targetTable) return events;
  var rows=targetTable.querySelectorAll("tr"), currentDay=0, lastDateStr="";
  for (var i=1;i<rows.length;i++) {
    var row=rows[i];
    var cells=row.querySelectorAll("td");
    if (cells.length<6) continue;
    var company=(cells[1]&&cells[1].textContent||"").trim();
    var exDateStr=(cells[2]&&cells[2].textContent||"").trim();
    var dividend=(cells[3]&&cells[3].textContent||"").trim();
    var divType=(cells[4]&&cells[4].textContent||"").trim();
    var payDateStr=(cells[5]&&cells[5].textContent||"").trim();
    var divYield=(cells[6]&&cells[6].textContent||"").trim();
    if (exDateStr) { lastDateStr=exDateStr; currentDay=parseDate(exDateStr); }
    if (currentDay===0) continue;
    if (company && company.length>2 && (dividend || exDateStr)) {
      var eid3 = "div-" + company.replace(/[^a-zA-Z0-9]/g,"_").substring(0,60) + "-" + exDateStr.replace(/\\s/g,"_") + "-" + dividend.replace(/\\s/g,"_");
      events.push({eventId:eid3,date:currentDay,time:"",country:"",currency:"",
        importance:2,name:company.split("(")[0].trim(),
        exDividendDate:exDateStr,dividend:dividend,dividendType:divType,
        paymentDate:payDateStr,dividendYield:divYield||null});
    }
  }
  return events;
})()`;

const STOCK_SPLIT_SCRIPT = `(function() {
  var MONTHS={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  function parseDate(text) {
    var parts=text.split(" ");
    if (parts.length<3) return 0;
    var month=MONTHS[parts[0]];
    if (month===undefined) return 0;
    var day=parseInt(parts[1].replace(",",""),10);
    var year=parseInt(parts[2],10);
    return Math.floor(Date.UTC(year,month,day)/1000);
  }
  var events=[], tables=document.querySelectorAll("table");
  var targetTable=null;
  for (var t=0;t<tables.length;t++) {
    var rows=tables[t].querySelectorAll("tr");
    if (rows.length>20) {
      var h=rows[0]?.querySelectorAll("th,td");
      if (h&&h.length>=3) { targetTable=tables[t]; break; }
    }
  }
  if (!targetTable) return events;
  var rows=targetTable.querySelectorAll("tr"), currentDay=0, lastDateStr="";
  for (var i=1;i<rows.length;i++) {
    var row=rows[i];
    var cells=row.querySelectorAll("td");
    if (cells.length<3) continue;
    var dateStr=(cells[0]&&cells[0].textContent||"").trim();
    if (dateStr) { lastDateStr=dateStr; currentDay=parseDate(dateStr); }
    if (currentDay===0) continue;
    var company=(cells[1]&&cells[1].textContent||"").trim();
    var ratio=(cells[2]&&cells[2].textContent||"").trim();
    if (company && company.length>2) {
      var eid4 = "split-" + company.replace(/[^a-zA-Z0-9]/g,"_").substring(0,60) + "-" + currentDay + "-" + ratio.replace(/\\s/g,"_");
      events.push({eventId:eid4,date:currentDay,time:"",country:"",currency:"",
        importance:2,name:company.split("(")[0].trim(),splitRatio:ratio});
    }
  }
  return events;
})()`;

const IPO_SCRIPT = `(function() {
  var MONTHS={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  function parseDate(text) {
    var parts=text.split(" ");
    if (parts.length<3) return 0;
    var month=MONTHS[parts[0]];
    if (month===undefined) return 0;
    var day=parseInt(parts[1].replace(",",""),10);
    var year=parseInt(parts[2],10);
    return Math.floor(Date.UTC(year,month,day)/1000);
  }
  var events=[], tables=document.querySelectorAll("table");
  var targetTable=null;
  for (var t=0;t<tables.length;t++) {
    var rows=tables[t].querySelectorAll("tr");
    if (rows.length>5) {
      var h=rows[0]?.querySelectorAll("th,td");
      if (h&&h.length>=5) { targetTable=tables[t]; break; }
    }
  }
  if (!targetTable) return events;
  var rows=targetTable.querySelectorAll("tr"), currentDay=0, lastDateStr="";
  for (var i=1;i<rows.length;i++) {
    var row=rows[i];
    var cells=row.querySelectorAll("td");
    if (cells.length<5) continue;
    var dateStr=(cells[0]&&cells[0].textContent||"").trim();
    if (dateStr) { lastDateStr=dateStr; currentDay=parseDate(dateStr); }
    if (currentDay===0) continue;
    var company=(cells[1]&&cells[1].textContent||"").trim();
    var exchange=(cells[2]&&cells[2].textContent||"").trim();
    var ipoValue=(cells[3]&&cells[3].textContent||"").trim();
    var ipoPrice=(cells[4]&&cells[4].textContent||"").trim();
    var lastPrice=(cells[5]&&cells[5].textContent||"").trim();
    if (company && company.length>2) {
      var eid5 = "ipo-" + company.replace(/[^a-zA-Z0-9]/g,"_").substring(0,60) + "-" + currentDay + "-" + exchange.replace(/\\s/g,"_");
      events.push({eventId:eid5,date:currentDay,time:"",country:"",currency:"",
        importance:2,name:company.split("(")[0].trim(),
        exchange:exchange,ipoValue:ipoValue||null,ipoPrice:ipoPrice||null,lastPrice:lastPrice||null});
    }
  }
  return events;
})()`;

// ── Script selection ────────────────────────────────────────────────────────

const SCRIPTS: Record<CalendarType, string> = {
  economic: ECONOMIC_SCRIPT,
  holiday: HOLIDAY_SCRIPT,
  earnings: EARNINGS_SCRIPT,
  dividends: DIVIDENDS_SCRIPT,
  stock_split: STOCK_SPLIT_SCRIPT,
  ipo: IPO_SCRIPT,
};

// ── Wait selectors ──────────────────────────────────────────────────────────

const WAIT_SELECTORS: Record<CalendarType, string> = {
  economic: 'tr[id][class*="datatable-v2_row"]',
  holiday: "table tr td",
  earnings: "table tr td",
  dividends: "table tr td",
  stock_split: "table tr td",
  ipo: "table tr td",
};

// ── Public API ──────────────────────────────────────────────────────────────

export async function fetchCalendarEvents(
  params: FetchCalendarParams = {}
): Promise<CalendarEvent[]> {
  const calendarType = params.calendarType || "economic";
  const timeFilter = params.timeFilter;

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "th-TH",
    timezoneId: "Asia/Bangkok",
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    const url = buildUrl(calendarType, timeFilter);
    console.log("[calendar] Navigating to " + url);

    await blockUnnecessary(page);

    // All non-economic calendar pages need an established Cloudflare session first.
    // Visiting the economic calendar page passes the Cloudflare challenge and sets
    // cookies that allow subsequent page visits.
    // For dividends/stock_split, use the English economic calendar (same domain).
    if (calendarType !== "economic") {
      const baseForSession = getBaseUrl(calendarType);
      console.log("[calendar] Establishing Cloudflare session via " + baseForSession + "/economic-calendar/ ...");
      try {
        await page.goto(baseForSession + "/economic-calendar/", {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        // Wait for Cloudflare challenge to complete and page to render
        await page.waitForTimeout(5000);
      } catch {
        console.log("[calendar] Session establishment skipped (timeout)");
      }
    }

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT,
    });

    console.log("[calendar] Waiting for data to render...");

    // Wait for the calendar data to appear
    try {
      await page.waitForSelector(WAIT_SELECTORS[calendarType], {
        timeout: DATA_WAIT_TIMEOUT,
      });
    } catch {
      console.log("[calendar] Primary selector not found, waiting extra...");
      await page.waitForTimeout(5000);
    }

    await page.waitForTimeout(3000);

    // Debug: Log page tables info for troubleshooting scrapers
    const tableInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll("table");
      return Array.from(tables).map((t, i) => ({
        index: i,
        rows: t.querySelectorAll("tr").length,
        cols: t.querySelectorAll("tr")[0]?.querySelectorAll("th,td").length || 0,
        hasIdRows: t.querySelectorAll("tr[id]").length,
      }));
    });
    console.log("[calendar] Page tables:", JSON.stringify(tableInfo));

    const script = SCRIPTS[calendarType];
    const rawEvents = (await page.evaluate(script)) as any[];

    const now = Date.now();
    const events: CalendarEvent[] = rawEvents.map((e: any) => ({
      calendarType,
      fetchedAt: now,
      ...e,
    }));

    console.log("[calendar] Extracted " + events.length + " " + calendarType + " events");
    return events;
  } catch (error: any) {
    console.error("[calendar] Scrape failed: " + error.message);
    throw new Error("Failed to scrape " + calendarType + " calendar: " + error.message);
  } finally {
    await context.close().catch(() => {});
  }
}

// Keep backward-compatible export
export const fetchEconomicCalendarEvents = fetchCalendarEvents;
