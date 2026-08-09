> Completed: 2026-08-09

## Why

Every deep URL of the SPA answers **HTTP 404 on the way in**. Measured against production:

```
200  /editor/
404  /editor/calendar/2026-W32   → "Page not found — Kaiord"
404  /editor/library             → "Page not found — Kaiord"
```

The page the user sees first is the landing's 404, which then redirects into the app. The flash is not a rendering accident: `scripts/inject-spa-fallback.mjs` **appends** the redirect script to `404.html`, so it lands at byte 3208 while `</body>` closes at 3161. The browser paints the whole error page before it reaches the script.

This is not a defect against the current spec — it _is_ the current spec. `spa-routing` states that on a deep refresh "the static host SHALL serve the merged-dist `404.html`, the rafgraph fallback SHALL restore the URL". The design was written when the SPA lived under a deploy prefix and GitHub Pages was the host, and the 404 round-trip was accepted as the mechanism.

Two things make it worth revisiting now:

**The contract the user wants is stricter.** A URL that exists should never answer 404 on the way to itself. On GitHub Pages a 200 comes from one place only — a file that exists at that path — and the SPA's routes include unbounded ones (`/workout/:id` is a UUID) that cannot be pre-generated. Per-directory `404.html` does not help either: measured, Pages serves the root `404.html` even where `/docs/404.html` exists (byte-identical response, same hash). The only way to keep the requested path always resolvable is to stop carrying the route in the path.

**`/editor` no longer describes the product.** The SPA owns the calendar, the daily view, the library, health, nutrition, chat, the athlete profile and settings. Editing a workout is one surface among many.

The existing e2e suite is worth naming: `spa-route-refresh.spec.ts` pins five scenarios about the 404 round-trip, and none of them asserts that no 404 occurred — they assert the URL is _restored_. The suite was written for the workaround, which is why the reported behaviour coexisted with a green CI.

## What Changes

**The route leaves the path.** Wouter is mounted with a fragment location hook instead of `<Router base>`. The browser requests `/app/`, which is a real file, so every route — including `/app/#/workout/<uuid>` — resolves in one 200 request with no redirect and no flash.

The hook is ours (`src/lib/fragment-location.ts`, ~60 lines) rather than wouter's shipped `useHashLocation`, for one reason found by running the suite against it: wouter keeps the path in the fragment but the query in `location.search`, and its `navigate` writes the search **only when the target restates one**. A query therefore outlives the route that set it — open `/workout/new?date=2026-06-05`, leave for `/daily`, and the stale date arrives with you, rendering the wrong day. The SPA reads `useSearch()` on eight surfaces. Putting the whole route in the fragment, with a matching `searchHook`, keeps navigation semantics identical to the browser location the app was written against.

**`/editor` becomes `/app`.** Vite's `VITE_BASE_PATH`, the merged-dist layout, the landing's links and the five bridge popups follow.

**`/editor/*` keeps working, indefinitely.** The `404.html` script stays, no longer as the normal path but as a bridge for URLs already shared or bookmarked — including the "Open editor" link inside five published Chrome extensions whose store updates are blocked. It now translates a legacy path into the hash form. The bridge is not a deprecation window: it has no end date, because the links it serves are outside our control.

**The redirect script moves into `<head>`.** For the legacy paths it still serves, it must run before the browser paints an error page — and the injector's check moves from "the snippet is present" to "the snippet precedes any visible markup", because the present-but-last placement is exactly what passed for months.

## Impact

- **Specs**: `spa-routing` — the base-alignment requirement is replaced by hash location; the 404 round-trip stops being the normal path and is re-scoped to legacy URLs.
- **Code**: `main.tsx` (router hook), `router-base.ts` (retired or re-scoped), `build-route-error-payload.ts` (reads the route, not `location.pathname`), `scripts/inject-spa-fallback.mjs` (head injection + position check), `.github/workflows/deploy-site.yml`, the landing's links, five bridge popups.
- **Tests**: `spa-route-refresh.spec.ts` is rewritten around the new contract — the first response is 200 and no error page is painted — and the e2e suite's `goto()` URLs move to the hash form.
- **Not affected**: analytics. Umami runs with `data-auto-track="false"` and page views are submitted with the wouter path, not `location.pathname`, so hash routing changes nothing there. Verified in `umami-analytics.ts` and pinned by the suite's "analytics paths remain base-relative" scenario.
- **Not affected**: the extensions' messaging. Their manifests match `https://*.kaiord.com/*`, with no path component, so the rename cannot break the bridge transport — only the courtesy link in each popup, which the bridge covers.
- **Landing and docs are already correct**: both answer 200 today (`/es` answers 301, a redirect and not a failure), so this change is scoped to the SPA.
