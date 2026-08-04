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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (ws) => {
    global._sevaWsClients.add(ws);
    ws.on("close", () => global._sevaWsClients.delete(ws));
    ws.on("error", () => global._sevaWsClients.delete(ws));
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (WebSocket on /ws)`);
  });
});
