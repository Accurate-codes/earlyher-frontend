/*
 * EarlyHer service worker: keeps the core screens working without a connection.
 *
 * What is cached: the application's own pages, scripts, styles, fonts, images, audio
 * and the public facility snapshot (/data/). All of it is identical for every person.
 *
 * What is never cached: anything sent with POST, anything on another origin (the
 * Python backend, map tiles, Google Maps), and anything under /api/. Map tiles are
 * deliberately not stored: the tile provider's terms forbid offline/bulk caching.
 * Answers, phone numbers and locations never reach this file; they live in page memory.
 */

// The page registers this file as /sw.js?v=<build id>, so each deployment gets fresh caches.
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PREFIX = "earlyher-";
const PAGES = `${PREFIX}${VERSION}-pages`;
const ASSETS = `${PREFIX}${VERSION}-assets`;
const ROUTE_DATA = `${PREFIX}${VERSION}-route-data`;

// Screens that must open offline. Add new static routes and audio files here.
const PRECACHE_PAGES = [
  "/",
  "/concern",
  "/next-step",
  "/no-concern",
  "/summary",
  "/privacy",
  "/learn",
  "/learn/know-your-breasts",
  "/learn/changes-to-look-out-for",
  "/learn/healthy-breast-habits",
  "/learn/when-to-see-a-healthcare-professional",
  "/healthcare",
];

// The facility snapshot is precached so the list and search work offline (CC BY 4.0 data).
const PRECACHE_URLS = [
  "/brand/earlyher-logo.png",
  "/brand/icon-192.png",
  "/manifest.webmanifest",
  "/data/facilities-lagos.json",
];

const NAVIGATION_TIMEOUT_MS = 4000;

async function precache() {
  const pages = await caches.open(PAGES);
  const assets = await caches.open(ASSETS);
  const assetUrls = new Set(PRECACHE_URLS);

  await Promise.all(
    PRECACHE_PAGES.map(async (path) => {
      const response = await fetch(path, { cache: "reload", credentials: "same-origin" });
      if (!response.ok) throw new Error(`Could not precache ${path}`);
      // Each page lists the build files it needs; collect them so they are cached too.
      const html = await response.clone().text();
      for (const match of html.matchAll(/\/_next\/static\/[^"'\\\s)<>]+/g)) assetUrls.add(match[0]);
      await pages.put(path, response);
    }),
  );

  await Promise.all(
    [...assetUrls].map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await assets.put(url, response);
      } catch {
        // A single missing asset must not block installation.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(PREFIX) && ![PAGES, ASSETS, ROUTE_DATA].includes(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Full page loads: fresh from the network when possible, otherwise the cached screen. */
async function handleNavigation(request) {
  const cache = await caches.open(PAGES);
  const url = new URL(request.url);
  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    if (response.ok && PRECACHE_PAGES.includes(url.pathname)) cache.put(url.pathname, response.clone());
    return response;
  } catch {
    // Any unknown page falls back to the welcome screen.
    return (await cache.match(url.pathname)) || (await cache.match("/")) || Response.error();
  }
}

/** Build files are named by content hash, so a cached copy never goes stale. */
async function handleAsset(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Images, audio and icons from /public: serve the cached copy at once and refresh it in the background. */
async function handlePublicFile(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request, { ignoreVary: true });
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await refresh) || Response.error();
}

/**
 * Data the Next.js router fetches when moving between screens. These responses are
 * static per build. Offline, the stored copy for the same URL is used; failing that,
 * a copy for the same route. If neither exists the request fails and the router
 * falls back to a full page load, which handleNavigation serves from cache.
 */
async function handleRouteData(request) {
  const cache = await caches.open(ROUTE_DATA);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request.url, response.clone());
    return response;
  } catch (error) {
    const exact = await cache.match(request.url);
    if (exact) return exact;
    const url = new URL(request.url);
    const wanted = request.headers.get("next-router-segment-prefetch");
    for (const key of await cache.keys()) {
      const candidate = new URL(key.url);
      if (candidate.pathname !== url.pathname) continue;
      if (wanted === null) return cache.match(key);
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
  } else if (request.headers.has("rsc") || url.searchParams.has("_rsc")) {
    event.respondWith(handleRouteData(request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleAsset(request));
  } else if (!url.pathname.startsWith("/_next/")) {
    event.respondWith(handlePublicFile(request));
  }
});
