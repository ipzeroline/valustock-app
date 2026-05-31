import React, { useState } from "react";

// Set this to true to completely bypass external logo fetching.
// Benefits: Instant logo loading (0ms latency), 100% clean console (no ERR_NAME_NOT_RESOLVED), and 100% offline support.
const BYPASS_EXTERNAL_LOGOS = true;

const DOMAIN_MAPS: Record<string, string> = {
  // ---- Thai Corporates & Banks ----
  PTT: "ptt.co.th",
  PTTEP: "pttep.com",
  PTTGC: "pttglobalchemical.com",
  CPALL: "cpall.co.th",
  CPF: "cpfworldwide.com",
  AOT: "airportthai.co.th",
  KBANK: "kasikornbank.com",
  BBL: "bangkokbank.com",
  KTB: "krungthai.com",
  SCB: "scb.co.th",
  KKP: "kiatnakin.co.th",
  TISCO: "tisco.co.th",
  TCAP: "thanachart.co.th",
  ADVANC: "ais.th",
  TRUE: "true.th",
  INTUCH: "intuch.com",
  BDMS: "bdms.co.th",
  BH: "bumrungrad.com",
  BCH: "bangkokchainhospital.com",
  CHG: "chularat.com",
  GULF: "gulf.co.th",
  GPSC: "gpscgroup.com",
  EGCO: "egco.com",
  BGRIM: "bgrimmpower.com",
  EA: "energyabsolute.co.th",
  SCC: "scg.com",
  SCGP: "scgpackaging.com",
  MINT: "minor.com",
  HMPRO: "homepro.co.th",
  GLOBAL: "siamglobalhouse.com",
  DOHOME: "dohome.co.th",
  DELTA: "deltathailand.com",
  CPN: "centralpattana.co.th",
  OR: "pttor.com",
  TOP: "thaioilgroup.com",
  BANPU: "banpu.com",
  BTS: "btsgroup.co.th",
  BEM: "bemplc.co.th",
  WHA: "wha-group.com",
  CBG: "carabaogroup.com",
  OSP: "osotspa.com",
  TU: "thaiunion.com",
  LH: "lh.co.th",
  QH: "qh.co.th",
  SIRI: "sansiri.com",
  SPALI: "supalai.com",
  AP: "apthai.com",
  IVL: "indoramaventures.com",
  KCE: "kce.co.th",
  HANA: "hanahq.com",
  COM7: "comseven.com",
  SAWAD: "srisawadpower.com",
  MTC: "muangthaicapital.com",
  TIDLOR: "ngerntidlor.com",
  BAM: "bam.co.th",
  MAJOR: "majorcineplex.com",
  PLANB: "planbmedia.co.th",

  // ---- Funds / ETFs ----
  SCBSET50: "scb.co.th",
  "K-USA-A": "kasikornbank.com",
  "B-INNOTECH": "bblam.co.th",
};

export function AssetLogo({
  symbol,
  color,
  size = "md",
}: {
  symbol: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [error, setError] = useState(false);
  const sym = symbol.toUpperCase().trim();

  // Get domain mapping for Thai corporate or bank assets
  let domain = DOMAIN_MAPS[sym];
  if (!domain) {
    if (sym.startsWith("SCB")) domain = "scb.co.th";
    else if (sym.startsWith("K-")) domain = "kasikornbank.com";
    else if (sym.startsWith("B-")) domain = "bblam.co.th";
    else if (sym.startsWith("ONE-")) domain = "one-asset.com";
    else if (sym.startsWith("TMB") || sym.startsWith("TTB")) domain = "ttbbank.com";
  }

  // Load URL based on asset class
  let logoUrl = "";
  if (!BYPASS_EXTERNAL_LOGOS) {
    if (domain) {
      logoUrl = `https://logo.clearbit.com/${domain}`;
    } else {
      // US Stock logo endpoint (FMP symbols repository)
      logoUrl = `https://images.financialmodelingprep.com/symbol/${sym}.png`;
    }
  }

  const dims = {
    sm: "h-8 w-8 rounded-lg text-[10px]",
    md: "h-11 w-11 rounded-xl text-[12px]",
    lg: "h-14 w-14 rounded-2xl text-[14px]",
  }[size];

  const baseColor = color || "#3B82F6";

  // Premium initials avatar fallback design (custom gradient, glowing brand shadow, neon border)
  if (BYPASS_EXTERNAL_LOGOS || error || !logoUrl) {
    return (
      <span
        className={`grid place-items-center font-display font-black text-white select-none shrink-0 ${dims} border transition-all duration-300`}
        style={{
          background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}99 100%)`,
          borderColor: `${baseColor}55`,
          boxShadow: `0 4px 12px ${baseColor}25, inset 0 1px 1px rgba(255, 255, 255, 0.15)`,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
        }}
      >
        {sym.slice(0, 3)}
      </span>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden bg-white border border-line ${dims} flex items-center justify-center p-1 shadow-sm`}>
      <img
        src={logoUrl}
        alt={sym}
        className="max-h-full max-w-full object-contain rounded-md"
        onError={() => setError(true)}
      />
    </div>
  );
}
