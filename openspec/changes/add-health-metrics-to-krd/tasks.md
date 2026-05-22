<!-- opsx-ship: chunking
PR 1 (core-domain): §1, §2, §3
PR 2 (fit-adapter):  §4, §5
PR 3 (spa-persistence): §6
PR 4 (spa-ui):        §7, §8, §9
PR 5 (mcp + docs):    §10, §11
PR 6 (verification):  §12, §13
-->

## 1. Health sub-schemas (`packages/core/src/domain/schemas/health/`)

- [x] 1.1 Add `packages/core/src/domain/schemas/health/tolerances.ts` exporting per-metric round-trip tolerance constants (`SLEEP_STAGE_TOLERANCE_SECONDS = 60`, `WEIGHT_TOLERANCE_KG = 0.1`, `HRV_TOLERANCE_MS = 1`, `DAILY_STEPS_TOLERANCE = 0`, `DAILY_KCAL_TOLERANCE = 1`, `BODY_FAT_TOLERANCE_PERCENT = 0.1`, `STRESS_TOLERANCE = 0`).
- [x] 1.2 Add tests in `packages/core/src/domain/schemas/health/sleep.test.ts` covering: valid sleep payload validates, stages summing within ±60 s of total validates, stages diverging >60 s rejected, missing `startTime` rejected, forward-compat v2.1 accepted, wrong major v1.0 rejected, score above 100 rejected.
- [x] 1.3 Implement `sleep.ts` with the discriminated Zod schema (kind / version / stages with refine on duration sum). Kept the file under 100 lines (no `.schema` suffix per project naming convention).
- [x] 1.4 Repeat 1.2–1.3 for `weight.{ts,test.ts}` (scalar weight, positivity refinement).
- [x] 1.5 Repeat 1.2–1.3 for `hrv.{ts,test.ts}` (overnight/spot enum, positive rMSSD).
- [x] 1.6 Repeat 1.2–1.3 for `daily.{ts,test.ts}` (steps non-negative, calories non-negative, intensity minutes nested object).
- [x] 1.7 Repeat 1.2–1.3 for `body-composition.{ts,test.ts}` (at-least-one-field refinement).
- [x] 1.8 Repeat 1.2–1.3 for `stress.{ts,test.ts}` (peak ≥ average refinement, endTime ≥ startTime).
- [x] 1.9 Add `packages/core/src/domain/schemas/health/index.ts` barrel exporting the six sub-schemas, their inferred record types, the discriminated union `healthExtensionPayloadSchema`, and the tolerances module.
- [x] 1.10 Run `pnpm --filter @kaiord/core test` and confirm all health-schema tests pass with zero regressions (34/34 health + 309 total core tests pass).

## 2. KRD core schema extensions

