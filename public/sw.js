// NT70 Quest service worker: makes the app installable and usable offline.
//
// - The app shell (index.html, icons, manifest) is cached on install; pages load network-first so
//   a new deploy shows up right away, and fall back to the cached copy when offline.
// - Built files in assets/ have hashed names, so they are cached once and reused.
// - The KJV text (about 1 MB) is cached in the background, so every reading works offline.
// - Firebase, Google sign-in and anything else on another origin is never touched, and neither is
//   the sign-in handler under /__/ that Firebase Hosting serves.
//
// Bump VERSION to throw away every cache on the next visit.
const VERSION = "v1";
const SHELL = `nt70-shell-${VERSION}`;
const ASSETS = `nt70-assets-${VERSION}`;
const BOOKS = `nt70-kjv-${VERSION}`;
const KEEP = [SHELL, ASSETS, BOOKS];
const MAX_ASSETS = 80;

const url = path => new URL(path, self.registration.scope).href;

const SHELL_FILES = [
  "./",
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
].map(url);

const BOOK_FILES = [
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1Corinthians", "2Corinthians", "Galatians",
  "Ephesians", "Philippians", "Colossians", "1Thessalonians", "2Thessalonians", "1Timothy",
  "2Timothy", "Titus", "Philemon", "Hebrews", "James", "1Peter", "2Peter", "1John", "2John",
  "3John", "Jude", "Revelation"
].map(name => url(`kjv/${name}.json`));

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      await shell.addAll(SHELL_FILES);
      // The Bible text is a bonus: if it can't be fetched now, it is cached as it is read.
      try {
        const books = await caches.open(BOOKS);
        await books.addAll(BOOK_FILES);
      } catch (error) {
        // ignore
      }
    })()
  );
});

// The page asks the waiting worker to take over once the player taps "Reload" on the update toast.
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter(name => !KEEP.includes(name)).map(name => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const target = new URL(request.url);
  if (target.origin !== self.location.origin || target.pathname.includes("/__/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(request));
  } else if (target.pathname.includes("/assets/")) {
    event.respondWith(cacheFirst(request, ASSETS));
  } else if (target.pathname.includes("/kjv/")) {
    event.respondWith(staleWhileRevalidate(request, BOOKS));
  } else {
    event.respondWith(staleWhileRevalidate(request, SHELL));
  }
});

// Pages: try the network, remember the answer, and use the saved page when offline.
async function pageNetworkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(url("index.html"), response.clone());
    }
    return response;
  } catch (error) {
    return (await cache.match(url("index.html"))) || (await cache.match(url("offline.html")));
  }
}

// Hashed build files never change, so a saved copy is always right.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  if (saved) {
    return saved;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trimCache(cache, MAX_ASSETS);
  }
  return response;
}

// Answer from the saved copy straight away and refresh it in the background.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  const refresh = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => saved);
  return saved || refresh;
}

// Keep old builds' files from piling up: drop the oldest saved entries past the limit.
async function trimCache(cache, max) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) {
    await cache.delete(key);
  }
}
