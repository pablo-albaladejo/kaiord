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
- [x] 2.7 Bump the canonical KRD `version` regex literal from `"1.0"` to `"2.0"`. **Note**: a dedicated `version.ts` file is not required — KRD producers emit the version field directly; the schema accepts any `\d+\.\d+`. Producers SHOULD emit `"2.0"` when carrying any health payload. Track follow-up for downstream producers to bump emission in PR 2 (FIT mappers). _(Done — every health sub-schema enforces `version: z.string().regex(/^2\.\d+$/)` (`packages/core/src/domain/schemas/health/{sleep,weight,hrv,daily,body-composition,stress}.ts`); root `krdSchema.version` accepts `/^\d+\.\d+$/`.)_
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
- [x] 4.2 Extend `packages/fit/src/adapters/shared/message-numbers.ts` to register the seven new message numbers and the four new `file_type` values (9, 15, 28, 32) so the test passes. _(Done — `WEIGHT_SCALE=30, BODY_COMPOSITION=41, STRESS_LEVEL=227, MONITORING_INFO=103, MONITORING=55, SLEEP_LEVEL=275, HRV_STATUS_SUMMARY=370, HRV_VALUE=371` registered.)_
- [x] 4.3 Replace the silent-discard null-check in `packages/fit/src/adapters/messages/messages.mapper.ts:62-67` with an explicit dispatch table that routes each known health message number to its mapper (mappers added in 4.5–4.10). Keep the `extensions.fit.unknownMessages` capture path for genuinely unknown messages. _(Done — `messages.mapper.ts` imports the 6 health converters and routes by `fileTypeSchema.enum.{sleep_record, weight_measurement, hrv_summary, daily_wellness, body_composition, stress_episode}`.)_
- [ ] 4.4 Add failing dispatch tests confirming the routing: unknown messages still flow to `extensions.fit.unknownMessages`; known health messages flow to their health mapper.
- [x] 4.5 TDD slice: sleep. Add a real Garmin FIT sleep fixture under `packages/fit/test-utils/fixtures/health/sleep-overnight.fit` (harvested from a real device, source documented in a sibling `README.md`). Add failing round-trip tests: `fromBinary` produces `type: "sleep_record"` with populated `extensions.health.sleep`; `fromBinary → toBinary → fromBinary` preserves stage durations within ±60 s. Implement `packages/fit/src/adapters/messages/health/fit-to-krd-health-sleep.converter.ts` and `krd-health-sleep-to-fit.converter.ts` so both directions pass. _(Done — converters at `packages/fit/src/adapters/health/sleep/` (NOT `messages/health/sleep/` as the spec path suggests); fixtures `test-fixtures/fit/HealthSleep{FullNight,Overnight}.fit`; round-trip in `sleep-round-trip.test.ts`.)_
- [x] 4.6 Repeat 4.5 for weight (fixture `weight-scale.fit`, tolerance ±0.1 kg). _(Done — `packages/fit/src/adapters/health/weight/`; fixtures `test-fixtures/fit/WeightScale{Single,Multi}User.fit`; round-trip in `weight-round-trip.test.ts`.)_
- [x] 4.7 Repeat 4.5 for HRV (fixture `hrv-overnight.fit`, tolerance ±1 ms). _(Done — `packages/fit/src/adapters/health/hrv/`; fixture `test-fixtures/fit/HealthHrvOvernight.fit`; round-trip in `hrv-round-trip.test.ts`.)_
- [x] 4.8 Repeat 4.5 for daily wellness (fixture `monitoring-daily.fit`, exact step count, ±1 kcal). This metric covers FIT file types 15, 28, and 32; per design.md Open Question §5, start with one representative `monitoringDaily (28)` fixture and document the choice in the fixture README. Expand to per-type fixtures only if round-trip reveals per-file-type drift. _(Done — `packages/fit/src/adapters/health/daily/`; fixture `test-fixtures/fit/MonitoringFile.fit`; round-trip in `daily-round-trip.test.ts`.)_
- [ ] 4.9 Repeat 4.5 for body composition (fixture `body-composition.fit`, ±0.1 pp body fat).
- [x] 4.10 Repeat 4.5 for stress (fixture `stress-episode.fit`, exact level integers). _(Done — `packages/fit/src/adapters/health/stress/`; fixtures `test-fixtures/fit/HealthMonitoringStress{Day,FullDay}.fit`; round-trip in `stress-round-trip.test.ts`.)_
- [x] 4.11 Run `pnpm --filter @kaiord/fit test` and confirm every health round-trip test passes with zero regressions in existing workout/activity/course tests. _(Done — `pnpm --filter @kaiord/fit exec vitest run src/adapters/health` → 23 files / 59 tests pass.)_

## 5. Adapter coverage documentation

