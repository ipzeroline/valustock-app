import { ImageResponse } from "next/og";

export const alt = "ValuStock stock valuation dashboard";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const metrics = [
  { label: "Fair Value", value: "$252.40", tone: "#22c55e" },
  { label: "Margin of Safety", value: "18.6%", tone: "#38bdf8" },
  { label: "DCF Score", value: "A-", tone: "#f59e0b" },
];

const bars = [44, 68, 52, 84, 72, 96, 78, 104, 92, 118, 108, 136];

export default function OpengraphImage() {
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
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.24), rgba(34,197,94,0.18) 46%, rgba(245,158,11,0.12))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 58,
            right: 72,
            bottom: 58,
            display: "flex",
            gap: 44,
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
                  color: "#06111f",
                  fontSize: 30,
                  fontWeight: 900,
                }}
              >
                V
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 0 }}>ValuStock</div>
                <div style={{ color: "#bae6fd", fontSize: 18, fontWeight: 700 }}>Professional Stock Valuation Platform</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  display: "flex",
                  width: 640,
                  color: "#e2e8f0",
                  fontSize: 68,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                Find quality stocks with intrinsic value data.
              </div>
              <div style={{ display: "flex", color: "#cbd5e1", fontSize: 25, lineHeight: 1.36, width: 620 }}>
                DCF valuation, fair value, margin of safety, dividends, financials, charts, and market intelligence in one clean workspace.
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              {["DCF", "Fair Value", "US & Thai Stocks", "ETF"].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    padding: "12px 18px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.72)",
                    border: "1px solid rgba(148,163,184,0.26)",
                    color: "#e2e8f0",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 390,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 22,
              borderRadius: 28,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(148,163,184,0.24)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "#94a3b8", fontSize: 18, fontWeight: 800 }}>Watchlist</div>
                <div style={{ fontSize: 34, fontWeight: 900 }}>AAPL / VOO</div>
              </div>
              <div style={{ color: "#22c55e", fontSize: 21, fontWeight: 900 }}>Live Ready</div>
            </div>

            <div
              style={{
                height: 166,
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                padding: "0 4px",
                borderBottom: "1px solid rgba(148,163,184,0.22)",
              }}
            >
              {bars.map((height, index) => (
                <div
                  key={index}
                  style={{
                    width: 18,
                    height,
                    borderRadius: 8,
                    background:
                      index > 8
                        ? "linear-gradient(180deg, #22c55e, #15803d)"
                        : "linear-gradient(180deg, #38bdf8, #0369a1)",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 18px",
                    borderRadius: 18,
                    background: "rgba(15,23,42,0.72)",
                    border: "1px solid rgba(148,163,184,0.18)",
                  }}
                >
                  <div style={{ color: "#cbd5e1", fontSize: 18, fontWeight: 800 }}>{metric.label}</div>
                  <div style={{ color: metric.tone, fontSize: 24, fontWeight: 900 }}>{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
