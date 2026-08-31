const CACHE_NAME = "kelasku-pwa-v5";
const STATIC_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/pwa-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Rewrite SPA membuat aset yang sudah tidak ada dibalas index.html dengan status
// 200. HTML itu tidak boleh disimpan maupun disajikan sebagai JS/CSS: browser
// menolak menjalankannya dan aplikasi gagal mount. Jadi untuk permintaan
// non-navigasi, respons HTML dianggap tidak sah.
const isHtml = (response) =>
  (response?.headers.get("Content-Type") || "").includes("text/html");

const cacheResponse = async (request, response) => {
  if (!response.ok || response.type !== "basic") return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        try {
          const response = await fetch(request, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cacheResponse("/index.html", response);
          return response;
        } catch {
          return (
            (await caches.match("/index.html")) ||
            new Response("KelasKu sedang offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        } finally {
          clearTimeout(timer);
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const update = fetch(request)
        .then(async (response) => {
          if (response.ok && !isHtml(response)) await cacheResponse(request, response);
          return response;
        })
        .catch(() => cached);
      // Entri HTML beracun dari cache lama diabaikan, bukan disajikan.
      if (cached && !isHtml(cached)) {
        event.waitUntil(update);
        return cached;
      }
      return update;
    })(),
  );
});
