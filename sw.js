/* Campus AI v7 offline app shell. localStorage is never read, written, or cached here. */
const CACHE_NAME = "campus-ai-v7-1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    // New worker waits until the app offers its explicit Reload action.
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("campus-ai-") && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && new URL(request.url).origin === self.location.origin) {
        // Cache only same-origin static GET responses; never intercept storage APIs.
        const url = new URL(request.url);
        if (url.pathname.endsWith(".html") || url.pathname.endsWith(".json") || url.pathname.endsWith(".png") || url.pathname.endsWith("/")) {
          cache.put(request, response.clone()).catch(() => {});
        }
      }
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        return (await cache.match("./index.html")) || (await cache.match("./")) || new Response("Campus AI is offline. Reopen this page after it has been cached once.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      throw error;
    }
  })());
});
