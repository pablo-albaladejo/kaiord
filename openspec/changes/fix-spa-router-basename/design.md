## Context

`cleanup-open-issues-may-2026` Phase 2 (PR #398, archived 2026-05-01) shipped a rafgraph SPA-fallback in `.github/workflows/deploy-site.yml`:

- Root `merged-dist/404.html` carries an inline redirect script that captures the requested path, encodes it into `?p=<encoded>`, and `window.location.replace`s to `/editor/?p=<encoded>` — but **only if** the original pathname starts with `/editor/`.
- `merged-dist/editor/index.html` carries an inline decoder that runs before React boots, restoring the path via `history.replaceState`.

The guard `pathname.indexOf('/editor/') === 0` was added so non-editor 404s on the landing surface (e.g. `kaiord.com/typo-here`) keep falling through to the landing's blue 404 markup instead of being aggressively redirected into the SPA.

User-reported regression (2026-05-01): refreshing `kaiord.com/calendar` returns the blue 404. Investigation:

```
  ┌──────────────────────────────────────────────────────────┐
  │  vite.config.ts:44                                       │
  │  base: process.env.VITE_BASE_PATH || "/"                 │
  │  → CI sets VITE_BASE_PATH=/editor/ → assets at /editor/  │
  │                                                          │
  │  main.tsx                                                │
  │  No <Router> wrapper. App imported and rendered raw.     │
  │  → Wouter's default Router base = "" (empty string)      │
  │                                                          │
  │  App.tsx:25-52                                           │
  │  <Route path="/"> <Redirect to="/calendar" />            │
  │  <Route path="/calendar/:weekId?">                       │
  │  <Route path="/library">                                 │
  │  <Route path="/workout/new"> ...                         │
  │  → Routes declared at root, no /editor prefix anywhere   │
  └──────────────────────────────────────────────────────────┘
```

Mismatch: Vite emits assets under `/editor/`, wouter emits URLs at root. The SPA loads (assets resolve), wouter immediately runs the catch-all `<Redirect to="/calendar" />`, the URL bar reads `/calendar`, and any subsequent refresh fails.

## Goals / Non-Goals

**Goals**

- A user refreshing any in-app SPA URL on `kaiord.com` keeps the SPA bundle and the route, with no 404 flash.
- The fix is local to the SPA (one-line wrap in `main.tsx`); the deploy workflow's existing rafgraph script keeps its `/editor/*` guard unchanged.
- Existing 6-case `routes.test.tsx` continues to pass.
- A regression test prevents this exact bug from re-introducing silently.

**Non-Goals**

- Generalising the rafgraph script to redirect non-`/editor/` paths (band-aid for the symptom; misses the architectural root cause).
- Rewriting wouter routes to hardcode `/editor/calendar` etc. (verbose, ties source to deploy path).
- Migrating off wouter to React Router or anything else.
- Changing the docs surface routing.

## Decisions

### D1. Use wouter's `<Router base={...}>` API derived from `import.meta.env.BASE_URL`.

Wouter exports a `Router` component that accepts a `base` prop — see https://github.com/molefrog/wouter#router-base-baseroute-children. Setting `base="/editor"` makes:

- `useLocation()` return paths relative to the base (so `<Route path="/calendar">` continues to match the user being at `/editor/calendar`).
- `<Redirect to="/calendar" />` produce an absolute URL of `/editor/calendar`.
- All wouter `<Link>` components emit `/editor/<href>` URLs.

Vite already exposes the deploy base at `import.meta.env.BASE_URL`. In dev: `/`. In prod (with `VITE_BASE_PATH=/editor/`): `/editor/`. Wouter's `base` accepts an empty string OR a path without trailing slash, so the value passed becomes:

```ts
const base = computeRouterBase(import.meta.env.BASE_URL);
// dev:  base = ""        (wouter treats as no-base)
// prod: base = "/editor"
```

`computeRouterBase` (defined in `router-base.ts` per D2) strips the trailing slash that Vite always emits.

**Rafgraph ↔ wouter-base handoff (interaction with the prior `cleanup-open-issues-may-2026` rafgraph requirement).** The 404 redirect script captures `l.pathname` (e.g. `/editor/calendar`) and bounces to `/editor/?p=%2Feditor%2Fcalendar`. The decoder injected into `editor/index.html` runs **synchronously before React mounts** and calls `history.replaceState(null, "", "/editor/calendar" + hash)`. By the time wouter's `<Router base="/editor">` reads `window.location.pathname`, the URL already carries the `/editor/` prefix that wouter then strips for route matching. The two requirements compose cleanly: rafgraph restores the URL; wouter base resolves the deep route.

### D2. Test surface — pure helper unit test + e2e against production-base build.

Two tests guard the rule:

**Unit test** (`packages/workout-spa-editor/src/router-base.test.ts`): exercises a pure exported helper `computeRouterBase(baseUrl: string): string` declared in `packages/workout-spa-editor/src/router-base.ts` and consumed by `main.tsx`. The helper centralises the trailing-slash strip so the rule is testable in isolation, table-driven, and survives JSX-shape refactors:

| input        | expected output |
| ------------ | --------------- |
| `"/"`        | `""`            |
| `"/editor/"` | `"/editor"`     |
| `"/a/b/"`    | `"/a/b"`        |
| `""`         | `""`            |

The helper exists so the unit test is behavioural (not a source-grep). `main.tsx` imports `computeRouterBase` and applies it to `import.meta.env.BASE_URL`. Vite normalises `BASE_URL` to always start AND end with `/` (verified in Vite's `resolveBaseUrl`), so the regex-strip's correctness is grounded in that invariant; if Vite ever changes the contract, the unit test catches the discrepancy.

**E2E test** (`packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`, new): builds the SPA with `VITE_BASE_PATH=/editor/`, serves the merged dist (including the rafgraph 404) via a static server that does NOT expose SPA fallback, then:

- GET `/editor/calendar` directly. Asserts the response is the SPA bundle (entry script tag) — proves Pages-equivalent fallback works.
- Navigate to `/editor/`, then click into the calendar route, observe the URL becomes `/editor/calendar` (NOT `/calendar`).
- Refresh from inside the SPA. Asserts the URL stays `/editor/calendar` and the calendar view re-renders.

### D3. Tests existing today vs new.

- `routes.test.tsx` (6 cases) tests wouter's `<Switch>` matching at the component level, NOT against full URLs. With the new `<Router base="">` wrapper (default in tests where `BASE_URL` is not set or is `/`), behaviour is identical. Should pass unchanged.
- E2E tests under `packages/workout-spa-editor/e2e/` run against `pnpm dev` which uses Vite's dev server with `base: "/"`. Wouter base resolves to `""`, behaviour is identical to today. No e2e file edits required for dev-mode runs.
- The new `spa-route-refresh.spec.ts` is the only test that exercises the production-base build. It runs as part of the standard e2e suite if the CI provides `VITE_BASE_PATH` — otherwise it skips with a `test.skip` guard so local `pnpm test:e2e` keeps working.

### D4. Spec capability home.

The new requirement creates a new `spa-routing` capability with the rule as its single requirement. Two options were considered:

1. **Add to `spa-quality-gates`** (capability created in `cleanup-open-issues-may-2026`). Rejected: that capability's Purpose narrowly says "Mechanically enforced repo-wide quality gates implemented as static-source `pnpm test:scripts` checks" — but the new rule is enforced by Vitest unit + Playwright e2e, not by `pnpm test:scripts`. Updating the Purpose paragraph through a change delta is awkward in OpenSpec (deltas express ADDED/MODIFIED/REMOVED at the requirement level, not the capability-Purpose level), and broadening the Purpose dilutes the capability's identity.
2. **Create a new `spa-routing` capability**. Adopted. Single-requirement specs have a direct precedent — `spa-quality-gates` itself shipped with one requirement and has room to grow. The capability's Purpose paragraph self-describes the routing/deploy-alignment rules without contorting another spec.

The new `spa-routing` capability's Purpose: "Routing-layer rules for the SPA editor, including alignment between client-side router base configuration and Vite deploy base, plus any additional invariants needed to keep deep URLs refresh-safe under static hosting." Future routing rules (e.g., reserved-path policy, deep-link navigation contracts) land in the same capability without reopening this scope debate.

## Risks / Trade-offs

- **R1 — wouter `base` edge cases.** Trailing slash, empty base, redirect interaction. Mitigation: D2 unit + e2e tests; behaviour verified against the wouter source / docs before merge.
- **R2 — bookmark breakage.** Anyone with a bookmark pointing at `kaiord.com/calendar` (without `/editor/` prefix) will see the URL change to `kaiord.com/editor/calendar` after this fix. The old URL never worked across refresh — the bookmark was already broken — so this is a no-regression. Calling it out for the PR description so any external observers (mostly the user themselves) understand.
- **R3 — analytics URL change.** `analytics.pageView(path)` is called from `App.tsx:72` with `path` from `useLocation()`. Wouter's `useLocation` returns paths relative to the base, so `path` continues to be `/calendar` (NOT `/editor/calendar`) regardless of the wrapper. Existing analytics dashboards are unaffected.

## Migration Plan

Pure additive change. No data migration. No config-file rename. Forward-compatible.

## Follow-ups

None. The fix is one line plus two tests; the architectural cleanup (`Router base` matching `Vite base`) is the right resting state.
