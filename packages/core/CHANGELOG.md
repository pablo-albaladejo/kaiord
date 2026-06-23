# @kaiord/core

## 9.2.0

### Minor Changes

- bad73d3: Add energy-balance calculators powering the new energy-balance tracking feature: BMR
  (Mifflin-St Jeor / Katch-McArdle), daily expenditure resolution (measured vs
  predicted), goal daily-delta with safety caps, periodized daily target, P/C/F macro
  targets, expected-activity-kcal estimation (curated MET table + tiered estimator),
  exponential-moving-average smoothing, energy-balance rollup aggregation, and adaptive
  TDEE (self-correcting maintenance from the weight trend vs logged intake). All pure,
  fully unit-tested functions exported from the package root.
- cfb1b06: Add an activity-level NEAT factor API (`ActivityLevel`, `NEAT_FACTOR`, `DEFAULT_NEAT_FACTOR`, `neatFactorForActivityLevel`) and apply it to the predicted daily expenditure. `resolveDayExpenditure` now accepts an optional `basalActivityFactor` that scales the predicted basal (`bmrKcal × factor`), so a no-workout day reflects realistic maintenance instead of raw BMR. The factors are NEAT-only (sedentary 1.2 … very_active 1.6); scheduled-workout energy is still added separately via `expectedActivityKcal` and is never double-counted, and the measured-wellness path is unchanged.

### Patch Changes

- 73a2ce4: feat(cli): semantic failure exit codes. A single typed `mapErrorToExitCode` replaces the previous divergent mappers and message-substring matching; new `ENVIRONMENT_ERROR` (missing bundled schema/dependency → reinstall hint) and `SERVICE_ERROR` (Garmin Connect API/network) codes mean environmental and external-service failures no longer collapse into `UNKNOWN_ERROR`. A single `FORMAT_REGISTRY` now sources the format vocabulary.

  fix(garmin): `WorkoutSummary.sport` now carries KRD sport vocabulary (via the sport mapper) instead of the raw Garmin `sportTypeKey`.

  Internal semantic hardening with no other behavior changes: lossy adapter conversions (zwo watts→%FTP, garmin truncation / unknown-enum / REPS, tcx-zwo intensity narrowing) now emit named `Lossy conversion:` warnings with named assumed/fallback constants; duplicated domain rules are single-sourced (fit bpm offset and zone bounds, fit FIT-timestamp helper, core health version gate, garmin-connect retry policy); core round-trip methods gained honest port-level names (`validateBinaryRoundTrip`/`validateKrdRoundTrip`) with deprecated FIT-named aliases; MCP tool errors carry a machine-readable `structuredContent.error` classification and `kaiord_get_recovery_status` reports `skipped`.

## 9.1.0

### Minor Changes

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

## 9.0.0

### Major Changes

