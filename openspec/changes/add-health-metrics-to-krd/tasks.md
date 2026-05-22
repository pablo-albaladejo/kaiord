<!-- opsx-ship: chunking
PR 1 (core-domain): §1, §2, §3
PR 2 (fit-adapter):  §4, §5
PR 3 (spa-persistence): §6
PR 4 (spa-ui):        §7, §8, §9
PR 5 (mcp + docs):    §10, §11
PR 6 (verification):  §12, §13
-->

## 1. Health sub-schemas (`packages/core/src/domain/schemas/health/`)

- [ ] 1.1 Add `packages/core/src/domain/schemas/health/tolerances.ts` exporting per-metric round-trip tolerance constants (`SLEEP_STAGE_TOLERANCE_SECONDS = 60`, `WEIGHT_TOLERANCE_KG = 0.1`, `HRV_TOLERANCE_MS = 1`, `DAILY_STEPS_TOLERANCE = 0`, `DAILY_KCAL_TOLERANCE = 1`, `BODY_FAT_TOLERANCE_PERCENT = 0.1`, `STRESS_TOLERANCE = 0`).
- [ ] 1.2 Add failing tests in `packages/core/src/domain/schemas/health/sleep.schema.test.ts` covering: valid sleep payload validates, stages summing within ±60 s of total validates, stages diverging >60 s rejected, missing `startTime` rejected, unknown `version` rejected.
- [ ] 1.3 Implement `sleep.schema.ts` with the discriminated Zod schema (kind / version / stages with refine on duration sum) so tests pass. Keep file under 100 lines.
- [ ] 1.4 Repeat 1.2–1.3 for `weight.schema.{ts,test.ts}` (scalar weight, positivity refinement).
- [ ] 1.5 Repeat 1.2–1.3 for `hrv.schema.{ts,test.ts}` (overnight/spot enum, positive rMSSD).
- [ ] 1.6 Repeat 1.2–1.3 for `daily.schema.{ts,test.ts}` (steps non-negative, calories non-negative, intensity minutes nested object).
- [ ] 1.7 Repeat 1.2–1.3 for `body-composition.schema.{ts,test.ts}` (at-least-one-field refinement).
- [ ] 1.8 Repeat 1.2–1.3 for `stress.schema.{ts,test.ts}` (peak ≥ average refinement, endTime ≥ startTime).
- [ ] 1.9 Add `packages/core/src/domain/schemas/health/index.ts` barrel exporting the six sub-schemas, their inferred record types, the discriminated union `healthExtensionSchema`, and the tolerances module.
- [ ] 1.10 Run `pnpm --filter @kaiord/core test` and confirm all health-schema tests pass with zero regressions.

## 2. KRD core schema extensions

- [ ] 2.1 Add a failing test in `packages/core/src/domain/schemas/file-type.test.ts` asserting `fileTypeSchema` accepts each of the six new variants (`sleep_record`, `weight_measurement`, `hrv_summary`, `daily_wellness`, `body_composition`, `stress_episode`) and continues to accept the three existing variants.
- [ ] 2.2 Extend `packages/core/src/domain/schemas/file-type.ts` with the six new enum values so the test passes.
- [ ] 2.3 Add failing tests in `packages/core/src/domain/schemas/krd/metadata.test.ts` for the new conditional `sport` rule: workout `type` with `sport` validates, workout `type` without `sport` rejected, health `type` without `sport` validates, health `type` with `sport` rejected.
- [ ] 2.4 Change `metadata.sport` to `z.string().optional()` and attach the `superRefine` on `krdSchema` so the four scenarios in 2.3 pass without regressing the existing `WorkoutStep` refinements.
- [ ] 2.5 Add failing tests in `packages/core/src/domain/schemas/krd/index.test.ts` for the discriminated `extensions` shape: each of the six health namespaces validates, the three legacy namespaces (`structured_workout`, `course`, `fit`) still validate, an unknown namespace (`thirdPartyFoo`) round-trips unchanged.
- [ ] 2.6 Re-type `extensions` in `krdSchema` to the discriminated union admitting the reserved namespaces plus a fallback `z.record(z.string(), z.unknown())` for unknown keys so the tests in 2.5 pass.
- [ ] 2.7 Bump the canonical KRD `version` literal from `"1.0"` to `"2.0"` in `packages/core/src/domain/schemas/krd/version.ts` (create the file if it does not exist; otherwise edit in place). Add tests covering both v1.0 and v2.0 acceptance for legacy types and v2.0-only acceptance for health types.
- [ ] 2.8 Run `pnpm --filter @kaiord/core test && pnpm --filter @kaiord/core build` and confirm clean output.

