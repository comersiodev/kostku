const CACHE_NAME = "kostku-cache-v1";

// Daftar file yang mau di-cache biar bisa dibuka offline.
// Tambahin/hapus sesuai halaman & aset yang beneran ada di project kamu.
const FILES_TO_CACHE = [
  "index.html",
  "style.css",
  "manifest.json",
  "kelola-uang.html",
  "utang.html",
  "rekap.html",
  "catatan.html",
  "utangin-orang.html",
  "penagihan.html",
  "profile.html",
  "login.html",
  "oswald-bold.ttf",
  "firasanscondensed-bold.otf",
  "firasanscondensed-book.otf",
  "icon2.png",
  "icon.png"
];

// INSTALL: cache semua file awal
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        FILES_TO_CACHE.map((file) =>
          cache.add(file).catch((err) => {
            // Kalau ada file yang belum ada / gagal di-fetch, jangan gagalin instalasi semua
            console.warn("Gagal cache:", file, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ACTIVATE: bersihin cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// FETCH: cache-first, fallback ke network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // simpan hasil fetch baru ke cache biar next time offline juga kepakai
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // kalau offline dan file belum ke-cache, fallback ke index.html (opsional)
          if (event.request.mode === "navigate") {
            return caches.match("index.html");
          }
        });
    })
  );
});