- a015501: KRD v2.0 — adds six health metrics (sleep, weight, HRV, daily wellness, body composition, stress) as first-class KRD types with bidirectional FIT adapter support.
  - **@kaiord/core**: new health sub-schemas (`sleepRecordSchema`, `weightMeasurementSchema`, `hrvSummarySchema`, `dailyWellnessSchema`, `bodyCompositionSchema`, `stressEpisodeSchema`); six new KRD `type` enum values (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`); health sub-schemas enforce `version` ∈ `2.x` (root `krdSchema.version` remains `\d+\.\d+`).
  - **@kaiord/fit**: bidirectional converters for the six health metrics; seven new FIT message numbers registered (`WEIGHT_SCALE`, `MONITORING`, `MONITORING_INFO`, `SLEEP_LEVEL`, `HRV_STATUS_SUMMARY`, `HRV_VALUE`, `STRESS_LEVEL`, `BODY_COMPOSITION`); round-trip tests for sleep / weight / HRV / daily / stress against real Garmin fixtures (`test-fixtures/fit/`).
  - **@kaiord/tcx, @kaiord/zwo, @kaiord/garmin**: workout-only writers now throw `UnsupportedKrdTypeError` when fed a health KRD instead of silently discarding it. **Breaking** for callers that fed unsupported KRDs to these writers.
  - **@kaiord/mcp**: five new tools — `kaiord_get_health_summary`, `kaiord_get_sleep_history`, `kaiord_get_weight_history`, `kaiord_get_hrv_history`, `kaiord_get_recovery_status` — stateless, file-array input, parse FIT health files via the standard pipeline.
  - **@kaiord/workout-spa-editor**: Dexie v16 with six health repositories (`healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`); Health Hub routes under `/health/*`; FIT health files now route to the health pipeline instead of being ignored.

### Minor Changes

- 275c221: feat(core): introduce MANAGED_DATA_REGISTRY single-source-of-truth for kaiord-managed data kinds; add deterministic external-id hash projection; tighten ManualHealthMetric and HealthKrdType to derive from ManagedDataType.

  Foundational for the integration-policy-per-profile-routing feature (PR 1 of 7). No runtime behavior change yet — subsequent PRs wire policy resolution, Dexie migration, and the Data Flows UI on top of this registry.

- d597cb4: feat(core,spa): domain provenance fields + IntegrationPolicy/ExportLedger schemas

  Adds kaiordRecordId, sourceBridgeId, externalId as optional fields to the six health Zod schemas (sleep, weight, hrv, daily, body-composition, stress); introduces deriveExternalId mapper in @kaiord/core/ingest; adds IntegrationPolicy + ExportLedgerEntry Zod schemas in @kaiord/workout-spa-editor; removes syncZones from linkedCoachingAccountSchema (Zod only — Dexie column retained as rollback buffer until v18).

  PR 2 of 7 implementing integration-policy-per-profile-routing.

### Patch Changes

- 82a7467: fix(core): make `canonicalHash` isomorphic (sync SHA-256, no `node:crypto`)

  `canonicalHash` used `node:crypto`'s `createHash`, which the build emitted as a
  bare `import { createHash } from "crypto"`. In the browser bundle `createHash`
  resolved to `undefined`, so any browser code path that hashed an export payload
  (the integration-policy export/push ledger via `computeExportHash`) crashed, and
  Vite's dev server crashed the whole SPA at module-eval.

  Switch to a sync, isomorphic SHA-256 (`@noble/hashes`). The UTF-8 bytes hashed
  and the hex digest are byte-for-byte identical to the previous implementation —
  verified against `node:crypto` in a test — so persisted external-ids stay
  stable. This removes the dev-only `crypto` stub workaround in the editor's Vite
  config.

## 8.0.0

### Major Changes

- 581239f: KRD v2.0 — extend the canonical format with health-domain types and tagged extensions (PR 1 of the `add-health-metrics-to-krd` OpenSpec change).

  **Breaking changes** (consumers of `@kaiord/core` validating KRD via Zod must update):
  - `fileTypeSchema` adds six variants: `sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`. The enum grows from 3 to 9 values. Exhaustive `switch`-style consumers must add the new cases or fall back to a default branch.
  - `KRDMetadata.sport` becomes `z.string().optional()`. A conditional refinement on `krdSchema` keeps `metadata.sport` **required** for the three legacy workout/activity/course types, so v1.x payloads validate byte-equivalently for those. Health-type payloads MUST omit `sport`.
  - `extensions` is re-typed from `z.record(z.string(), z.unknown())` to `krdExtensionsSchema` — a tagged shape with `catchall(z.unknown())` that strictly validates the reserved namespaces (`structured_workout`, `fit`, `course`, `course_points`, `health.{sleep|weight|hrv|daily|bodyComposition|stress}`) while still preserving any adapter-defined / unknown namespaces during round-trip.

  **Additions:**
  - `packages/core/src/domain/schemas/health/` with six tagged Zod sub-schemas (sleep, weight, HRV, daily wellness, body composition, stress), per-metric round-trip tolerance constants, and a `healthExtensionPayloadSchema` discriminated union.
  - `UnsupportedKrdTypeError` (typed error class + factory) in `packages/core/src/domain/types/unsupported-krd-type-error.ts`. Workout-only writers (`@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`) throw this when given a health-type KRD instead of a generic `Error`.
  - `packages/core/docs/ADAPTER-COVERAGE.md` documenting the normative format × KRD-type coverage matrix.

  The KRD `version` discriminator stays at the existing `"<major>.<minor>"` regex; producers SHOULD emit `"2.0"` when carrying any health payload so consumers can dispatch by version.

  Follow-ups (separate changes): FIT mappers for the six health types (PR 2), Dexie v14 + SPA Health Hub (PR 3), MCP health tools (PR 4), Garmin Connect HTTP endpoints (PR 5+).

## 7.2.0

### Minor Changes

- 79be4f3: Add `profileSnapshotSchema` + `ProfileSnapshot` DTO, `STALE_SNAPSHOT_THRESHOLD_DAYS` constant, and `fingerprintSnapshot` content-hash helper as the cross-cutting protocol contract for the SPA → Bridge popup snapshot push. Also exposes `snapshotFixtures` from `@kaiord/core/test-utils` for parity tests across the SPA and each bridge's plain-JS validator.
- d66e509: Extract the 7-band Coggan power-zone-to-percent-FTP table into a pure domain helper at `packages/core/src/domain/zones/power-zones.ts`. Adds new exports to the public API of `@kaiord/core` (additive only — no removals, no signature changes):
  - `POWER_ZONES`, `POWER_ZONE_PERCENT_FTP` — readonly constants
  - `PowerZone` — type alias for `1 | 2 | 3 | 4 | 5 | 6 | 7`
  - `isPowerZone(value)` — type guard
  - `zoneToPercentFtp(zone)` — strict mapping; throws `RangeError` on invalid input (does NOT silently fall back to 100% like the legacy zwo copy)
  - `percentFtpToZone(percent)` — strict inverse for round-trip identity

  The single in-repo duplicate (`packages/zwo/src/adapters/target/power.converter.ts`) will migrate to consume this helper in a follow-up PR (§6.2 of `repo-quality-maintenance-waves`).

## 7.1.2

### Patch Changes

- 1eb5fd0: Add Analytics port and noop adapter.

  Introduces `Analytics` type and `AnalyticsEvent` alias as a new port in `@kaiord/core`, alongside `createNoopAnalytics()` as the default do-nothing adapter. OSS consumers receive a zero-dependency, zero-tracking default; private deployments can inject their own adapter (e.g. Cloudflare Web Analytics) without any code changes to the framework.

## 7.1.1

### Patch Changes

- 4fc4308: Internal build + CI hardening release. No public API changes, no runtime behavior changes.
  - **TypeScript 6.0.3**: toolchain migrated from TS 5.9.3 across all packages. Consumers can now opt into TS 6 without hitting `baseUrl` deprecation warnings in shipped type declarations.
  - **Dedupe vite to 8.x**: removed the dual-vite-major state in the lockfile (vite 7.3 was coming in via vitepress alpha). `pnpm.overrides` forces a single major.
  - **Dependabot sweep**: @garmin/fitsdk 21.200→21.201, vitest 4.1.4→4.1.5, tailwindcss 4.2.2→4.2.4, lucide-react 1.8→1.11, vue 3.5.32→3.5.33, ora 9.3→9.4, @codecov/vite-plugin 1.9→2.0, @fission-ai/openspec 1.3.0→1.3.1, plus 3 GitHub Actions version bumps.
  - **CI hardening**: Link-checker is now a required status check + lychee pinned to v0.24; `enforce_admins` enabled on main branch protection; CHANGELOG.md excluded from cspell; `pnpm-lock.yaml` excluded from prettier (eliminates a recurring push-time reformat loop).
  - **Build watchdog**: `scripts/check-tsup-ignoredeprecations.mjs` auto-fails lint the day tsup fixes [egoist/tsup#1388](https://github.com/egoist/tsup/issues/1388), so the repo self-heals to drop the last remaining `ignoreDeprecations` silencer without manual tracking.

  No API additions, removals, or behavioral changes. Published packages consume the same surface as 7.0.0.

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

## 4.9.0

### Patch Changes

- 23c788c: feat: natural language to Garmin Connect web integration
  - Add AI workout generation UI with multi-provider support (Anthropic, OpenAI, Google)
  - Add Garmin Connect push flow via self-hostable Lambda proxy
  - Add Settings panel with AI provider, Garmin credentials, and privacy tabs
  - Add LLM eval suite with 22 curated benchmarks
  - Add Playwright E2E tests for AI generation, Garmin push, and settings flows
  - Add @kaiord/infra package for self-hostable AWS CDK stack

## 4.5.2

### Patch Changes

- f5a5f58: Export `isRepetitionBlock` type guard from core, consolidating duplicate implementations in fit and garmin packages

## 4.5.0

### Minor Changes

- 2ab2077: Remove Logger dependency from schema-validator (domain-to-ports violation fix) and remove duplicate ValidationError type definition

## 4.3.0

### Minor Changes

- 3cea716: feat(mcp): add MCP server package exposing Kaiord tools to AI agents
  - New `@kaiord/mcp` package with 6 tools, 3 resources, and 2 prompts for Claude Desktop/Code integration
  - Upgrade Zod from v3 to v4 across all packages (`z.uuid()`, `z.iso.datetime()`, native `z.toJSONSchema()`)
  - Remove `zod-to-json-schema` dependency in favor of native Zod v4 JSON schema generation

## 4.2.1

### Patch Changes

- 529c891: perf(core): reduce published dist from 1.8M to 268K
  - Split tsup config to disable sourcemaps for test-utils entry
  - Externalize devDependencies (@faker-js/faker, rosie) from test-utils build

## 4.2.0

### Minor Changes

- 799cbee: Add LLM agent support for structured workouts
  - `createWorkoutKRD(unknown)`: validates unknown input and wraps in KRD envelope
  - `extractWorkout(KRD)`: extracts and validates structured workout from KRD
  - `workoutToGarmin(unknown)`: direct Workout to Garmin Connect JSON conversion
  - `structured-workout-full.json`: self-contained JSON Schema for LLM agents
  - `mapZodErrors`: shared Zod-to-ValidationError mapping utility

## 4.1.3

### Patch Changes

- 74edc44: Update package description to reflect health & fitness data framework branding

## 4.1.2

### Patch Changes

- 9a79fd7: test: verify complete release workflow with ESM fix

## 4.1.1

### Patch Changes

- 0992e52: test: verify npm Trusted Publishing works with OIDC

## 4.1.0

### Minor Changes

- 19a12ba: Add Garmin Connect API (GCN) format support with bidirectional KRD conversion, CLI integration, and web editor integration

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

## 1.4.0

### Minor Changes

- 24d25dc: Add Claude Code plugins for enhanced development workflow

  Install 5 official Anthropic plugins:
  - commit-commands: Git workflow automation with auto-generated commit messages
  - security-guidance: Security vulnerability detection (9 patterns monitored)
  - explanatory-output-style: Educational insights about implementation choices
  - pr-review-toolkit: 6 specialized code review agents
  - frontend-design: Distinctive UI/UX design guidance for React components

  Include comprehensive documentation:
  - Complete plugin reference guide (PLUGINS.md)
  - Quick reference with commands and workflows (PLUGINS-QUICK-REFERENCE.md)
  - Installation summary and verification steps (PLUGINS-INSTALLATION-SUMMARY.md)
  - Real-world workflow example from start to finish (PLUGINS-COMPLETE-WORKFLOW-EXAMPLE.md)

  These plugins complement existing Kaiord custom agents and streamline development by 40%.

## 1.3.0

### Minor Changes

- 001748c: Add support for FIT ACTIVITY and COURSE file types

  Implement Phase 2.2 to support FIT ACTIVITY (ID 4) and COURSE (ID 6) file types in addition to WORKOUT (ID 5). This enables:
  - Reading/writing recorded activities with GPS and sensor data
  - Reading/writing route/course files for navigation
  - File type detection and routing for bidirectional conversion
  - Extended KRD metadata schema with fileType field

  **Breaking changes**: None - backward compatible with existing workout files

  **New features**:
  - FIT file type enum with 18 standard file types
  - Activity message validation and creation
  - Course schemas and coordinate conversion utilities
  - Automatic file type detection from FIT messages

## 1.2.0

### Minor Changes

- ccd4793: feat(core): implement FIT LAP message support (Phase 2.1)
  - Added bidirectional FIT LAP message conversion (FIT ↔ KRD)
  - Extended KRD lap schema with new fields: totalTimerTime, maxCadence, maxPower, normalizedPower, avgSpeed, maxSpeed, totalAscent, totalDescent, totalCalories, trigger, sport, subSport, workoutStepIndex, numLengths, swimStroke
  - Added lap trigger mapping (manual, time, distance, position, session_end, fitness_equipment)
  - Integrated lap extraction in activity.mapper.ts
  - Added round-trip tests with tolerances (±1s time, ±1W power, ±1bpm HR)

## 1.1.0

### Minor Changes

- 4eae83b: feat(fit): implement Phase 1 FIT message support
  - Add SESSION message (ID 18) converters for activity file support
  - Add RECORD message (ID 20) converters with coordinate conversion (semicircles ↔ degrees)
  - Add EVENT message (ID 21) converters with FIT ↔ KRD event type mapping
  - Fix stroke_type target conversion (KRD → FIT) for swimming workouts
  - Add coordinate converter utility for reusable geo coordinate transformations
  - Extend KRD domain schemas with additional activity fields:
    - Session: maxCadence, maxPower, normalizedPower, trainingStressScore, etc.
    - Record: temperature, verticalOscillation, stanceTime, stepLength
    - Event: workout_step, session, activity event types
  - Refactor messages.mapper.ts to detect and route workout vs activity files

  This enables full activity file (SESSION, RECORD, EVENT) conversion support.

## 1.0.3

### Patch Changes

- Automated release from commit 791d3b25d9be021e29fa74048b19baf4f9388a13
- 791d3b2: Improve code quality and developer experience in @kaiord/core:
  - Add proper Zod validation for workout data extraction in FIT converter (replaces unsafe type assertions)
  - Make messages validator stricter: throws by default on missing critical FIT messages (configurable via options)
  - Add truncation behavior option for notes field (configurable via notesTruncation parameter)
  - Document cadence SPM/RPM conversion rationale in TCX and Zwift converters
  - Remove unused isWorkoutStep type guard
  - Add warning when manufacturer falls back to default value
  - Add comprehensive edge case tests for duration converters (negative values, large numbers, NaN, Infinity)
  - Add tests for messages validator strict mode

## 1.0.2

### Patch Changes

- Automated release from commit 1dcb02097af637da6b253d0238fb46f872f5f801

## 1.0.1

### Patch Changes

- Automated release from commit b9d70b4232c66c73581f860f0714d51763cc8aca

## 0.1.3

### Patch Changes

- Automated release from commit d18d6fdd24b9ab5907f3f724fce46e6576145a8f

## 0.1.2

### Patch Changes

- Automated release from commit 158576ea7ddd7ed09b26ad9d66eca0ebb629827c

## 0.1.1

### Patch Changes

- Test changeset for release workflow validation

  This changeset is created to test the release workflow components:
  - Changesets PR creation
  - Version bumping
  - Changelog generation
  - GitHub release creation
  - npm publishing (dry-run)
