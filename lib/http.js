// fetch() with a deadline, so a provider that hangs (Microsoft, Google, Resend...) can never
// leave a request open for minutes — it fails fast and the caller reports a clean error.
export function fetchWithTimeout(url, options = {}, ms = 15000) {
  return fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(ms) });
}
