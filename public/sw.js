const CACHE_NAME = "zproperty-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_EXTENSIONS = [
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
];

const NETWORK_ONLY_PREFIXES = ["/api/", "/admin", "/dashboard", "/buyer", "/callback", "/auth"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function isNetworkOnly(pathname) {
  return NETWORK_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Dynamic / auth-sensitive routes always go straight to the network.
  if (isNetworkOnly(url.pathname)) {
    return;
  }

  // Static assets: cache-first, falling back to network and populating
  // the cache for next time.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // HTML pages: stale-while-revalidate, with an offline fallback if both
  // the cache and the network fail.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match(OFFLINE_URL));

      return cached || networkFetch;
    }),
  );
});
