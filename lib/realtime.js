// Shared in-memory set of connected WebSocket clients. Both the custom server.js
// (plain CommonJS, registers connections) and this module (ESM, used by API routes to
// broadcast) attach to the same `global` object, since they run in one long-running
// Node process — this only works because the app is self-hosted (Railway/Coolify) with
// a persistent server, not deployed as stateless serverless functions.

if (!global._sevaWsClients) global._sevaWsClients = new Set();

export function broadcast(message) {
  const payload = typeof message === "string" ? message : JSON.stringify(message);
  for (const ws of global._sevaWsClients) {
    if (ws.readyState === 1) { // OPEN
      try { ws.send(payload); } catch (e) {}
    }
  }
}

export function clientCount() {
  return global._sevaWsClients.size;
}
