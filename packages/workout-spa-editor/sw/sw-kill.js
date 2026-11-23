// The kill switch (design D8). It replaces a broken worker at once, deletes
// every cache of the App, unregisters, and reloads only the windows it
// controls. A reloaded window is uncontrolled, so when it registers this
// worker again, the worker activates over no window and reloads nobody.

// Chromium does not always honour a skipWaiting() made while installing
// (seen under Playwright: the worker stayed waiting); asked again once
// installed, it activates.
const INSTALLED_RETRY_MS = 100;

self.addEventListener("install", () => {
  self.skipWaiting();
  setTimeout(() => self.skipWaiting(), INSTALLED_RETRY_MS);
});

const removeEverything = async () => {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith("kaiord-app-"))
      .map((name) => caches.delete(name))
  );
  await self.registration.unregister();
};

// Outside waitUntil on purpose: Firefox holds a navigation until the worker
// has activated, so a reload awaited inside activation never completes.
const reloadControlledWindows = async () => {
  const windows = await self.clients.matchAll({ type: "window" });
  await Promise.all(
    windows.map((client) => client.navigate(client.url).catch(() => undefined))
  );
};

self.addEventListener("activate", (event) => {
  const removed = removeEverything();
  event.waitUntil(removed);
  removed.then(reloadControlledWindows, () => undefined);
});