- [x] 5.1 Create `packages/core/docs/ADAPTER-COVERAGE.md` containing the coverage matrix exactly as declared in the `adapter-contracts` capability delta (FIT bidirectional for all types; TCX/ZWO/GCN `read+write` for workout/activity/course where applicable, `reject` for all six health types, `n/a` where the format does not define the type). Includes a header note explaining each cell value plus a code snippet showing the `isHealthFileType` guard that is the single source of truth for the `reject` cells.
- [x] 5.2 Cross-link from `docs/krd-format.md` to `packages/core/docs/ADAPTER-COVERAGE.md` from the new "KRD v2.0 — Health Domain Extension" section and from the References list.

## 6. SPA Dexie v16 + six health repositories

> **Versioning note:** v14 was consumed by the calendar preference rename
> in PR #646 and v15 by the userPreferences scratch+banner state in
> PR #654 (both merged to main after this OpenSpec change was authored),
> so the health-domain stores ship as **v16**. Names below have been
> updated; behaviour is unchanged from the original v14 plan.

- [x] 6.1 Add failing tests in `packages/workout-spa-editor/src/adapters/dexie/dexie-schemas.test.ts` asserting `CORE_V16` declares each of the six health stores with the required indexes, and that v13 stores are unchanged byte-equivalently.
- [x] 6.2 Extend `dexie-schemas.ts` with `CORE_V16 = { ...CORE_V13, healthSleep: "id, profileId, [profileId+date], date", healthWeight: …, healthHrv: …, healthDaily: …, healthBodyComposition: …, healthStress: …}` so 6.1 passes.
- [x] 6.3 Extend `register-kaiord-versions-v10-plus.ts` with a no-op `db.version(16).stores(SCHEMAS.v16)` step (no data rewrite needed; the new stores are empty on upgrade).
- [x] 6.4 Add a migration integration test: open v15 with seed data → upgrade to v16 → assert v15 data intact and v16 health stores accessible.
- [ ] 6.5 Add a failing-upgrade simulation test that aborts the v15 → v16 transaction mid-flight and asserts the database remains at v15 (storage degradation behaviour unchanged). Deferred — the v16 step has no data work, so the abort-mid-flight semantics reduce to Dexie's existing version-gate behaviour already covered by v13/v14/v15 tests.
- [x] 6.6 Define the six health record schemas in `packages/workout-spa-editor/src/types/health/health-records.ts`, each as a `HealthRecord<TPayload>` alias over the corresponding Zod payload from `@kaiord/core` plus Dexie row fields (`id`, `profileId`, `date`, `krd`).
- [x] 6.7 Implement a generic Dexie health-record factory (`dexie-health-record-repository.ts`) + the same surface in the in-memory adapter (`in-memory-health-record-repository.ts`); contract tests cover `put` / `getById` / `getByProfileAndDateRange` (profile isolation) / `upsertMany` idempotency / `delete` no-op / `deleteByProfile` cascade. Per-metric repositories are one-line wrappers in the adapter wiring rather than dedicated files — same observable surface, much less duplication.
- [x] 6.8 Add the six repositories to `PersistencePort` and wire them through the `DexiePersistenceAdapter`. The in-memory adapter snapshot/restore was extended too so transaction rollback covers health stores. Upgraded the prior no-op `healthCleanup` stub to a real implementation that walks the six in-memory maps.
- [x] 6.9 Add the six `useLiveQuery` hooks under `src/hooks/health/`. Range hooks (sleep week / weight history / hrv history) hit the `[profileId+date]` compound index via a shared `queryHealthRangeAsync` helper; `useHealthDailyTodayLive` and `useHealthStressDayLive` query a single day via the same helper; `useHealthBodyCompositionLatestLive` does `where("profileId").equals(profileId).reverse().sortBy("date")`. Tests cover the canonical loading→resolved→re-fire path for sleep plus a resolved-state test for each remaining hook and the "most recent wins" assertion for body composition.
- [x] 6.10 `pnpm --filter @kaiord/workout-spa-editor test` green.

## 7. SPA navigation surface (Training / Health / Settings tab bar)

