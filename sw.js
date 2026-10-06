// Offline after first load, and never a version behind when there is a network.
// The page itself is fetched fresh whenever it can be, so a new build shows the first time it is opened;
// the cache is only what it falls back on. Everything else (scripts and styles carry their version in
// their names) is served from the cache and refreshed behind.
const CACHE = 'copper-v2';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const keep = (res) => {
    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
    return res;
  };
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(fetch(req).then(keep).catch(() => caches.match(req).then((hit) => hit ?? caches.match('./index.html'))));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      const fetching = fetch(req).then(keep).catch(() => hit);
      return hit ?? fetching;
    }),
  );
});
