// Euro Sealant CRM — service worker.
// Only this site's own files are touched. Data calls to Google (script.google.com) and the
// scanner/QR libraries are never cached, so the app always shows live data.
// Pages are network-first: every update on GitHub shows up straight away; the saved copy is
// only used when the phone has no internet, so the app still opens instead of a blank screen.
var CACHE = 'es-crm-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Google API, CDNs: straight to network
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        if (req.mode !== 'navigate') return Response.error();
        return caches.match('./index.html').then(function (p) { return p || Response.error(); });
      });
    })
  );
});