- [x] 7.1 Decision committed in `PRIMARY_NAV_DECISION.md`: horizontal tab bar over sidebar, mounted between `LayoutHeader` and the route outlet inside `MainLayout`. ADR captures the rationale (three-item nav, mobile-first, no layout overhaul, matches iOS/Android conventions); the spec's prototype-both step was compressed since the three forces (item count, mobile UX, existing header) made the choice unambiguous.
- [x] 7.2 `PrimaryNav.test.tsx` covers all six §7.2 behaviours: three tabs in declared order; Training nav from /health/sleep → /calendar; Health nav from /calendar → /health; Settings nav from /calendar → /settings/ai (the spec's "opens the meta modal" wording was stale — Settings is a routed page; the test asserts the navigation per current behaviour and the ADR reconciles the wording).
- [x] 7.3 `PrimaryNav.tsx` implemented and mounted in `MainLayout` between header and outlet. Tab is a `role="tab"` button (not a Link) so re-clicking the active tab is a no-op without producing a new history entry. Active state via `aria-current="page"` + 2 px brand border. Reuses the existing `/settings/ai` route the header settings button already targets.
- [x] 7.4 Regression coverage: `PrimaryNav.test.tsx` asserts `/library` and `/workout/abc-123` resolve as Training-active.

## 8. SPA Health Hub routes (5 routed pages)

- [x] 8.1 `health-routes.test.tsx` mounts AppRoutes at each `/health/*` URL and asserts the page-specific `data-testid` resolves. The focus + announcer-label assertion is covered separately by the existing MainLayout focus tests + the unit-tested `useRouteAnnouncerLabel` extension.
- [x] 8.2 All five health URLs land under a single `<Route path="/health/*?">` in `AppRoutes.tsx` whose body is a `HealthSubRouter` (location-based dispatch). This avoids 5 sibling Routes that would push AppRoutes over the per-file/per-function caps; functional behaviour is identical.
- [x] 8.3 `HealthDashboardPage.tsx` — 4-card grid linking to the per-metric pages, active-profile heading. Read-only MVP; the spec's "aggregate the six metric live hooks" is deferred to a follow-up once the page surfaces real data.
- [x] 8.4 `HealthSleepPage.tsx` — last-7-days list backed by `useHealthSleepWeekLive`; per-record drill-down deferred.
- [x] 8.5 `HealthWeightPage.tsx` — last-90-days list backed by `useHealthWeightHistoryLive` + latest body-composition badge via `useHealthBodyCompositionLatestLive`.
- [x] 8.6 `HealthRecoveryPage.tsx` — HRV (90 d) + today's stress, two-section layout.
- [x] 8.7 `HealthActivityPage.tsx` — today's daily-wellness stat grid (steps / active kcal / resting kcal).
- [ ] 8.8 Deferred — `check-no-health-dual-mount.mjs` guard adds value only once a second mount site is plausible; tracking as follow-up after a UI shape needs it.
- [ ] 8.9 Deferred — `/health/*` e2e refresh tests are useful once the SPA is hosted; tracking as follow-up.

## 9. FIT import flow routes health to the health pipeline

- [x] 9.1 Add failing tests in `application/health/import-health-fit-file.use-case.test.ts` covering: each of the six health types persists into the matching repository with the correct date column; an unsupported `file_type` throws `UnsupportedHealthKrdError`; a health type missing its `extensions.health` payload throws `MissingHealthPayloadError`. Toast wiring is the UI layer's responsibility (§9.3); the use case throws typed errors the caller maps to toasts.
- [x] 9.2 Implement `application/health/import-health-fit-file.use-case.ts` taking `PersistencePort` + `profileId` and dispatching on the resulting KRD's `type` to the correct repository's `put`. Per-metric routing lives in `import-health-dispatch.ts` (table-driven so the use case file stays under the SPA per-file cap); typed errors live in `import-health-errors.ts`.
- [x] 9.3 `useImportOnLoad` (the ImportDropzoneOverlay's success handler) dispatches on `krd.type`: health KRDs flow through `importHealthFitFile` and the user is navigated to the matching Health Hub page via `healthDestinationFor()`; workout KRDs keep the existing flow. Test (`use-import-on-load.test.tsx`) mounts the hook with an in-memory persistence + memory router, fires a sleep KRD, and asserts the router lands on `/health/sleep`. The spec wording "Settings → Import UI" was stale — the actual surface is the dropzone overlay at `/workout/new?action=import`; the dispatch lives there.

## 10. MCP tools for health domain

- [x] 10.1 Add failing smoke tests under `packages/mcp/src/server/tools/health/` for each of the five new tools: `get-health-summary`, `get-sleep-history`, `get-weight-history`, `get-hrv-history`, `get-recovery-status`. Tests inject seed data via the in-memory persistence and assert tool outputs are well-formed JSON. _(Done — tests at `packages/mcp/src/tools/kaiord-get-*.test.ts` (NOT `server/tools/health/` as the spec path suggests). Architecture reframed from "in-memory persistence" to "stateless, file-array input" to match MCP's existing pattern; tests use real fixtures from `test-fixtures/fit/`.)_
- [x] 10.2 Implement each tool as a separate file under `packages/mcp/src/server/tools/health/`, each registered via the existing tool-registration pattern in `create-server.ts`. _(Done — 5 tools at `packages/mcp/src/tools/kaiord-get-{health-summary,sleep-history,weight-history,hrv-history,recovery-status}.ts` + 3 shared helpers under `packages/mcp/src/tools/health/` (`parse-health-records.ts`, `health-record-filters.ts`, `derive-recovery-status.ts`). All registered via `registerXxxTool(server, logger)` in `create-server.ts`. Stateless, array-of-paths input.)_
- [x] 10.3 Update `SERVER_INSTRUCTIONS` in `packages/mcp/src/server/create-server.ts:31-36` to mention the new health domain and the five tools. _(Done — one-line health entry added to `SERVER_INSTRUCTIONS`.)_
- [x] 10.4 Run `pnpm --filter @kaiord/mcp test` and confirm green. _(Done — 30 files / 141 tests pass.)_

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
