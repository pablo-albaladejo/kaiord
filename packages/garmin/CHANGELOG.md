# @kaiord/garmin

## 10.0.0

### Patch Changes

- 6025135: chore(deps): bump the minor-and-patch group across 1 directory with 47 updates
- 32c4c1c: chore(deps-dev): bump @types/node from 25.7.0 to 26.1.0
- 95da9fa: Internal code-reduction sweep: remove dead files, unused re-exports and types,
  consolidate genuine duplication, and drop redundant constructs across packages.

  No public API or runtime behavior change — every removed symbol was unused
  (grep-confirmed across the monorepo) and none belonged to a package's published
  `src/index.ts` surface. The `@kaiord/zwo` `zod` dependency is dropped (its only
  users were the deleted schemas). All test suites stay green and coverage is at
  or above baseline in every package.

- 9de0335: Internal code reduction, no behavior change.
- 0841993: Point every package's `homepage` at its kaiord.com docs page instead of the
  package's own npm page (a circular link), and broaden `keywords` with the
  search terms people actually use (fit-parser, fit-converter, zwift-workout,
  tcx-parser, garmin-connect-api, mcp-server, fit-to-tcx, …) so the packages
  surface in npm and search-engine queries. `@kaiord/mcp` also gains the
  `mcpName` field and a `server.json` so it can be published to the official
  MCP registry (registry.modelcontextprotocol.io).
- Updated dependencies [6025135]
- Updated dependencies [e167efe]
- Updated dependencies [32c4c1c]
- Updated dependencies [95da9fa]
- Updated dependencies [372db2c]
- Updated dependencies [dfa21e6]
- Updated dependencies [9f08136]
- Updated dependencies [d777295]
- Updated dependencies [0841993]
- Updated dependencies [63c4cb6]
- Updated dependencies [a2a5b12]
- Updated dependencies [78c1866]
  - @kaiord/core@10.0.0

## 9.2.0

### Patch Changes

- 73a2ce4: feat(cli): semantic failure exit codes. A single typed `mapErrorToExitCode` replaces the previous divergent mappers and message-substring matching; new `ENVIRONMENT_ERROR` (missing bundled schema/dependency → reinstall hint) and `SERVICE_ERROR` (Garmin Connect API/network) codes mean environmental and external-service failures no longer collapse into `UNKNOWN_ERROR`. A single `FORMAT_REGISTRY` now sources the format vocabulary.

  fix(garmin): `WorkoutSummary.sport` now carries KRD sport vocabulary (via the sport mapper) instead of the raw Garmin `sportTypeKey`.

  Internal semantic hardening with no other behavior changes: lossy adapter conversions (zwo watts→%FTP, garmin truncation / unknown-enum / REPS, tcx-zwo intensity narrowing) now emit named `Lossy conversion:` warnings with named assumed/fallback constants; duplicated domain rules are single-sourced (fit bpm offset and zone bounds, fit FIT-timestamp helper, core health version gate, garmin-connect retry policy); core round-trip methods gained honest port-level names (`validateBinaryRoundTrip`/`validateKrdRoundTrip`) with deprecated FIT-named aliases; MCP tool errors carry a machine-readable `structuredContent.error` classification and `kaiord_get_recovery_status` reports `skipped`.

- 4f712ef: fix(tcx): cadence and pace targets now survive the TCX round-trip. The wired reader decodes native `Cadence_t`/`Speed_t` targets (previously degraded to `open`), running cadence converts between TCX steps-per-minute and KRD rpm (SPM = 2 × RPM) on both legs, and the writer matches the canonical `mps` pace unit. The orphaned parallel converter chain was removed.

  Internal hardening with no public API changes: mcp derives `BINARY_FORMATS` from `FORMAT_REGISTRY` and rejects unsupported `output_format` values with an explicit error; zwo/garmin logic-bearing mapper files are now converters with co-located tests; garmin-connect auth internals use pronounceable names; cli internals renamed.

- Updated dependencies [73a2ce4]
- Updated dependencies [bad73d3]
- Updated dependencies [cfb1b06]
  - @kaiord/core@9.2.0

## 9.1.0

### Patch Changes