## 3. UnsupportedKrdTypeError + workout-only writer rejection

- [ ] 3.1 Add `packages/core/src/domain/errors/unsupported-krd-type-error.ts` exporting `class UnsupportedKrdTypeError extends Error { constructor(public readonly krdType: string, public readonly adapterName: string) { super(`Adapter ${adapterName} cannot write KRD type ${krdType}`); this.name = "UnsupportedKrdTypeError"; } }`. Co-locate `unsupported-krd-type-error.test.ts` covering construction with all six health type strings.
- [ ] 3.2 Add a failing test in `packages/tcx/src/adapters/workout/tcx-writer.test.ts` (or the equivalent writer test file) asserting that calling the TCX writer with a KRD whose `type` is `sleep_record` throws `UnsupportedKrdTypeError` with the correct fields.
- [ ] 3.3 Update the TCX writer dispatch to throw `UnsupportedKrdTypeError("sleep_record" | …, "tcx")` for every health-type KRD; do NOT replace the existing parsing errors for genuinely malformed input.
- [ ] 3.4 Repeat 3.2–3.3 for `packages/zwo/src/adapters/zwo-writer.test.ts` with `adapterName: "zwo"`.
- [ ] 3.5 Repeat 3.2–3.3 for `packages/garmin/src/adapters/converters/krd-to-garmin.converter.test.ts` with `adapterName: "garmin"`.
- [ ] 3.6 Add a test for each workout-only reader (TCX, ZWO, GCN) that the reader's `type` output is never one of the six health variants for any valid source.
- [ ] 3.7 Run `pnpm -r --filter "@kaiord/tcx" --filter "@kaiord/zwo" --filter "@kaiord/garmin" test` and confirm green.

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

- [ ] 5.1 Create `packages/core/docs/ADAPTER-COVERAGE.md` containing the coverage matrix exactly as declared in the `adapter-contracts` capability delta (FIT bidirectional for all types; TCX/ZWO/GCN `read+write` for workout/activity/course where applicable, `reject` for all six health types, `n/a` where the format does not define the type). Include a header note explaining the meaning of each cell value.
- [ ] 5.2 Cross-link from `docs/krd-format.md` (the canonical KRD doc) to `packages/core/docs/ADAPTER-COVERAGE.md` so contributors find the matrix when reading the format spec.

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

- [ ] 11.1 Update `docs/krd-format.md` with a "v2.0 migration" section: the three breaking changes (type enum extended, `metadata.sport` conditional, `extensions` tagged), example KRDs for each new health type, the migration path for external consumers, and a "Health follow-ups" section listing the deferred GCN endpoints / bridge / write-back issues with placeholders for GitHub issue numbers.
- [ ] 11.2 Cross-link from `docs/krd-format.md` to `packages/core/docs/ADAPTER-COVERAGE.md`.
- [ ] 11.3 Add a changeset for each affected package with the correct bump level:
  - `pnpm exec changeset` → `@kaiord/core` major, `@kaiord/fit` major, `@kaiord/tcx` major, `@kaiord/zwo` major, `@kaiord/garmin` major, `@kaiord/mcp` major (depends on core), `@kaiord/workout-spa-editor` major (private but bumped for hygiene).
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
