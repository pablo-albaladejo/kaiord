// The Kaiord App's service worker, part 1 of 3: precache (openspec
// add-spa-offline-service-worker, design D1-D2). The emitter writes the
// config line `const SW = { scope, version, manifest: [{ url, revision, key
// }] };` and then concatenates sw-precache.js, sw-retention.js and sw.js
// into app/sw.js, one classic script.
//
// It caches only what the manifest lists, at install, byte for byte, and
// never a response on first use.
/* exported PREFIX, META, OWN, SHELL, KEYS, PENDING_MS, metaKey, idOf, kindOf, appCaches, matchIn, install */
const PREFIX = "kaiord-app-";
const META = `${PREFIX}meta`;
const OWN = `${PREFIX}${SW.version}`;
const SHELL = `${SW.scope}index.html`;
const KEYS = new Map(SW.manifest.map((entry) => [entry.url, entry.key]));
// A newer worker still installing has no client yet; its cache is spared
// for this long, after which a marker left by a failed install is dropped.
const PENDING_MS = 60 * 60 * 1000;

const metaKey = (kind, id) =>
  new URL(`${SW.scope}__sw/${kind}/${encodeURIComponent(id)}`, self.location)
    .href;
const idOf = (request) =>
  decodeURIComponent(request.url.slice(request.url.lastIndexOf("/") + 1));
const kindOf = (request) => request.url.split("/__sw/")[1].split("/")[0];

const hex = async (response) => {
  const bytes = await response.clone().arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const appCaches = async () =>
  (await caches.keys()).filter((n) => n.startsWith(PREFIX) && n !== META);

async function matchIn(names, key) {
  for (const name of names) {
    const hit = await (await caches.open(name)).match(key);
    if (hit) return hit;
  }
  return undefined;
}

async function fill(cache, { key, revision }) {
  for (const name of await appCaches()) {
    if (name === OWN) continue;
    const old = await (await caches.open(name)).match(key);
    if (old && (await hex(old)) === revision) return cache.put(key, old);
  }
  const response = await fetch(key, { cache: "reload" });
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  if ((await hex(response)) !== revision) {
    throw new Error(`${key}: the bytes served differ from the manifest`);
  }
  return cache.put(key, response);
}

async function install() {
  const meta = await caches.open(META);
  await meta.put(metaKey("pending", OWN), new Response(String(Date.now())));
  const cache = await caches.open(OWN);
  try {
    await Promise.all(SW.manifest.map((entry) => fill(cache, entry)));
  } catch (error) {
    await caches.delete(OWN);
    await meta.delete(metaKey("pending", OWN));
    throw error;
  }
}
