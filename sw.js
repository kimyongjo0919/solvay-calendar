var CACHE = 'solvay-v1';
var SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icons/logo-small.png', 'icons/icon-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }).catch(function () {})
  );
});

// 앱 파일만 네트워크 우선으로 가져오고, 실패하면 저장본을 보여줍니다. (서버 API 요청은 건드리지 않음)
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var u = new URL(req.url);
  if (u.origin !== self.location.origin) { return; }
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});
