---
"@kaiord/workout-spa-editor": patch
---

Park the `bridgeDiscovery` singleton on `globalThis` so Vite HMR doesn't split it into two instances. Without this, editing any module in the bridge-discovery import chain caused the React `useSyncExternalStore` hook to keep listening to the previous instance while a fresh one took over the imports — leaving "the discovery says it has the bridges but my hooks don't see them" bugs that only show up in dev. The first hard reload always recovered. New unit test asserts the singleton is on `globalThis` so future regressions are caught at CI time.