- 45a788a: Audit hardening: stricter domain validation and internal robustness.
  - `@kaiord/core`: range targets (power/heart-rate/pace/cadence) now enforce
    `min <= max`; physical bounds added (watts 0-5000, percent FTP 0-1000,
    bpm 0-300, percent max 0-100, pace 0-30 m/s, cadence 0-300 rpm, pool
    length 1-655 m). Inputs outside these bounds — previously accepted
    silently — now fail schema validation. Internal layout: the round-trip
    validation use case moved into the `application` layer and the Profile
    Snapshot protocol contract into a new guarded `protocol/` layer; the
    public API surface is unchanged.
  - `@kaiord/fit`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`,
    `@kaiord/cli`: internal hardening under `noUncheckedIndexedAccess`
    (defensive guards on indexed access), converter renames, and test
    coverage expansion. No public API changes.

- Updated dependencies [45a788a]
- Updated dependencies [2678d66]
  - @kaiord/core@9.1.0

## 9.0.0

### Major Changes

- a015501: KRD v2.0 — adds six health metrics (sleep, weight, HRV, daily wellness, body composition, stress) as first-class KRD types with bidirectional FIT adapter support.
  - **@kaiord/core**: new health sub-schemas (`sleepRecordSchema`, `weightMeasurementSchema`, `hrvSummarySchema`, `dailyWellnessSchema`, `bodyCompositionSchema`, `stressEpisodeSchema`); six new KRD `type` enum values (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`); health sub-schemas enforce `version` ∈ `2.x` (root `krdSchema.version` remains `\d+\.\d+`).
  - **@kaiord/fit**: bidirectional converters for the six health metrics; seven new FIT message numbers registered (`WEIGHT_SCALE`, `MONITORING`, `MONITORING_INFO`, `SLEEP_LEVEL`, `HRV_STATUS_SUMMARY`, `HRV_VALUE`, `STRESS_LEVEL`, `BODY_COMPOSITION`); round-trip tests for sleep / weight / HRV / daily / stress against real Garmin fixtures (`test-fixtures/fit/`).
  - **@kaiord/tcx, @kaiord/zwo, @kaiord/garmin**: workout-only writers now throw `UnsupportedKrdTypeError` when fed a health KRD instead of silently discarding it. **Breaking** for callers that fed unsupported KRDs to these writers.
  - **@kaiord/mcp**: five new tools — `kaiord_get_health_summary`, `kaiord_get_sleep_history`, `kaiord_get_weight_history`, `kaiord_get_hrv_history`, `kaiord_get_recovery_status` — stateless, file-array input, parse FIT health files via the standard pipeline.
  - **@kaiord/workout-spa-editor**: Dexie v16 with six health repositories (`healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`); Health Hub routes under `/health/*`; FIT health files now route to the health pipeline instead of being ignored.

### Patch Changes

- Updated dependencies [a015501]
- Updated dependencies [82a7467]
- Updated dependencies [275c221]
- Updated dependencies [d597cb4]
  - @kaiord/core@9.0.0

## 8.0.0

### Patch Changes

- Updated dependencies [581239f]
  - @kaiord/core@8.0.0

## 7.3.0

### Minor Changes

- 8aca79c: Add multisport transition support to Garmin GCN adapter.

  The Garmin workout input schema now accepts an optional `isSessionTransitionEnabled: boolean` flag at the workout root, used by Garmin Connect to enable automatic transitions between segments of different sports in multisport workouts (triathlon, brick, duathlon).

  The flag round-trips through the adapter via `krd.extensions.gcn.isSessionTransitionEnabled`, so reading a multisport GCN and re-writing it preserves the transition behavior.

  Range targets (`pace.zone`, `power.zone`) are now emitted with the faster / higher-intensity bound in `targetValueOne` and the slower / lower-intensity bound in `targetValueTwo`, matching how Garmin Connect's server stores them. The reader normalizes incoming targets to `[min, max]` regardless of source order, so range semantics survive round-trip even when source data uses the opposite ordering.

## 7.1.1

### Patch Changes

