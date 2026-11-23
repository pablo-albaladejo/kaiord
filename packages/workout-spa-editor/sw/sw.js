// The Kaiord App's service worker, part 3 of 3: its events (design D1,
// D4, D7). Concatenated after sw-precache.js and sw-retention.js.
//
// It answers the shell for exactly <scope> and <scope>index.html, and the
// precached files; every other request, including anything outside <scope>
// (the landing, the docs, /mcp, /a2a), goes to the network untouched.
/* global META, OWN, SHELL, KEYS, metaKey, appCaches, matchIn, install, serial, windowsInScope, record, prune */

self.addEventListener("install", (event) => event.waitUntil(install()));

self.addEventListener("activate", (event) => {
  event.waitUntil(
    serial(async () => {
      await (await caches.open(META)).delete(metaKey("pending", OWN));
      await prune();
    })
  );
});

const keyFor = (request, url) => {
  if (request.mode === "navigate") {
    const isShell = url.pathname === SW.scope || url.pathname === SHELL;
    return isShell ? KEYS.get(SHELL) : undefined;
  }
  if (url.search !== "") return undefined;
  if (KEYS.has(url.pathname)) return KEYS.get(url.pathname);
  // A window still on an older version asks for that version's chunks,
  // which only a retained cache of that version holds.
  const isChunk =
    url.pathname.startsWith(`${SW.scope}assets/`) &&
    !url.pathname.endsWith(".map");
  return isChunk ? url.pathname : undefined;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const key = keyFor(request, url);
  if (!key) return;
  event.respondWith(
    (async () => {
      const hit = await matchIn([OWN, ...(await appCaches())], key);
      return hit ?? fetch(request);
    })()
  );
});

self.addEventListener("message", (event) => {
  const { type, entry } = event.data ?? {};
  const source = event.source;
  if (type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  } else if (type === "CLIENT_COUNT" && source) {
    event.waitUntil(
      windowsInScope().then((list) =>
        source.postMessage({ type: "CLIENT_COUNT", count: list.length })
      )
    );
  } else if (type === "HELLO" && source && typeof entry === "string") {
    event.waitUntil(
      serial(() => record(source.id, entry)).then(() => serial(prune))
    );
  }
});
