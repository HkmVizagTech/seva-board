// Custom server (instead of `next start`) so we can attach a WebSocket server to the
// same HTTP server for real-time board sync. Requires a persistent, self-hosted process
// (Railway/Coolify) — this doesn't work on stateless serverless platforms.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "8080", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Shared with lib/realtime.js (ESM, used by API routes) via the global object — both
// run in this same process, so this Set is the single source of truth for who's connected.
if (!global._sevaWsClients) global._sevaWsClients = new Set();

const app = next({ dev });
const handle = app.getRequestHandler();

// Browsers always send an Origin header on a WebSocket connection; only accept our own site.
function allowedOrigin(origin, hostHeader) {
  if (!origin) return true; // non-browser clients send none
  try {
    const host = new URL(origin).host;
    if (host === hostHeader) return true;
    if (process.env.APP_BASE_URL && new URL(process.env.APP_BASE_URL).host === host) return true;
    return false;
  } catch (e) { return false; }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // This app never uses Next's image optimizer, and recent Next.js advisories concern it —
    // so refuse the endpoint outright rather than leave it exposed.
    if (req.url && req.url.startsWith("/_next/image")) { res.statusCode = 404; return res.end("Not found"); }
    handle(req, res, parse(req.url, true));
  });

  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024, // clients never send us anything meaningful; refuse large frames
    verifyClient: (info) => allowedOrigin(info.origin, info.req.headers.host),
  });
  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });
    global._sevaWsClients.add(ws);
    ws.on("close", () => global._sevaWsClients.delete(ws));
    ws.on("error", () => global._sevaWsClients.delete(ws));
  });

  // Ping every client regularly: keeps connections alive through proxies, and drops ones
  // whose phone/laptop went away without saying goodbye.
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      try { ws.ping(); } catch (e) {}
    });
  }, 30000);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (WebSocket on /ws)`);
  });

  // Railway sends SIGTERM on every redeploy: finish in-flight requests instead of cutting them off.
  const shutdown = (signal) => {
    console.log(`> ${signal} received, shutting down gracefully`);
    clearInterval(heartbeat);
    wss.clients.forEach((ws) => { try { ws.close(1001, "server restarting"); } catch (e) {} });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 8000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
