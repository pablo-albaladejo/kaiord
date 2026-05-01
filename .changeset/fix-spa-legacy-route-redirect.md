---
"@kaiord/workout-spa-editor": patch
---

fix(spa-editor): redirect legacy SPA bookmarks (`/calendar`, `/library`, `/workout/*`) to `/editor/<path>`

Pre-fix bookmarks pointing at `kaiord.com/<route>` (without the `/editor/` prefix) were dropping users on the landing's blue 404. The deploy-time rafgraph fallback now also handles a closed allowlist of legacy SPA routes — `/calendar`, `/calendar/<weekId>`, `/library`, `/workout`, `/workout/<id>` — and redirects them to `kaiord.com/editor/<path>` so the SPA loads at the intended view. Unrelated 404s (`/typo`, `/calendarx`, etc.) continue to surface the landing's blue 404 as before.
