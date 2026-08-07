/* Seva Board service worker — required for both "install to home screen" and push
   notifications. Deliberately does NOT cache API responses or the app shell aggressively:
   this is a live, shared board, and serving stale task data would be worse than showing
   a normal offline error. */

const SW_VERSION = "v1";

self.addEventListener("install", (event) => {
  // Take over immediately rather than waiting for all old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up any caches from older versions of this worker.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

/* ---- push notifications ---- */
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = {}; }

  const title = payload.title || "Seva Board";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    tag: payload.tag || "seva-board",
    renotify: true,
    data: { url: payload.url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Focus an already-open tab if there is one, rather than opening a duplicate.
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) { try { await client.navigate(targetUrl); } catch (e) {} }
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
    })()
  );
});
