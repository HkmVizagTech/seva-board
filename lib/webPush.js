// Web Push (VAPID) sending. Works on Android/Chrome/Firefox/Edge, and on iOS 16.4+ but
// ONLY once the site has been added to the home screen — iOS does not allow push from a
// normal Safari tab. See README for setup and the VAPID key generation command.

import webpush from "web-push";
import { deletePushSubscription } from "./mongodb";

let configured = false;

export function pushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function ensureConfigured() {
  if (configured) return;
  if (!pushConfigured()) throw new Error("VAPID keys are not set");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:tech@hkmvizag.org",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configured = true;
}

/**
 * Send a notification to a list of subscription documents.
 * Subscriptions that the push service reports as gone (404/410 — app uninstalled,
 * permission revoked, browser data cleared) are deleted so they don't pile up.
 */
export async function sendPushToSubscriptions(subs, payload) {
  if (!subs || !subs.length) return { sent: 0, removed: 0 };
  ensureConfigured();

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
        sent += 1;
      } catch (e) {
        const status = e?.statusCode;
        if (status === 404 || status === 410) {
          try { await deletePushSubscription(sub.endpoint); removed += 1; } catch (err) {}
        } else {
          console.error("[push] send failed", status, e?.body || e?.message || e);
        }
      }
    })
  );

  return { sent, removed };
}
