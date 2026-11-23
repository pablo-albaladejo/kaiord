// The Kaiord App's service worker, part 2 of 3: client-keyed retention
// (design D3). Concatenated after sw-precache.js.
/* global META, OWN, metaKey, idOf, kindOf, appCaches, PENDING_MS */
/* exported serial, windowsInScope, record, prune */

let chain = Promise.resolve();
const serial = (task) => {
  const run = chain.then(task);
  chain = run.catch(() => undefined);
  return run;
};

const windowsInScope = async () =>
  (
    await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  ).filter((client) => new URL(client.url).pathname.startsWith(SW.scope));

async function record(clientId, entry) {
  const versions = [];
  for (const name of await appCaches()) {
    if (await (await caches.open(name)).match(entry)) versions.push(name);
  }
  const meta = await caches.open(META);
  await meta.put(
    metaKey("client", clientId),
    new Response(JSON.stringify(versions))
  );
}

async function readMeta(meta) {
  const clients = new Map();
  const pending = [];
  for (const request of await meta.keys()) {
    const body = await (await meta.match(request)).text();
    if (kindOf(request) === "client") {
      clients.set(idOf(request), { request, versions: JSON.parse(body) });
    } else pending.push({ request, name: idOf(request), at: Number(body) });
  }
  return { clients, pending };
}

// Design D3: a cache lives while a live window runs it. A window with no
// record yet may still have its hello in flight, so nothing is deleted.
async function prune() {
  const windows = await windowsInScope();
  const meta = await caches.open(META);
  const { clients, pending } = await readMeta(meta);
  if (windows.some((client) => !clients.has(client.id))) return;
  const live = new Set(windows.map((client) => client.id));
  const keep = new Set([OWN]);
  for (const [id, { request, versions }] of clients) {
    if (live.has(id)) versions.forEach((name) => keep.add(name));
    else await meta.delete(request);
  }
  for (const { request, name, at } of pending) {
    if (Date.now() - at < PENDING_MS) keep.add(name);
    else await meta.delete(request);
  }
  for (const name of await appCaches()) {
    if (!keep.has(name)) await caches.delete(name);
  }
}
