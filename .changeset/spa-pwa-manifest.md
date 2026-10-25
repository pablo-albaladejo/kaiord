---
"@kaiord/workout-spa-editor": minor
---

Make the editor installable as an app: `index.html` links a web app manifest scoped to `/app/` (standalone display, the brand dark theme colour, 192, 512 and maskable icons). No service worker is registered, so every deploy is still picked up on the next load.
