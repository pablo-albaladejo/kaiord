<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/`

## Purpose

Production source for the SPA. Internally follows the same hexagonal split the monorepo uses at the package level: `types → ports → adapters → application → store + hooks → components → routing → main`. `main.tsx` wires Cloudflare analytics + Dexie persistence + Wouter into a provider tree that bootstraps `App.tsx`.

## Key Files

- `main.tsx` — React root. Composes `AnalyticsProvider`, `PersistenceProvider`, `ThemeProvider`, `SettingsDialogProvider`, `GarminBridgeProvider`, `CoachingRegistryBootstrap`, and the Wouter `Router` around `<App />`. Reads the CF token from `window.__KAIORD_CONFIG__` via `getCfAnalyticsToken()` so the bundle stays env-agnostic.
- `App.tsx` — top-level routes (Wouter `Switch`/`Route`): `/` → redirect to `/calendar`, `/calendar/:weekId?`, `/library`, `/workout/new`, `/workout/:id`. Each route is wrapped in `RouteErrorBoundary`. Lazy-loads `CalendarPage` / `LibraryPage` / `EditorPage`. Fires `editor-loaded` analytics event on mount and a `pageView` per real route.
- `index.css` — Tailwind v4 entry + design tokens.
- `router-base.ts` — single source of truth for the Wouter `base` prop. Reads `import.meta.env.BASE_URL` so the SPA works at `/kaiord/` on GitHub Pages.
- `test-setup.ts` — Vitest setup (wires `fake-indexeddb`, `@testing-library/jest-dom`, console-warning hardening).
- `test-utils.tsx` — `renderWithProviders` helper for component tests.
- `vitest.d.ts` — module augmentation for vitest custom matchers.
- `PROJECT_STRUCTURE.md` — package-local style guide. Mostly historical; the canonical contract lives in this directory's AGENTS.md.

## Subdirectories

- `adapters/` — port implementations (Dexie, bridge, analytics, train2go).
- `application/` — use cases (no React, no Dexie imports).
- `assets/` — static assets bundled into the SPA.
- `components/` — UI tree (atoms/molecules/organisms/pages/templates/providers).
- `constants/` — pure data constants.
- `contexts/` — React contexts for shared runtime state.
- `hooks/` — custom hooks (each `use-*.ts(x)` is a single hook).
- `lib/` — leaf utility libraries (crypto, scrub-analytics-string, runtime-config, zone math).
- `ports/` — hexagonal port interfaces (repository contracts).
- `routing/` — routing constants.
- `store/` — Zustand stores (editor runtime ONLY).
- `test-fixtures/` — JSON fixtures used by tests.
- `test-utils/` — in-memory port implementations + console-spy helpers.
- `types/` — domain types, Zod schemas, validation helpers.
- `utils/` — utility functions shared across UI.
- `__perf__/`, `__regressions__/` — performance baselines + regression test landing zones.

## For AI Agents

### Working In This Directory

1. **`domain → application → ports → adapters` direction is enforced by file structure.** `types/` may not import from anywhere downstream. `application/` may import `types/` and `ports/` only. Adapters under `adapters/` may import `ports/` + `types/` + `lib/`. UI under `components/` consumes via hooks/contexts, never via direct adapter imports.
2. **Wouter, not React Router.** Imports come from `wouter`. Route params are read from the route function arg (`<Route path="/workout/:id">{(params) => …}</Route>`).
3. **Lazy routes.** Page components use `React.lazy` + `Suspense` with `<RouteSpinner />`. The route boundary is the only place `RouteErrorBoundary` should wrap.
4. **One live query per page.** `useLiveQuery` (from `dexie-react-hooks`) is the read primitive for persisted data. Components MUST NOT call Dexie directly.

### Testing Requirements

- Co-located tests: `<file>.test.{ts,tsx}` next to the unit it tests.
- `App.test.tsx` covers route wiring and provider composition.
- `routes.test.tsx` checks the redirect-only paths don't double-fire `pageView`.
- `router-base.test.tsx` checks the BASE_URL → base prop normaliser.

### Common Patterns

- **Provider order in `main.tsx`** matters: analytics → persistence → theme → settings-dialog → garmin-bridge → coaching-registry → router. Don't reorder without checking each context's `useX()` consumer surface.
- **Hooks own the Dexie read side.** Each entity has a `use-<entity>-live.ts(x)` hook that wraps the relevant `PersistencePort` repository in a `useLiveQuery`.

## Dependencies

### Internal

- `@kaiord/core` (types, schemas, utilities, fixture loaders).
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` (format I/O).
- `@kaiord/ai` (AI generation port).

### External

- `react`, `react-dom`, `wouter`, `dexie`, `dexie-react-hooks`, `zustand`, `zod`, `@dnd-kit/*`, `@radix-ui/*`, `ai`, `@ai-sdk/*`, `lucide-react`, `tailwindcss`.

<!-- MANUAL: -->

The hexagonal layering inside this directory is the single biggest lever for keeping change safe: any time a UI component wants to "just read from Dexie directly," push it back into `application/` (the use case) or `hooks/` (the live-query wrapper). The four mechanical guards from the package-level AGENTS.md are enforced from this tree downward.