- 4fc4308: Internal build + CI hardening release. No public API changes, no runtime behavior changes.
  - **TypeScript 6.0.3**: toolchain migrated from TS 5.9.3 across all packages. Consumers can now opt into TS 6 without hitting `baseUrl` deprecation warnings in shipped type declarations.
  - **Dedupe vite to 8.x**: removed the dual-vite-major state in the lockfile (vite 7.3 was coming in via vitepress alpha). `pnpm.overrides` forces a single major.
  - **Dependabot sweep**: @garmin/fitsdk 21.200→21.201, vitest 4.1.4→4.1.5, tailwindcss 4.2.2→4.2.4, lucide-react 1.8→1.11, vue 3.5.32→3.5.33, ora 9.3→9.4, @codecov/vite-plugin 1.9→2.0, @fission-ai/openspec 1.3.0→1.3.1, plus 3 GitHub Actions version bumps.
  - **CI hardening**: Link-checker is now a required status check + lychee pinned to v0.24; `enforce_admins` enabled on main branch protection; CHANGELOG.md excluded from cspell; `pnpm-lock.yaml` excluded from prettier (eliminates a recurring push-time reformat loop).
  - **Build watchdog**: `scripts/check-tsup-ignoredeprecations.mjs` auto-fails lint the day tsup fixes [egoist/tsup#1388](https://github.com/egoist/tsup/issues/1388), so the repo self-heals to drop the last remaining `ignoreDeprecations` silencer without manual tracking.

  No API additions, removals, or behavioral changes. Published packages consume the same surface as 7.0.0.

- Updated dependencies [4fc4308]
  - @kaiord/core@7.1.1

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0

## 5.0.0

### Major Changes

- 22f13a0: BREAKING CHANGE: Remove `workoutToGarmin`, `createWorkoutToGarmin`, and `WorkoutToGarminOptions` exports.

  These convenience functions violated the hexagonal architecture by having an adapter orchestrate core use cases (`toText`, `createWorkoutKRD`). Adapters should only implement port interfaces.

  Migration:

  ```typescript
  // Before
  import { workoutToGarmin } from "@kaiord/garmin";
  const json = await workoutToGarmin(workout);

  // After
  import { createWorkoutKRD, toText } from "@kaiord/core";
  import { garminWriter } from "@kaiord/garmin";
  const krd = createWorkoutKRD(workout);
  const json = await toText(krd, garminWriter);

  // With paceZones
  import { createGarminWriter } from "@kaiord/garmin";
  const writer = createGarminWriter({ paceZones });
  const json = await toText(krd, writer);
  ```

## 4.9.1

### Patch Changes

- aa78a2e: Resolve pace zone references to m/s ranges for Garmin Connect

  Garmin Connect does not support native pace zone numbers. Pace zone targets
  are now resolved to min/max m/s values via a configurable PaceZoneTable,
  passed through createGarminWriter and createWorkoutToGarmin options.

## 4.8.1

### Patch Changes

- 2bb0ffd: Internal: lint fixes, vitest config, and type import cleanup across adapter packages

## 4.7.3

### Patch Changes

- c925282: Fix step description/notes round-trip in Garmin workout conversion pipeline

## 4.5.3

### Patch Changes

- 6cc9ccb: Add comprehensive unit tests for target converters, duration converters, workout converters, and CLI utilities to close coverage gaps

## 4.5.1

### Patch Changes

- 9dfe279: Split large converter files for maintainability
  - Extract `executable-step.converter.ts`, `flatten-segments.converter.ts`, `pool-length.mapper.ts` from garmin-to-krd
  - Extract `garmin-workout-step.converter.ts`, `garmin-repetition.converter.ts`, `garmin-pool-info.mapper.ts` from krd-to-garmin
  - Merge stroke conversion helpers into `stroke.mapper.ts`
  - Extract Zod parse schemas into `garmin-workout-parse.schema.ts`
  - All files now under 100 lines per project conventions

## 4.5.0

### Patch Changes

- 2ab2077: Add Zod runtime validation for Garmin JSON parsing and remove all unsafe type casts in converters and mappers
- Updated dependencies [2ab2077]
  - @kaiord/core@4.5.0

## 4.3.0

### Minor Changes

- 3cea716: feat(mcp): add MCP server package exposing Kaiord tools to AI agents
  - New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
  - Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
  - Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation

### Patch Changes

- Updated dependencies [3cea716]
  - @kaiord/core@4.3.0

## 4.2.0

### Minor Changes

- 799cbee: Add LLM agent support for structured workouts
  - `createWorkoutKRD(unknown)`: validates unknown input and wraps in KRD envelope
  - `extractWorkout(KRD)`: extracts and validates structured workout from KRD
  - `workoutToGarmin(unknown)`: direct Workout to Garmin Connect JSON conversion
  - `structured-workout-full.json`: self-contained JSON Schema for LLM agents
  - `mapZodErrors`: shared Zod-to-ValidationError mapping utility

### Patch Changes

- Updated dependencies [799cbee]
  - @kaiord/core@4.2.0

## 4.1.3

### Patch Changes

- 74edc44: Update package description to reflect health & fitness data framework branding
- Updated dependencies [74edc44]
  - @kaiord/core@4.1.3

## 4.1.0

### Minor Changes

- 19a12ba: Add Garmin Connect API (GCN) format support with bidirectional KRD conversion, CLI integration, and web editor integration

### Patch Changes

- Updated dependencies [19a12ba]
  - @kaiord/core@4.1.0
