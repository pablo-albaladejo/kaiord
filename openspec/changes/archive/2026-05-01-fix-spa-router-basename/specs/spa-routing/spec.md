## ADDED Requirements

### Requirement: SPA router base alignment with Vite deploy base

The `@kaiord/workout-spa-editor` SPA bootstrap (`packages/workout-spa-editor/src/main.tsx`) SHALL wrap `<App />` in wouter's `<Router>` component with a `base` prop derived from `import.meta.env.BASE_URL`. The derivation SHALL strip the trailing slash that Vite always emits, yielding an empty string in dev (`BASE_URL = "/"` → `base = ""`) or a path without trailing slash in production (`BASE_URL = "/editor/"` → `base = "/editor"`).

The strip is centralised in a pure helper `computeRouterBase(baseUrl: string): string` exported from `packages/workout-spa-editor/src/router-base.ts` so the rule is testable without rendering the JSX tree. Vite's `BASE_URL` always begins and ends with `/` (verified in Vite's `resolveBaseUrl`); the helper relies on that invariant and the unit test catches any future divergence.

The requirement exists to prevent a subpath-deployed SPA from emitting URLs that diverge from the deploy path. Without `<Router base>`, wouter's catch-all `<Redirect to="/calendar" />` writes `/calendar` to the address bar even though the SPA itself is served from `/editor/`. On refresh, GitHub Pages cannot serve `/calendar` because no asset lives at that path, falls back to the landing's blue 404, and the previously-shipped rafgraph fallback (rooted under `cleanup-open-issues-may-2026`, scoped to `/editor/*` paths) does not match. Aligning wouter's base with Vite's deploy base closes this class of bug at the source. The two requirements compose: rafgraph restores the URL pre-mount, then wouter's base resolves the deep route.

A unit test (`packages/workout-spa-editor/src/router-base.test.ts`) SHALL exercise `computeRouterBase` against representative inputs (`/`, `/editor/`, `/a/b/`, ``). An end-to-end test (`packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`, gated by `E2E_PROD_BASE=1`) SHALL build the SPA with `VITE_BASE_PATH=/editor/`, serve the merged dist via a static file server that returns 404 for unknown paths (no SPA fallback, mimicking GitHub Pages exactly), and verify a deep URL refresh keeps the SPA bundle and the route.

#### Scenario: Wouter is wrapped at SPA bootstrap

- **WHEN** `packages/workout-spa-editor/src/main.tsx` is parsed and rendered
- **THEN** the rendered tree SHALL include a wouter `<Router base={...}>` wrapping `<App />`, where `base` is the value returned by `computeRouterBase(import.meta.env.BASE_URL)`

#### Scenario: computeRouterBase strips the Vite trailing slash

- **WHEN** `computeRouterBase` is invoked with each of `"/"`, `"/editor/"`, `"/a/b/"`, `""`
- **THEN** the helper SHALL return `""`, `"/editor"`, `"/a/b"`, `""` respectively

#### Scenario: Production base produces deploy-prefixed URLs

- **WHEN** the SPA is built with `VITE_BASE_PATH=/editor/` and a user navigates from the SPA root to the calendar route
- **THEN** the address bar SHALL read a URL prefixed with `/editor/` (e.g. `/editor/calendar`), NOT a root-relative URL (`/calendar`)

#### Scenario: Refreshing a deep SPA URL keeps the SPA

- **WHEN** the SPA is served via a static file server that returns 404 for unknown paths (no SPA fallback) and the user refreshes a deep URL such as `/editor/calendar`
- **THEN** the static host SHALL serve the merged-dist `404.html`, the previously-shipped rafgraph fallback SHALL restore the URL pre-mount (per the existing rafgraph injection helper at `scripts/inject-spa-fallback.mjs`), the SPA's router SHALL strip the configured base before route matching, and the calendar view SHALL re-render — no blue 404 page

#### Scenario: Dev-mode behaviour is unchanged

- **WHEN** the SPA runs under `pnpm dev` (Vite dev server, `BASE_URL = "/"`) and a user navigates to the calendar route
- **THEN** the address bar SHALL read `/calendar` with no `/editor/` prefix; wouter base resolves to the empty string in dev so this scenario asserts the fix is non-disruptive at the dev path

#### Scenario: Analytics paths remain base-relative

- **WHEN** the SPA runs in production base (`/editor/`) and the user navigates to the calendar route, triggering an analytics page-view event
- **THEN** the analytics emitter SHALL have been invoked at least once (guards against a future refactor that silently stops emitting page views), AND the captured path SHALL be `/calendar` (the router's base-stripped value), NOT `/editor/calendar`. Existing analytics dashboards see the same paths as before the fix

#### Scenario: Garbage path under the deploy base resolves to the catch-all

- **WHEN** a user requests `/editor/<malformed-path>` directly (cold) on a Pages-equivalent host
- **THEN** the rafgraph round-trip SHALL restore the URL, the SPA's router SHALL strip the configured base, the SPA's catch-all route SHALL redirect to the canonical calendar route, the URL bar SHALL settle at `/editor/calendar`, and no infinite redirect loop or XSS SHALL occur (the address bar containing user-supplied characters is treated as a path string by `history.replaceState`, never as HTML)
