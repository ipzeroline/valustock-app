import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const THEMES = [
  { accent: "#22c55e", accent2: "#0ea5e9", label: "VALUE RESEARCH" },
  { accent: "#f59e0b", accent2: "#22c55e", label: "DIVIDEND STRATEGY" },
  { accent: "#38bdf8", accent2: "#a855f7", label: "MARKET GUIDE" },
  { accent: "#14b8a6", accent2: "#f97316", label: "PORTFOLIO INSIGHT" },
  { accent: "#f43f5e", accent2: "#f59e0b", label: "RISK CHECK" },
  { accent: "#84cc16", accent2: "#06b6d4", label: "ETF ANALYSIS" },
];

function themeFor(input: string) {
  const hash = Array.from(input).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return THEMES[hash % THEMES.length];
}

function trimText(value: string | null, fallback: string, max = 86) {
  const text = (value || fallback).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> },
) {
  const { id } = (await context.params) as { id?: string };
  const searchParams = request.nextUrl.searchParams;
  const fallbackSymbol = (id || "research").split("-")[0] || "research";
  const symbol = trimText(searchParams.get("symbol"), fallbackSymbol, 18).toUpperCase();
  const category = trimText(searchParams.get("category"), "Stock Valuation", 34).toUpperCase();
  const theme = ["VI", "VS"].includes(symbol) ? THEMES[0] : themeFor(id || "article");
  const bars = [56, 92, 76, 124, 110, 152, 136, 176, 164, 214, 196, 236];
  const seed = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const fairValue = 180 + (seed % 220);
  const margin = 12 + (seed % 24);
  const quality = 72 + (seed % 20);
  const metrics = [
    { label: "Fair Value", value: `${fairValue}.50`, tone: theme.accent },
    { label: "MOS", value: `${margin}%`, tone: "#f8fafc" },
    { label: "Quality", value: `${quality}/100`, tone: theme.accent2 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#07111f",
          color: "#f8fafc",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${theme.accent}38, ${theme.accent2}24 48%, rgba(15,23,42,0.98))`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -130,
            top: 60,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: `radial-gradient(circle, ${theme.accent}55 0%, ${theme.accent2}22 42%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -90,
            bottom: -150,
            width: 520,
            height: 360,
            borderRadius: 999,
            background: `radial-gradient(circle, ${theme.accent2}36 0%, transparent 68%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            padding: 42,
            gap: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                  color: "#06111f",
                  fontSize: 30,
                  fontWeight: 900,
                }}
              >
                V
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 32, fontWeight: 900 }}>ValuStock</div>
                <div style={{ color: "#cbd5e1", fontSize: 17, fontWeight: 800 }}>{theme.label}</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 15px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.72)",
                border: "1px solid rgba(226,232,240,0.18)",
                color: theme.accent,
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              Research Dashboard
            </div>
          </div>

          <div style={{ display: "flex", flex: 1, gap: 22, minHeight: 0 }}>
            <div
              style={{
                display: "flex",
              flex: 1,
              minWidth: 0,
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 32,
              borderRadius: 32,
                background: "linear-gradient(135deg, rgba(2,6,23,0.78), rgba(15,23,42,0.54))",
                border: "1px solid rgba(226,232,240,0.14)",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 92,
                      height: 92,
                      borderRadius: 25,
                      alignItems: "center",
                      justifyContent: "center",
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                      color: "#06111f",
                      fontSize: 31,
                      fontWeight: 900,
                    }}
                  >
                    {symbol.slice(0, 4)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        fontSize: 72,
                        lineHeight: 0.92,
                        fontWeight: 900,
                        letterSpacing: 0,
                      }}
                    >
                      {symbol}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        marginTop: 8,
                        color: theme.accent,
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      DCF / FAIR VALUE / RISK CHECK
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    maxWidth: 650,
                    color: "#cbd5e1",
                    fontSize: 29,
                    lineHeight: 1.2,
                    fontWeight: 900,
                  }}
                >
                  Research snapshot for better valuation decisions
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      display: "flex",
                      flex: 1,
                      flexDirection: "column",
                      padding: "15px 18px",
                      borderRadius: 20,
                      background: "rgba(15,23,42,0.72)",
                      border: "1px solid rgba(226,232,240,0.14)",
                    }}
                  >
                    <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 800 }}>{metric.label}</span>
                    <span style={{ color: metric.tone, fontSize: 27, fontWeight: 900 }}>{metric.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "flex",
                    padding: "13px 18px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.72)",
                    border: "1px solid rgba(226,232,240,0.18)",
                    color: "#e2e8f0",
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  {category}
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "13px 18px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.72)",
                    border: "1px solid rgba(226,232,240,0.18)",
                    color: theme.accent,
                    fontSize: 15,
                    fontWeight: 900,
                  }}
                >
                  Margin of Safety Framework
                </div>
              </div>
            </div>

            <div
            style={{
              width: 292,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 24,
              borderRadius: 32,
              background: "linear-gradient(180deg, rgba(2,6,23,0.86), rgba(15,23,42,0.68))",
              border: "1px solid rgba(226,232,240,0.18)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "#94a3b8", fontSize: 17, fontWeight: 800 }}>Signal</div>
                <div style={{ fontSize: 31, fontWeight: 900 }}>Quality</div>
              </div>
              <div style={{ color: theme.accent, fontSize: 30, fontWeight: 900 }}>A</div>
            </div>
            <div
              style={{
                height: 248,
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                borderBottom: "1px solid rgba(226,232,240,0.18)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "26px 0 0 0",
                  borderTop: "1px solid rgba(148,163,184,0.12)",
                  borderBottom: "1px solid rgba(148,163,184,0.12)",
                }}
              />
              {bars.map((height, index) => (
                <div
                  key={index}
                  style={{
                    width: 11,
                    height: Math.round(height * 0.9),
                    borderRadius: 8,
                    background: `linear-gradient(180deg, ${index > 7 ? theme.accent : theme.accent2}, rgba(15,23,42,0.2))`,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 16, fontWeight: 900 }}>
              <span>Research</span>
              <span style={{ color: theme.accent }}>Ready</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                paddingTop: 8,
              }}
            >
              {["DCF", "Risk", "MOS"].map((label) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: "center",
                    padding: "8px 0",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.72)",
                    color: label === "MOS" ? theme.accent : "#cbd5e1",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
