## Why

The Phase 2 SPA-fallback fix in `cleanup-open-issues-may-2026` (PR #398) shipped the rafgraph redirect script wrapped behind a `pathname.indexOf('/editor/') === 0` guard, on the assumption that the editor's React Router resolves URLs under the `/editor/` deploy prefix. This assumption is wrong in production: the SPA uses **wouter**, and `main.tsx` does not wrap `<App />` in a `<Router>` with a `base` prop. The default wouter Router base is the empty string, so wouter's routes (`/`, `/calendar`, `/library`, `/workout/new`, `/workout/:id`) match against the address-bar pathname WITHOUT any deploy prefix.

Concrete reproduction (verified by user screenshot — `kaiord.com/calendar` shows the landing's blue 404):

1. User opens `kaiord.com/editor/`. SPA loads from `/editor/index.html`; assets resolve at `/editor/assets/...` (Vite `base: "/editor/"`).
2. Wouter sees pathname `/editor/`, doesn't match any explicit route, hits the catch-all and `<Redirect to="/calendar" />` fires. URL bar becomes `kaiord.com/calendar` (no `/editor/` prefix).
3. SPA renders fine because it's already loaded.
4. User refreshes `kaiord.com/calendar`. GitHub Pages has no `/calendar/index.html`, falls back to root `404.html`.
5. Root `404.html` runs the rafgraph redirect script, but the path-prefix guard `pathname.indexOf('/editor/') === 0` is false, so the script no-ops and the user sees the landing's blue 404.

The deploy fix already handles `/editor/*` correctly — what's missing is for the SPA to actually emit `/editor/*` URLs in the address bar.

## What Changes

A one-line fix in `packages/workout-spa-editor/src/main.tsx`: wrap `<App />` in wouter's `<Router base={...}>` derived from `import.meta.env.BASE_URL` (which Vite already exposes — `/` in dev, `/editor/` in production). Wouter prepends the base to every route match and to every `<Redirect to>` / `useLocation` write, so:

- `<Redirect to="/calendar" />` becomes `kaiord.com/editor/calendar` instead of `kaiord.com/calendar`.
- A user navigating into the SPA sees `/editor/<route>` in the address bar and can refresh that URL.
- The rafgraph script's existing `/editor/*` guard now matches the user's actual URL on refresh.

The fix is conceptually correct (a SPA deployed at a subpath SHOULD declare its base) and aligns wouter's behaviour with Vite's `base` config that already governs the asset emission path.

A regression test is added at the unit level (assert `main.tsx` wraps in `<Router base={...}>` resolving from `import.meta.env.BASE_URL`) and at the e2e level (build with `VITE_BASE_PATH=/editor/`, serve the built artifact with a static server that does NOT expose SPA fallback, verify a deep refresh against `/editor/calendar` returns the SPA bundle via the rafgraph 404).

## Impact

- **Affected specs**: NEW capability `spa-routing` (1 ADDED requirement: "SPA router base alignment with Vite deploy base", 7 scenarios). The new capability has its own Purpose paragraph covering routing-layer rules; future routing invariants land here without contorting another spec.
- **Affected code**:
  - `packages/workout-spa-editor/src/router-base.ts` (new) — pure helper `computeRouterBase(baseUrl: string): string` that strips Vite's trailing slash.
  - `packages/workout-spa-editor/src/router-base.test.ts` (new) — table-driven Vitest exercising the helper.
  - `packages/workout-spa-editor/src/main.tsx` — wrap `<App />` in `<Router base={computeRouterBase(import.meta.env.BASE_URL)}>`.
  - `packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts` (new) — Playwright e2e gated by `E2E_PROD_BASE=1`, builds with `VITE_BASE_PATH=/editor/`, serves via a Pages-equivalent static fixture, exercises 5 sub-tests (cold deep refresh, in-app navigation prefix, refresh round-trip, analytics base-relativity, garbage-path catch-all).
  - `packages/workout-spa-editor/e2e/fixtures/static-pages-server.ts` (likely new) — small Node `http` fixture if `http-server` proves unreliable; mimics GitHub Pages 404 behaviour.
  - `.github/workflows/ci.yml` — new `e2e-prod-base` job running the gated spec.
  - `packages/workout-spa-editor/e2e/...` — sweep for hardcoded production-base URL assertions; update any that would diverge under the new prefix.
- **Affected tests**: The existing `routes.test.tsx` (6 cases) tests wouter behaviour at the component layer with no Router base wrapper — passes unchanged. The dev-mode Playwright suite (`pnpm test:e2e` without `E2E_PROD_BASE`) runs against `pnpm dev` where `BASE_URL = "/"` and wouter base resolves to `""` — passes unchanged.
- **Risk**:
  - **Risk-1 — Existing test URL assertions**: covered by sweep task 4.7. Dev-mode default keeps wouter base empty; only production-base tests need explicit `/editor/` prefixes.
  - **Risk-2 — Wouter base edge cases**: the helper extraction with table-driven unit tests catches trailing-slash and empty-base cases; the e2e covers the integrated runtime behaviour.
  - **Risk-3 — Bookmark behaviour change**: a user who shares `kaiord.com/calendar` before this fix sees the URL change to `kaiord.com/editor/calendar` after the fix. The pre-fix URL never survived refresh, so no working state regresses.
  - **Risk-4 — No new redirect surface**: the rafgraph script's redirect target is hardcoded same-origin `/editor/?p=<encoded>`. The decoder's `history.replaceState` updates the URL bar (no markup execution). Wouter base only changes the route-matching prefix. No new XSS or open-redirect surface introduced.
- **Out of scope**: No changes to `.github/workflows/deploy-site.yml`'s rafgraph script — its `/editor/*` guard is correct; this fix makes the SPA's URLs match what the script already handles. No changes to the docs surface (`/docs/...`) — VitePress generates its own per-route HTML and does not have this issue.
