// Froggie Streak service worker — offline shell.
// Network-first: updates always ship without version discipline; cache is the
// offline fallback. Right trade for tiny static files + two users.
const CACHE = "froggie";
const SHELL = [".", "index.html", "styles.css", "app.js", "firebase-config.js", "manifest.json", "icon.svg", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// RTDB itself uses websockets/long-polling — untouched, so live sync still works.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
