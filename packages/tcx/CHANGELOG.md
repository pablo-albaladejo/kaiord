# @kaiord/tcx

## 10.1.0

### Patch Changes

- 74af51d: Fix `fit → tcx` (and any `* → tcx`) conversions throwing `TcxParsingError` on
  workouts with repeat/interval blocks (#976). The KRD→TCX writer treated every
  step as a leaf, so a repetition block had no `duration`/`target` and the
  encoder threw. The writer now serializes repetition blocks to a TCX `Repeat_t`
  step carrying `Repetitions` and `Child` steps, assigning contiguous `StepId`s
  across the flattened tree.
- Updated dependencies [23974fe]
- Updated dependencies [e33f860]
- Updated dependencies [07a4939]
- Updated dependencies [ec4b349]
  - @kaiord/core@10.1.0

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

- 0841993: Point every package's `homepage` at its kaiord.com docs page instead of the
  package's own npm page (a circular link), and broaden `keywords` with the
  search terms people actually use (fit-parser, fit-converter, zwift-workout,
  tcx-parser, garmin-connect-api, mcp-server, fit-to-tcx, …) so the packages
  surface in npm and search-engine queries. `@kaiord/mcp` also gains the
  `mcpName` field and a `server.json` so it can be published to the official
  MCP registry (registry.modelcontextprotocol.io).
- 34e1a07: Internal code reduction, no behavior change.
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

- a0c22e6: fix(tcx): validate restored `kaiord:` duration thresholds are positive and finite. A present-but-invalid heart-rate / power / calorie attribute (0, negative, NaN, or Infinity) now warns and degrades instead of silently restoring a physiologically meaningless duration.
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

### Minor Changes

- 2678d66: Widen the KRD sport vocabulary to the full Garmin FIT taxonomy

  The KRD domain `sport` enum is widened from 4 values (cycling/running/swimming/
  generic) to the full FIT `Sport` taxonomy (snake_case), so workouts can carry
  their real sport (training, rowing, hiking, tennis, cross-country skiing, …)
  instead of collapsing to `generic`. The change is additive — every prior value
  stays valid.
  - **core**: full FIT-anchored `sportSchema` + a new `sportCategory()` classifier
    (cycling/running/swimming/other) that drives all capability-dependent logic.
  - **fit**: bidirectional camelCase↔snake_case sport mapper wired into the
    metadata/session/lap read+write paths, so multi-word sports encode without
    throwing and decode without falling back to cycling.
  - **tcx/zwo**: lossy-format sport collapse now derives from `sportCategory()`
    (TCX → Running/Biking/Other; ZWO → bike/run) instead of exhaustive tables, so
    growing the vocabulary never breaks these adapters.
  - **workout-spa-editor**: coaching activities map onto a real (sport, subSport)
    pair (e.g. Stretching → training/flexibility_training, Gym →
    training/strength_training, Rowing → rowing/indoor_rowing); the editor heading
    shows the humanized sport. Non-endurance sports behave like `generic` for zones.

### Patch Changes

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

## 4.8.1

### Patch Changes

- 2bb0ffd: Internal: lint fixes, vitest config, and type import cleanup across adapter packages

## 4.7.2

### Patch Changes

- 2377eaa: Update production dependencies: @garmin/fitsdk 21.194.0, fast-xml-parser 5.3.6

## 4.5.3

### Patch Changes

- 6cc9ccb: Add comprehensive unit tests for target converters, duration converters, workout converters, and CLI utilities to close coverage gaps

## 4.3.0

### Minor Changes

- 3cea716: feat(mcp): add MCP server package exposing Kaiord tools to AI agents
  - New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
  - Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
  - Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation

### Patch Changes

- Updated dependencies [3cea716]
  - @kaiord/core@4.3.0

## 4.1.3

### Patch Changes

- 74edc44: Update package description to reflect health & fitness data framework branding
- Updated dependencies [74edc44]
  - @kaiord/core@4.1.3

## 4.0.0

### Major Changes

- d3fa555: BREAKING: Rename KRD types for explicit separation (workout -> structured_workout, activity -> recorded_activity)

  This is a breaking change to the KRD format schema:
  - **Type field values changed**: `"workout"` -> `"structured_workout"`, `"activity"` -> `"recorded_activity"`
  - **Extension key renamed**: `extensions.workout` -> `extensions.structured_workout`
  - **Metadata field removed**: `metadata.fileType` removed (redundant with root `type`)
  - **Event types prefixed**: All event types now use `event_` prefix (e.g., `"start"` -> `"event_start"`, `"workout_step"` -> `"event_workout_step_change"`)
  - **Activity data relocated**: Recorded activity data (sessions, laps, records, events) moved from `extensions.recorded_activity` to top-level KRD fields

  Old KRD files will need to be re-exported. No backward compatibility migration is provided.

### Patch Changes

- Updated dependencies [d3fa555]
  - @kaiord/core@4.0.0

## 3.0.0

### Major Changes

- 9cfdf44: Extract format adapters from @kaiord/core into separate packages for modular installation.

  Breaking changes:
  - `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
  - Provider properties for adapters are now optional (undefined when adapter not installed)
  - Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

  New packages:
  - `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
  - `@kaiord/tcx` - TCX format adapter with fast-xml-parser
  - `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
  - `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

  Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.

### Patch Changes

- 9cfdf44: Consolidate test fixtures to shared monorepo location
  - Moved all test fixtures to `/test-fixtures/` directory
  - Updated fixture loaders in @kaiord/core/test-utils
  - Removed fixture duplication across adapter packages
  - Fixed @kaiord/core to not publish fixtures to npm
  - Reduced package sizes by ~120KB

- Updated dependencies [9cfdf44]
- Updated dependencies [9cfdf44]
  - @kaiord/core@3.0.0

## 2.0.1

### Patch Changes

- 0a756dd: feat: add Node.js 24 Active LTS support

  Add comprehensive Node.js 24.x (Active LTS) support to all packages and CI workflows while maintaining backward compatibility with Node.js 20.x and 22.x.

  **Changes:**
  - Add Node.js 24.x to CI test matrices (lint, test, test-frontend)
  - Upgrade @types/node from ^20.11.0 to ^24.0.0 across all packages
  - Update deployment workflows to use Node.js 24.x (release, deploy-spa-editor, security)
  - Update documentation to recommend Node.js 24.x as the preferred version
  - Maintain Node.js >=20.0.0 engine requirement for backward compatibility

  **Breaking Changes:** None

- Updated dependencies [0a756dd]
  - @kaiord/core@2.0.1

## 2.0.0

### Major Changes

- dcc0cac: Extract format adapters from @kaiord/core into separate packages for modular installation.

  Breaking changes:
  - `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
  - Provider properties for adapters are now optional (undefined when adapter not installed)
  - Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

  New packages:
  - `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
  - `@kaiord/tcx` - TCX format adapter with fast-xml-parser
  - `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
  - `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

  Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.

### Patch Changes

- Updated dependencies [dcc0cac]
  - @kaiord/core@2.0.0