- [x] 2.1 Add tests in `packages/core/src/domain/schemas/file-type.test.ts` asserting `fileTypeSchema` accepts each of the six new variants (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`) and continues to accept the three existing variants. Also adds tests for `workoutLikeFileTypes` / `healthFileTypes` partition and the `isHealthFileType` type guard.
- [x] 2.2 Extend `packages/core/src/domain/schemas/file-type.ts` with the six new enum values, exported `workoutLikeFileTypes` / `healthFileTypes` arrays, and `isHealthFileType` type guard.
- [x] 2.3 The conditional `sport` rule lives in `krd/index.test.ts` (not metadata.test.ts) because it is a cross-field invariant on the `krdSchema` superRefine: workout `type` with `sport` validates, workout `type` without `sport` rejected, health `type` without `sport` validates, health `type` with `sport` rejected.
- [x] 2.4 Change `metadata.sport` to `z.string().optional()` and attach the `superRefine` on `krdSchema` so the four scenarios in 2.3 pass without regressing existing tests.
- [x] 2.5 Add tests in `packages/core/src/domain/schemas/krd/index.test.ts` for the tagged `extensions` shape: legacy `structured_workout` payload still validates, `health.sleep` payload validates strictly, unknown `thirdPartyFoo` namespace round-trips unchanged via `catchall(z.unknown())`.
- [x] 2.6 Re-type `extensions` in `krdSchema` to `krdExtensionsSchema` — a tagged `z.object({...known...}).catchall(z.unknown())` admitting the reserved namespaces (`structured_workout`, `fit`, `course`, `course_points`, `health.<metric>`) and preserving any unknown keys.
- [ ] 2.7 Bump the canonical KRD `version` regex literal from `"1.0"` to `"2.0"`. **Note**: a dedicated `version.ts` file is not required — KRD producers emit the version field directly; the schema accepts any `\d+\.\d+`. Producers SHOULD emit `"2.0"` when carrying any health payload. Track follow-up for downstream producers to bump emission in PR 2 (FIT mappers).
- [x] 2.8 Run `pnpm --filter @kaiord/core test && pnpm --filter @kaiord/core build` and confirm clean output (309 tests pass; build produces 39 KB ESM + 112 KB DTS without warnings).

## 3. UnsupportedKrdTypeError + workout-only writer rejection

- [x] 3.1 Add `packages/core/src/domain/types/unsupported-krd-type-error.ts` (the project's canonical error directory is `domain/types/`, not `domain/errors/`) exporting `UnsupportedKrdTypeError` + `createUnsupportedKrdTypeError` factory with `krdType: FileType` and `adapterName: string` fields. Re-export from the `domain/types/errors.ts` barrel. Co-located `unsupported-krd-type-error.test.ts` covers instance shape, factory message rendering, and `instanceof` discovery from a generic catch.
- [x] 3.2 Add a test in `packages/tcx/src/adapters/fast-xml-parser.health-rejection.test.ts` (the actual writer factory lives in `fast-xml-parser.ts`, not a separate `tcx-writer.ts`) covering all six health types throwing `UnsupportedKrdTypeError` with `krdType` and `adapterName: "tcx"`.
- [x] 3.3 Update the TCX writer dispatch in `fast-xml-parser.ts` to throw `createUnsupportedKrdTypeError(krd.type, "tcx")` for every health-type KRD via `isHealthFileType(krd.type)` guard; existing parsing errors for malformed input are preserved.
- [x] 3.4 Repeat 3.2–3.3 for ZWO in `packages/zwo/src/adapters/fast-xml-parser.health-rejection.test.ts` with `adapterName: "zwo"`.
- [x] 3.5 Repeat 3.2–3.3 for Garmin in `packages/garmin/src/adapters/garmin-writer.health-rejection.test.ts` with `adapterName: "garmin"`.
- [ ] 3.6 Add a test for each workout-only reader (TCX, ZWO, GCN) that the reader's `type` output is never one of the six health variants for any valid source. **Deferred to PR 2** — readers already hardcode `type: "structured_workout"`; the test would be tautological without an actual health FIT fixture to source from. The invariant is enforced at compile time by the `fileTypeSchema` literal used by each reader.
- [x] 3.7 Run `pnpm --filter @kaiord/tcx --filter @kaiord/zwo --filter @kaiord/garmin test` and confirm green (TCX 392 + ZWO 230 + GCN 108 all pass).

## 4. FIT adapter — message registration + six mappers

- [ ] 4.1 Add failing test in `packages/fit/src/adapters/shared/message-numbers.test.ts` asserting `FIT_MESSAGE_NUMBERS` contains `WEIGHT_SCALE`, `MONITORING`, `MONITORING_INFO`, `SLEEP_LEVEL`, `HRV`, `STRESS_LEVEL`, `BODY_COMPOSITION` with the FIT-SDK-canonical numbers.
- [ ] 4.2 Extend `packages/fit/src/adapters/shared/message-numbers.ts` to register the seven new message numbers and the four new `file_type` values (9, 15, 28, 32) so the test passes.
- [ ] 4.3 Replace the silent-discard null-check in `packages/fit/src/adapters/messages/messages.mapper.ts:62-67` with an explicit dispatch table that routes each known health message number to its mapper (mappers added in 4.5–4.10). Keep the `extensions.fit.unknownMessages` capture path for genuinely unknown messages.
- [ ] 4.4 Add failing dispatch tests confirming the routing: unknown messages still flow to `extensions.fit.unknownMessages`; known health messages flow to their health mapper.
- [ ] 4.5 TDD slice: sleep. Add a real Garmin FIT sleep fixture under `packages/fit/test-utils/fixtures/health/sleep-overnight.fit` (harvested from a real device, source documented in a sibling `README.md`). Add failing round-trip tests: `fromBinary` produces `type: "sleep_record"` with populated `extensions.health.sleep`; `fromBinary → toBinary → fromBinary` preserves stage durations within ±60 s. Implement `packages/fit/src/adapters/messages/health/fit-to-krd-health-sleep.converter.ts` and `krd-health-sleep-to-fit.converter.ts` so both directions pass.
- [ ] 4.6 Repeat 4.5 for weight (fixture `weight-scale.fit`, tolerance ±0.1 kg).
- [ ] 4.7 Repeat 4.5 for HRV (fixture `hrv-overnight.fit`, tolerance ±1 ms).
- [ ] 4.8 Repeat 4.5 for daily wellness (fixture `monitoring-daily.fit`, exact step count, ±1 kcal). This metric covers FIT file types 15, 28, and 32; per design.md Open Question §5, start with one representative `monitoringDaily (28)` fixture and document the choice in the fixture README. Expand to per-type fixtures only if round-trip reveals per-file-type drift.
- [ ] 4.9 Repeat 4.5 for body composition (fixture `body-composition.fit`, ±0.1 pp body fat).
- [ ] 4.10 Repeat 4.5 for stress (fixture `stress-episode.fit`, exact level integers).
- [ ] 4.11 Run `pnpm --filter @kaiord/fit test` and confirm every health round-trip test passes with zero regressions in existing workout/activity/course tests.

## 5. Adapter coverage documentation

- [x] 5.1 Create `packages/core/docs/ADAPTER-COVERAGE.md` containing the coverage matrix exactly as declared in the `adapter-contracts` capability delta (FIT bidirectional for all types; TCX/ZWO/GCN `read+write` for workout/activity/course where applicable, `reject` for all six health types, `n/a` where the format does not define the type). Includes a header note explaining each cell value plus a code snippet showing the `isHealthFileType` guard that is the single source of truth for the `reject` cells.
- [x] 5.2 Cross-link from `docs/krd-format.md` to `packages/core/docs/ADAPTER-COVERAGE.md` from the new "KRD v2.0 — Health Domain Extension" section and from the References list.

## 6. SPA Dexie v14 + six health repositories

- [ ] 6.1 Add failing tests in `packages/workout-spa-editor/src/adapters/dexie/dexie-schemas.test.ts` asserting `CORE_V14` declares each of the six health stores with the required indexes, and that v13 stores are unchanged byte-equivalently.
- [ ] 6.2 Extend `dexie-schemas.ts` with `CORE_V14 = { ...CORE_V13, healthSleep: "id, [profileId+date], date", healthWeight: …, healthHrv: …, healthDaily: …, healthBodyComposition: …, healthStress: …}` so 6.1 passes.
- [ ] 6.3 Extend `dexie-migrations.ts` with a no-op `.version(14).stores(CORE_V14)` step (no data rewrite needed; the new stores are empty on upgrade).
- [ ] 6.4 Add a migration integration test: open v13 with seed data → upgrade to v14 → assert v13 data intact and v14 health stores accessible.
- [ ] 6.5 Add a failing-upgrade simulation test that aborts the v13 → v14 transaction mid-flight and asserts the database remains at v13 (storage degradation behaviour unchanged).
- [ ] 6.6 Define the six health record schemas in `packages/workout-spa-editor/src/types/health/` (`health-sleep-record.ts`, etc.), each importing the corresponding Zod payload from `@kaiord/core` and adding the Dexie row fields (`id`, `profileId`, `date`).
- [ ] 6.7 For each metric, add failing tests in `dexie-health-{metric}-repository.test.ts` covering `put`, `getById`, `getByProfileAndDateRange` (with profile isolation), `upsertMany` idempotency, `delete` no-op for missing id, and `deleteByProfile` cascade. Implement `dexie-health-{metric}-repository.ts` so each test passes.
- [ ] 6.8 Add the six repositories to `PersistencePort` and wire them through the `DexiePersistenceAdapter`. Update the in-memory adapter with `InMemoryHealthSleepRepository` etc. that share the test surface from 6.7.
- [ ] 6.9 Add the six `useLiveQuery` hooks under `src/hooks/health/`: `useHealthSleepWeekLive(profileId, weekId)`, `useHealthWeightHistoryLive(profileId, range)`, `useHealthHrvHistoryLive`, `useHealthDailyTodayLive`, `useHealthBodyCompositionLatestLive`, `useHealthStressDayLive`. Tests cover loading (`undefined`) vs empty (`[]`) vs populated.
- [ ] 6.10 Run `pnpm --filter @kaiord/workout-spa-editor test` and confirm green.

## 7. SPA navigation surface (Training / Health / Settings tab bar)

- [ ] 7.1 Decide tab bar vs sidebar at the start of this section (prototype both for one breakpoint each, then commit to one). Document the choice and the responsive plan in a short ADR-style note at `packages/workout-spa-editor/src/components/templates/MainLayout/PRIMARY_NAV_DECISION.md` (one page max).
- [ ] 7.2 Add failing tests in `MainLayout/PrimaryNav.test.tsx` covering: tab bar mounts with three labels in order (Training, Health, Settings); clicking Training from `/health/sleep` navigates to `/calendar`; clicking Health from `/calendar` navigates to `/health`; clicking Settings opens the meta modal without URL change; the active tab is visually indicated; re-clicking active tab is a no-op.
- [ ] 7.3 Implement `MainLayout/PrimaryNav.tsx` and mount it inside `MainLayout` between the header and the route outlet so the tests in 7.2 pass. Reuse the existing Settings modal trigger.
- [ ] 7.4 Add a regression test that existing deep links (`/library`, `/workout/abc-123`) still resolve to their existing routed pages with the Training tab active.

## 8. SPA Health Hub routes (5 routed pages)

- [ ] 8.1 Add failing route tests in `AppRoutes.test.tsx` asserting that `/health`, `/health/sleep`, `/health/weight`, `/health/recovery`, `/health/activity` all resolve to mounted page components with `[data-route-heading]` focused and the announcer label updated exactly once.
- [ ] 8.2 Register the five new routes in `AppRoutes.tsx`, mapped to new page modules under `src/pages/health/` (one file per route).
- [ ] 8.3 Implement `pages/health/HealthDashboardPage.tsx`: aggregates the six metric live hooks into a read-only summary view. Stays under 60-line component cap; extract sub-components to `src/components/organisms/health/` as needed.
- [ ] 8.4 Implement `pages/health/HealthSleepPage.tsx`: list view backed by `useHealthSleepWeekLive`; per-record drill-down.
- [ ] 8.5 Implement `pages/health/HealthWeightPage.tsx`: weight history backed by `useHealthWeightHistoryLive`, with optional body-composition overlay.
- [ ] 8.6 Implement `pages/health/HealthRecoveryPage.tsx`: HRV + stress combined view.
- [ ] 8.7 Implement `pages/health/HealthActivityPage.tsx`: daily wellness (steps / calories / intensity).
- [ ] 8.8 Extend the existing `check-no-library-dual-mount.mjs` guard pattern with an analogous `check-no-health-dual-mount.mjs` script under `scripts/`, allowlisting only the five page surfaces. Add it to `pnpm test:scripts` and the husky pre-commit run.
- [ ] 8.9 Add e2e tests (gated behind `E2E_PROD_BASE=1`) verifying refresh of each `/health/*` URL survives via the rafgraph fallback.

## 9. FIT import flow routes health to the health pipeline

- [ ] 9.1 Add failing tests in `application/health/import-health-fit-file.use-case.test.ts` covering: a sleep FIT file persists into `healthSleep` and triggers a success toast; a weight FIT file persists into `healthWeight`; an unsupported `file_type` surfaces a clear error toast; an `UnsupportedKrdTypeError` from a workout-only writer is caught and surfaced via toast.
- [ ] 9.2 Implement `application/health/import-health-fit-file.use-case.ts` taking `PersistencePort` and dispatching on the resulting KRD's `type` to the correct repository's `upsertMany`. Throw / surface clear errors for unsupported file types.
- [ ] 9.3 Extend the existing Settings → Import UI surface to dispatch on FIT `file_type`: workout types → existing workout import; health types → `importHealthFitFile`. Tests cover the dispatch.

## 10. MCP tools for health domain

- [ ] 10.1 Add failing smoke tests under `packages/mcp/src/server/tools/health/` for each of the five new tools: `get-health-summary`, `get-sleep-history`, `get-weight-history`, `get-hrv-history`, `get-recovery-status`. Tests inject seed data via the in-memory persistence and assert tool outputs are well-formed JSON.
- [ ] 10.2 Implement each tool as a separate file under `packages/mcp/src/server/tools/health/`, each registered via the existing tool-registration pattern in `create-server.ts`.
- [ ] 10.3 Update `SERVER_INSTRUCTIONS` in `packages/mcp/src/server/create-server.ts:31-36` to mention the new health domain and the five tools.
- [ ] 10.4 Run `pnpm --filter @kaiord/mcp test` and confirm green.

## 11. KRD v2.0 version bump + documentation

- [x] 11.1 Update `docs/krd-format.md` with a "KRD v2.0 — Health Domain Extension" section: the three breaking changes (type enum extended, `metadata.sport` conditional, `extensions` tagged), an example sleep KRD, the migration path for external consumers, and a "Health follow-ups" subsection listing the deferred GCN endpoints / bridge / write-back / non-Garmin sources / SPA Health Hub / MCP tools as separate change items.
- [x] 11.2 Cross-link from `docs/krd-format.md` to `packages/core/docs/ADAPTER-COVERAGE.md` from the v2.0 section body and from the References list.
- [x] 11.3 Add changeset `.changeset/add-health-metrics-to-krd-pr1.md` declaring `@kaiord/core: major`. Because every publishable package is **linked** in `.changeset/config.json`, `pnpm exec changeset status` automatically propagates `major` to `@kaiord/ai`, `@kaiord/cli`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/garmin-connect`, `@kaiord/mcp`, `@kaiord/tcx`, and `@kaiord/zwo` — confirmed via `pnpm exec changeset status`. (`@kaiord/workout-spa-editor` is private and remains minor from a prior changeset; it will be bumped independently in PR 3 when it consumes the v2 schemas.)
- [ ] 11.4 Open follow-up issues for the three deferred scopes:

  > Deferred to: #TBD-GCN-HEALTH-ENDPOINTS

  > Deferred to: #TBD-GARMIN-BRIDGE-WELLNESS-SCRAPE

  > Deferred to: #TBD-WEIGHT-WRITE-BACK-TO-GARMIN

  Replace each `#TBD-…` with the real issue number once filed (issue numbers are positive integers prefixed with `#`).

## 12. Cross-cutting verification

- [ ] 12.1 Run `pnpm -r test` and confirm green across all packages.
- [ ] 12.2 Run `pnpm -r build` and confirm clean output across all packages.
- [ ] 12.3 Run `pnpm lint` and confirm zero warnings (per the repo's zero-warning policy in `CLAUDE.md`). This also enforces the `should` test-title rule and the AAA marker rule on every new test file added in §1, §3, §4, §6, §7, §8, §9, §10.
- [ ] 12.4 Run `pnpm lint:specs` and confirm the spec delta passes structural validation (`scripts/check-spec-format.mjs` + `openspec validate --specs`).
- [ ] 12.5 Run `pnpm test:scripts` and confirm `check-no-health-dual-mount.mjs` (added in 8.8) passes alongside all existing mechanical guards, including `check-no-pii-leakage.mjs` (toast / `console.*` first arguments under the new `pages/health/**` and `components/organisms/health/**` paths must satisfy R-PIIInterpolation: static string literals or top-level SCREAMING_SNAKE_CASE constants only — never interpolations of biometric values).
- [ ] 12.6 Run `pnpm lint:archive` and `pnpm lint:archive-index` to confirm the not-yet-archived change does not trigger archive lint regressions.
- [ ] 12.7 Run `pnpm exec changeset status` and confirm the seven major bumps from §11.3 are present in `.changeset/` with the correct package list (`@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/mcp`, `@kaiord/workout-spa-editor`).

## 13. Verification against spec

- [ ] 13.1 Run `/opsx:verify add-health-metrics-to-krd` and confirm each spec scenario maps to a passing test or a documented artefact (the `ADAPTER-COVERAGE.md` doc, the `PRIMARY_NAV_DECISION.md` note, the migration section in `docs/krd-format.md`).
- [ ] 13.2 Manually validate one end-to-end smoke path in the SPA: import a real Garmin sleep FIT file → see it appear in `/health/sleep` → confirm the live-announcer reads "Sleep" exactly once on navigation → confirm a successful round-trip via the import flow (KRD → Dexie → live hook).
