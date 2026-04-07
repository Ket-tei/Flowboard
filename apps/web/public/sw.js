/* Flowboard — cache des manifestes et médias publics pour lecture hors-ligne */
const CACHE_PREFIX = "flowboard-public-";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.includes("/api/public/screens/")) {
    return;
  }
  event.respondWith(
    (async () => {
      const cacheName = CACHE_PREFIX + "v1";
      const cache = await caches.open(cacheName);
      const cached = await cache.match(event.request);
      if (cached) {
        try {
          const network = await fetch(event.request);
          if (network.ok) {
            await cache.put(event.request, network.clone());
          }
        } catch {
          /* réseau indisponible */
        }
        return cached;
      }
      try {
        const network = await fetch(event.request);
        if (network.ok) {
          await cache.put(event.request, network.clone());
        }
        return network;
      } catch {
        return cached ?? Response.error();
      }
    })()
  );
});
