<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# packages

## Purpose

All workspace packages live here. The monorepo is pnpm-managed and follows a
strict hexagonal architecture: the inner core (`@kaiord/core`) defines domain
types, schemas, ports, and use cases; every other package is an outer adapter
(format adapters, applications, extensions, docs site).

## Subdirectories

| Directory             | Purpose                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `_shared/`            | Non-publishable extension assets + bridge-core vendored masters — icon SVG, shared bridge runtime (see `_shared/AGENTS.md`) |
| `ai/`                 | `@kaiord/ai` — LLM provider adapters, prompt templates, evals (see `ai/AGENTS.md`)                                          |
| `cli/`                | `@kaiord/cli` — `kaiord` command-line tool (see `cli/AGENTS.md`)                                                            |
| `core/`               | `@kaiord/core` — domain, application, ports, console logger (see `core/AGENTS.md`)                                          |
| `docs/`               | `@kaiord/docs` — VitePress documentation site at kaiord.com/docs (see `docs/AGENTS.md`)                                     |
| `fit/`                | `@kaiord/fit` — FIT binary adapter via `@garmin/fitsdk` (see `fit/AGENTS.md`)                                               |
| `garmin/`             | `@kaiord/garmin` — GCN (Garmin Connect Native JSON) workout adapter (see `garmin/AGENTS.md`)                                |
| `garmin-bridge/`      | Private Chrome extension bridging SPA editor to Garmin Connect (see `garmin-bridge/AGENTS.md`)                              |
| `garmin-connect/`     | `@kaiord/garmin-connect` — Garmin Connect HTTP client (SSO, push/list workouts) (see `garmin-connect/AGENTS.md`)            |
| `landing/`            | `@kaiord/landing` — marketing landing page at kaiord.com (see `landing/AGENTS.md`)                                          |
| `mcp/`                | `@kaiord/mcp` — Model Context Protocol server exposing conversions to AI clients (see `mcp/AGENTS.md`)                      |
| `tcx/`                | `@kaiord/tcx` — TCX XML adapter via `fast-xml-parser` (see `tcx/AGENTS.md`)                                                 |
| `train2go-bridge/`    | Private Chrome extension reading Train2Go coaching plans (see `train2go-bridge/AGENTS.md`)                                  |
| `whoop-bridge/`       | Private Chrome extension bridging SPA editor to WHOOP data (see `whoop-bridge/AGENTS.md`)                                   |
| `workout-spa-editor/` | React workout editor SPA (Zustand + Dexie + Tailwind) (see `workout-spa-editor/AGENTS.md`)                                  |
| `zwo/`                | `@kaiord/zwo` — Zwift Workout XML adapter with XSD validation (see `zwo/AGENTS.md`)                                         |

## For AI Agents

### Working In This Directory

- **Hexagonal direction**: `core/` depends on nothing. Adapter packages
  (`fit/`, `tcx/`, `zwo/`, `garmin/`, `garmin-connect/`, `mcp/`, `cli/`,
  `ai/`) depend on `@kaiord/core` only. Applications (`workout-spa-editor/`,
  `landing/`, `docs/`, `garmin-bridge/`, `train2go-bridge/`,
  `whoop-bridge/`) compose adapter packages.
- **Never import upward**: a format adapter MUST NOT import the SPA editor;
  `core/` MUST NOT import any adapter. `eslint-plugin-boundaries` and
  `dependency-cruiser` enforce this — failures are lint errors.
- **Workspace deps**: cross-package references MUST use `workspace:*` and
  the `@kaiord/*` scope.
- **Adding a package**: see `CLAUDE.md` § "Adding a New Package" — update
  `.changeset/config.json`, both CI workflows, and `scripts/create-github-releases.js`.

### Testing Requirements

- Each package owns its own `vitest.config.ts` and `test:` script.
- Coverage thresholds: 80% for `core/`, `fit/`, `tcx/`, `zwo/`, `garmin/`,
  `garmin-connect/`, `mcp/`, `cli/`, `ai/`. 70% for frontend
  (`workout-spa-editor/`, `landing/`).
- Title rule (`R-ItTitleShould`) + AAA rule (`R-ItBodyAAA`) enforced
  repo-wide via `scripts/check-test-{title-should,aaa}.mjs`.
- Round-trip tests for format adapters use tolerances: time ±1s, power
  ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm.

### Common Patterns

- **Dual exports**: every format adapter exports both a pre-built singleton
  (`fitReader`) and a factory (`createFitReader(logger?)`).
- **Strategy injection**: `@kaiord/core` exposes `fromBinary/fromText/
toBinary/toText` that take a reader/writer port. Apps wire the concrete
  adapter at composition time only.
- **Build**: each package builds with `tsup` (libraries) or `vite`
  (apps/extensions). All emit ESM with separate `.d.ts`.

## Dependencies

### Internal

The dependency graph is a strict DAG rooted at `@kaiord/core`. Apps
(`workout-spa-editor`, extensions) sit at the top.

### External

Each package declares its own runtime dependencies. The workspace root
pins critical versions via `pnpm.overrides` in `/package.json`.

<!-- MANUAL: -->
