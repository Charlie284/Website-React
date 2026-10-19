const CACHE_PREFIX = "charlie-site-";
const CACHE_VERSION = "BUILD_CACHE_VERSION";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const PRECACHE_URLS = ["BUILD_PRECACHE_URLS"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          const pathname = url.pathname === "/"
            ? "/"
            : url.pathname.replace(/\/+$/, "");
          const candidates = pathname === "/"
            ? [request, "/", "/index.html"]
            : [request, pathname, `${pathname}.html`, `${pathname}/index.html`];

          for (const candidate of candidates) {
            const response = await cache.match(candidate, { ignoreSearch: true });
            if (response) return response;
          }

          return await cache.match("/404.html") ||
            await cache.match("/") ||
            Response.error();
        }
      })(),
    );
    return;
  }

  // Third-party requests remain network-only and are never retained.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache static resources as they are used. Never cache API responses.
  // Vite fetches module-preload dependencies with an empty destination.
  const isBuildAsset = url.pathname.startsWith("/assets/") &&
    /\.(js|css|woff2)$/.test(url.pathname);
  if (!isBuildAsset && !["script", "style", "font", "image"].includes(request.destination)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
