import { NextRequest } from "next/server";
import { sanitizePublicMarketPayload } from "@/lib/public-market-source";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LiveStreamTrade = {
  ev?: string;
  sym?: string;
  p?: number;
  t?: number;
};

type LiveStreamStatus = {
  ev?: string;
  status?: string;
  message?: string;
};

function sanitizeSymbols(value: string | null) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => /^[A-Z]{1,5}(\.[A-Z])?$/.test(symbol))
    )
  ).slice(0, 100);
}

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(sanitizePublicMarketPayload(data))}\n\n`;
}

export async function GET(request: NextRequest) {
  const symbols = sanitizeSymbols(request.nextUrl.searchParams.get("symbols"));
  const apiKey = process.env.MASSIVE_API_KEY;

  if (symbols.length === 0) {
    return new Response(encodeSse("error", { error: "No symbols requested" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  if (!apiKey) {
    return new Response(encodeSse("error", { error: "Live quote stream is not configured" }), {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let activeSocket: WebSocket | null = null;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSse(event, data)));
        } catch {
          closed = true;
          if (heartbeat) clearInterval(heartbeat);
          if (activeSocket?.readyState === WebSocket.OPEN || activeSocket?.readyState === WebSocket.CONNECTING) {
            activeSocket.close();
          }
        }
      };

      const realtimeEndpoint = process.env.MASSIVE_WS_URL || "wss://socket.massive.com/stocks";

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (activeSocket?.readyState === WebSocket.OPEN || activeSocket?.readyState === WebSocket.CONNECTING) {
          activeSocket.close();
        }
        try {
          controller.close();
        } catch {
          /* stream may already be closed */
        }
      };

      request.signal.addEventListener("abort", close);

      const connect = (endpoint: string, canFallback: boolean) => {
        if (closed) return;
        if (heartbeat) clearInterval(heartbeat);

        const socket = new WebSocket(endpoint);
        activeSocket = socket;
        let subscribed = false;

        const subscribe = () => {
          if (subscribed || socket.readyState !== WebSocket.OPEN) return;
          subscribed = true;
          socket.send(JSON.stringify({ action: "subscribe", params: symbols.map((symbol) => `T.${symbol}`).join(",") }));
          send("status", { status: "subscribed", source: "live-market-stream", symbols });
        };

        socket.addEventListener("open", () => {
          socket.send(JSON.stringify({ action: "auth", params: apiKey }));
          send("status", { status: "connected", source: "live-market-stream", symbols });
          heartbeat = setInterval(() => send("heartbeat", { ts: Date.now() }), 25000);
        });

        socket.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(String(event.data));
            const rows = Array.isArray(payload) ? payload : [payload];
            rows.forEach((row: LiveStreamTrade | LiveStreamStatus) => {
              if ("status" in row || "message" in row) {
                send("status", row);
                const statusText = `${row.status || ""} ${row.message || ""}`.toLowerCase();

                if (statusText.includes("not authorized") && canFallback) {
                  send("status", { status: "fallback", message: "Switching to delayed market-data feed" });
                  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
                  connect("wss://delayed.massive.com/stocks", false);
                  return;
                }

                if (statusText.includes("auth_success") || statusText.includes("authenticated")) subscribe();
                return;
              }

              const trade = row as LiveStreamTrade;
              if (trade.ev !== "T" || !trade.sym || typeof trade.p !== "number" || !Number.isFinite(trade.p) || trade.p <= 0) {
                return;
              }

              send("quote", {
                symbol: trade.sym,
                price: trade.p,
                quoteSource: endpoint.includes("delayed") ? "live-market-stream-delayed" : "live-market-stream",
                quoteUpdatedAt: trade.t ? new Date(trade.t).toISOString() : new Date().toISOString(),
                quoteDelayMinutes: endpoint.includes("delayed") ? 15 : 0,
                quoteIsDelayed: endpoint.includes("delayed"),
              });
            });
          } catch {
            send("error", { error: "Unable to parse live quote stream payload" });
          }
        });

        socket.addEventListener("error", () => {
          send("error", { error: "Live quote stream connection failed" });
        });

        socket.addEventListener("close", () => {
          if (activeSocket === socket) close();
        });
      };

      connect(realtimeEndpoint, !realtimeEndpoint.includes("delayed.massive.com"));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
