<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `@kaiord/workout-spa-editor`

## Purpose

Mobile-first React SPA for creating, editing, scheduling, and importing/exporting KRD workouts. Wraps the rest of the monorepo (`@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/ai`) as the end-user product surface. Ships:

- A workout editor (steps, repetition blocks, sport-specific zones).
- A weekly calendar with a Library of templates.
- AI workout generation (Anthropic / OpenAI / Google via Vercel AI SDK).
- A Garmin Connect push path via an extension bridge.
- A Train2Go coaching-plan ingest path via an extension bridge.
- A settings panel (AI providers, Garmin, privacy, usage).

Private (not published to npm). Deployed to GitHub Pages.

## Key Files

- `package.json` — React 19, Vite 8, Vitest 4, Playwright 1, Storybook 10, Dexie 4, Zustand 5, Zod 4, `wouter` 3, Tailwind 4.
- `index.html` — Vite entry; injects `window.__KAIORD_CONFIG__` for runtime token substitution (12-factor III + V).
- `vite.config.ts` — build config, code-splitting, codecov plugin wiring.
- `vitest.config.ts` — unit-test config (jsdom, `fake-indexeddb`, coverage v8, 70% threshold).
- `playwright.config.ts` — 5 projects (Chromium / Firefox / WebKit / Mobile Chrome / Mobile Safari), webServer `pnpm dev`, 60s test timeout, 10s action/expect timeout.
- `tsconfig.{app,e2e,node,storybook}.json` — split TS configs per surface.
- `.storybook/{main,preview}.ts` — Storybook config (a11y addon, react-vite framework).
- `README.md` — feature inventory and quick start.
- `CHANGELOG.md` — changeset-managed history.

## Subdirectories

- `src/` — all production source (see `src/AGENTS.md`).
- `e2e/` — Playwright specs and helpers (see `e2e/AGENTS.md`).
- `docs/` — package-specific docs (see `docs/AGENTS.md`).
- `scripts/` — local build/maintenance scripts (see `scripts/AGENTS.md`).
- `public/` — static assets served at root (see `public/AGENTS.md`).
- `.storybook/` — Storybook config (see `.storybook/AGENTS.md`).
- `coverage/`, `dist/`, `test-results/`, `playwright-report/`, `node_modules/` — generated; skip.

## For AI Agents

### Working In This Directory

1. **Hexagonal layout inside the SPA.** Source is split `domain types → ports → adapters → application → components`. Adapters (Dexie, Garmin extension, Train2Go extension, Umami analytics) implement the ports under `src/ports/`. UI never imports adapters directly — it goes through ports via the `PersistenceProvider` context or hooks.
2. **File-size + function-size caps.** ≤100 lines per file (tests exempt), <40 LOC per function, 60 LOC for React components. Split when needed (the `create-*` factories under `src/store/` exist for exactly this reason).
3. **`type` not `interface`. Factories not classes.** Only Dexie's `KaiordDatabase` is a class because the library requires it.
4. **Direct imports only.** No barrel `index.ts` imports — see `src/PROJECT_STRUCTURE.md`. Existing `index.ts` files are legacy and unused.
5. **English everywhere.** Comments, identifiers, commit messages, changesets.

### Testing Requirements

- Unit tests: Vitest + `@testing-library/react`. Run `pnpm test` from package root.
- `it()` titles MUST start with `"should "` (lowercase, exact 7 chars).
- Bodies MUST contain Pascal-case `// Arrange`, `// Act`, `// Assert` markers in order.
- `fake-indexeddb` is wired via `src/test-setup.ts`; Dexie tests get a fresh DB per test.
- E2E: Playwright. Run `pnpm test:e2e`. Seeds Dexie + stores via helpers under `e2e/helpers/`.
- Coverage threshold: 70% (lower than core's 80% because of UI surface area).
- Storybook lives in `src/**/*.stories.tsx`; build with `pnpm build-storybook`.

### Common Patterns

- **State partitioning (CRITICAL).** Editor runtime → Zustand (`src/store/workout-store.ts` ONLY). Persisted data → Dexie via `PersistencePort`. Local UI → React state.
- **No Zustand write-through.** `scripts/check-no-zustand-writethrough.mjs` enforces that Zustand stores never import `dexie-database`, the persistence adapter, or any `app-dexie` module (R-DexieImport / R-PersistStateImport / R-AppDexieImport).
- **Static toast/`console.*` strings.** First args to `toast(...)` and `console.{log,warn,error,info,debug}` under `src/{components,hooks,lib}/**` MUST be a bare string literal or a top-level `SCREAMING_SNAKE_CASE` constant referencing a literal. Enforced by `check-no-pii-leakage.mjs` (R-PIIInterpolation).
- **`stripIds` chokepoint.** Every Dexie write path, `saveWorkout`, and `exportWorkout` pass `UIWorkout` through `stripIds()` first — see `src/store/strip-ids.ts`.
- **Coaching id shape.** Every `coachingActivityId:` literal on a `sessionMatches` write AND every `[profileId+coachingActivityId]` reader MUST be constructed via `buildCoachingActivityId(...)`, `toPersistedCoachingActivityId(...)`, or a `CoachingActivityRecord.id` access (R-SessionMatchIdShape; see `.omc/autopilot/bug-trace.md` §H7 for the SHORT/COMPOSITE divergence that motivated the guard).
- **Library no-dual-mount.** Only `LibraryPage.tsx` and `TemplatePickerDialog.tsx` may import `organisms/WorkoutLibrary` / `WorkoutLibrary/WorkoutLibrary` / `LibraryDialogContent` (R-LibraryNoDualMount).

## Dependencies

### Internal

- `@kaiord/core` — domain types, KRD schemas, fixture loaders, conversion ports.
- `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` — format adapters used by import/export.
- `@kaiord/ai` — provider-agnostic AI generation port.

### External

- `react` 19, `react-dom` 19, `wouter` 3 — routing.
- `dexie` 4 + `dexie-react-hooks` — IndexedDB persistence + `useLiveQuery`.
- `zustand` 5 — editor runtime only.
- `zod` 4 — validation at boundaries.
- `@dnd-kit/{core,sortable,utilities}` — drag-and-drop in the editor.
- `@radix-ui/react-{dialog,dropdown-menu,context-menu,toast}` — accessible primitives.
- `ai` + `@ai-sdk/{anthropic,google,openai}` — Vercel AI SDK providers.
- `lucide-react` — icon set.
- `tailwindcss` 4 + `@tailwindcss/postcss` — styling.

<!-- MANUAL: -->

State management is the single most important contract in this package. Memorize:
**Editor runtime → Zustand. Persisted data → Dexie (via `PersistencePort`). Local UI → React state.**
Zustand stores MUST NOT write through to Dexie — the persistence boundary is one-way (Dexie reads hydrate Zustand; mutations go through use cases, not the store). The four mechanical guards (`check-no-zustand-writethrough.mjs`, `check-no-pii-leakage.mjs`, `check-no-library-dual-mount.mjs`, `check-session-match-id-shape.mjs`) run in `pnpm test:scripts` and block CI.
