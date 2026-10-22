// Simple in-memory limiter for sign-in attempts. State lives in this server process, so it
// resets on redeploy — fine for blunting password guessing on a single-instance app.
const WINDOW_MS = 15 * 60 * 1000;
const store = global._sevaRate || (global._sevaRate = new Map());

export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : "") || req.headers.get("x-real-ip") || "unknown";
}

export function checkLimit(key, max) {
  const now = Date.now();
  if (store.size > 5000) for (const [k, v] of store) if (v.reset <= now) store.delete(k);
  const v = store.get(key);
  if (!v || v.reset <= now) return { blocked: false };
  return v.count >= max ? { blocked: true, retryAfter: Math.ceil((v.reset - now) / 1000) } : { blocked: false };
}

export function recordFailure(key) {
  const now = Date.now();
  const v = store.get(key);
  if (!v || v.reset <= now) store.set(key, { count: 1, reset: now + WINDOW_MS });
  else v.count += 1;
}

export function clearKey(key) { store.delete(key); }
