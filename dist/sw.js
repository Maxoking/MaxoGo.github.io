self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

// fetch-Listener ist optional, aber hilft Chrome beim PWA-Status
self.addEventListener("fetch", () => {});