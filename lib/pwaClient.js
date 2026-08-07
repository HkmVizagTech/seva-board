"use client";

// Client-side helpers for the installable app + push notifications.

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// iOS only allows push once the site is installed to the home screen (iOS 16.4+).
export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); }
  catch (e) { console.error("SW registration failed", e); return null; }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getExistingSubscription() {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (e) { return null; }
}

/**
 * Ask permission, subscribe with the server's VAPID key, and register the subscription.
 * Returns { ok, reason } so the UI can explain exactly what went wrong.
 */
export async function subscribeToPush() {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  if (isIOS() && !isStandalone()) return { ok: false, reason: "ios_needs_install" };

  // Fetch the public key first — no point prompting for permission if push isn't set up.
  let publicKey;
  try {
    const res = await fetch("/api/push/subscribe", { credentials: "same-origin" });
    if (!res.ok) return { ok: false, reason: "server_error" };
    const data = await res.json();
    if (!data.configured) return { ok: false, reason: "not_configured" };
    publicKey = data.publicKey;
  } catch (e) { return { ok: false, reason: "server_error" }; }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: permission === "denied" ? "denied" : "dismissed" };

  try {
    await registerServiceWorker();
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    if (!res.ok) return { ok: false, reason: "server_error" };
    return { ok: true };
  } catch (e) {
    console.error("push subscribe failed", e);
    return { ok: false, reason: "subscribe_failed" };
  }
}

export async function unsubscribeFromPush() {
  try {
    const sub = await getExistingSubscription();
    if (!sub) return { ok: true };
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    return { ok: true };
  } catch (e) { return { ok: false }; }
}
