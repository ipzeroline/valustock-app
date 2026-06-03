import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MassiveTrade = {
  ev?: string;
  sym?: string;
  p?: number;
  t?: number;
};

type MassiveStatus = {
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
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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
    return new Response(encodeSse("error", { error: "MASSIVE_API_KEY is not configured" }), {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(encodeSse(event, data)));
      };

      const realtimeEndpoint = process.env.MASSIVE_WS_URL || "wss://socket.massive.com/stocks";
      let activeSocket: WebSocket | null = null;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let closed = false;

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
          send("status", { status: "subscribed", source: "massive-websocket", endpoint, symbols });
        };

        socket.addEventListener("open", () => {
          socket.send(JSON.stringify({ action: "auth", params: apiKey }));
          send("status", { status: "connected", source: "massive-websocket", endpoint, symbols });
          heartbeat = setInterval(() => send("heartbeat", { ts: Date.now() }), 25000);
        });

        socket.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(String(event.data));
            const rows = Array.isArray(payload) ? payload : [payload];
            rows.forEach((row: MassiveTrade | MassiveStatus) => {
              if ("status" in row || "message" in row) {
                send("status", row);
                const statusText = `${row.status || ""} ${row.message || ""}`.toLowerCase();

                if (statusText.includes("not authorized") && canFallback) {
                  send("status", { status: "fallback", message: "Switching to delayed Massive websocket feed" });
                  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
                  connect("wss://delayed.massive.com/stocks", false);
                  return;
                }

                if (statusText.includes("auth_success") || statusText.includes("authenticated")) subscribe();
                return;
              }

              const trade = row as MassiveTrade;
              if (trade.ev !== "T" || !trade.sym || typeof trade.p !== "number" || !Number.isFinite(trade.p) || trade.p <= 0) {
                return;
              }

              send("quote", {
                symbol: trade.sym,
                price: trade.p,
                quoteSource: endpoint.includes("delayed") ? "massive-websocket-delayed" : "massive-websocket",
                quoteUpdatedAt: trade.t ? new Date(trade.t).toISOString() : new Date().toISOString(),
              });
            });
          } catch {
            send("error", { error: "Unable to parse Massive websocket payload" });
          }
        });

        socket.addEventListener("error", () => {
          send("error", { error: "Massive websocket connection failed", endpoint });
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
