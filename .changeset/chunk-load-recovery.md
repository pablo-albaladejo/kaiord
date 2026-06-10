---
"@kaiord/workout-spa-editor": patch
---

Recover automatically from stale lazy chunks after a deploy

When a new build ships, the hashed lazy route chunks change; a browser tab still
running the previous `index` fails to import the old chunk ("Failed to fetch
dynamically imported module") and lands on the route error screen. The app now
reloads once to pull the fresh build — both on Vite's `vite:preloadError` event
and when the failure surfaces through the route error boundary — guarded by a
sessionStorage cooldown so a genuinely-unfetchable chunk never causes a reload loop.
