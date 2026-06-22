# Tasks — energy-balance-tracking

Each numbered group is an independently-shippable slice (its own PR + changeset).
Follow TDD: write the failing test (AAA, `should…` titles) before the implementation.

## 1. Phase 0 — Profile fields & core domain foundations  ✅ (commit 8fd67b9d)

- [x] 1.1 Core value schemas `macroNutrients`/`energyGoal`/`dayEnergyBalance` (+ `mealSlot`/`goalType`/`expenditureSource` enums) wired through the export chain. (Persisted records `IntakeEntry`/`IntakePreset`/`EnergyTarget` live in SPA `types/` as camelCase, per the HealthRecord pattern.)
- [x] 1.2 Pure BMR calculator (Mifflin-St Jeor + Katch-McArdle, formula recorded), 100% covered
- [x] 1.3 Pure expenditure resolution (measured = resting+active; predicted = BMR + expectedActivityKcal; source labelled)
- [x] 1.4 Profile schema extended with optional `height`/`birthDate`/`sex`/`restingHeartRate`/`activityLevel`
- [x] 1.5 Dexie **v25** stores `intakeEntries`/`intakePresets`/`energyTargets` + `dexie-v25-migration.test.ts`
- [x] 1.6 Stores excluded from the cloud snapshot (+ snapshot-port test); per-profile delete-cascade wired through the persistence port
- [x] 1.7 Profile-field edit UI (PhysiologyFields/PhysiologySelects). BMR-dependent gating deferred to Phase 1 (the read surface that needs it)
- [x] 1.8 Verified green (core 330 + spa 4838 tests, eslint, `pnpm test:scripts` 511 guards). Changeset deferred to the feature aggregation step

## 2. Phase 1 — Expenditure + target dashboard (read-only) & chatbot tool  ✅

- [x] 2.1 Core ports `IntakeEntryRepository`/`IntakePresetRepository`/`EnergyTargetRepository` (done in Phase 0)
- [x] 2.2 Dexie adapters for those ports (done in Phase 0)
- [x] 2.3 `buildDayEnergyBalance` use-case (measured vs BMR-fallback; intake untracked-not-zero; BMR-gated when profile incomplete) + `assembleDayEnergyBalance` pure core helper. Fixed sign convention to `net = intake − expenditure` (deficit negative) per spec
- [x] 2.4 `EnergyBalanceCard` on Daily (`useDayEnergyBalance` live hook; measured/predicted label; gated prompt → profile)
- [x] 2.5 `query_energy_balance` chat read tool registered in `build-chat-tools.ts`; unit-tested
- [x] 2.6 Verified green (core 27 + spa 96 energy tests, eslint, 511 guards). Changeset deferred to aggregation step

## 3. Phase 2 — Goal engine & periodized daily target  ✅

- [x] 3.1 `computeDailyDelta` (7700 kcal/kg; caps = 0.75%/week rate + FLOOR_KCAL=1200; muscle MUSCLE_SURPLUS_CAP=400; `capped`+`capReason`)
- [x] 3.2 `computePeriodizedTarget` (`max(floor, BMR + expectedActivityKcal + dailyDelta)`; flat until Phase 4 feeds per-day activity)
- [x] 3.3 `computeMacroTargets` (protein fat_loss 2.2 / gain 2.0 / maintain 1.8 g/kg; fat floor 0.8 g/kg; carbs = remainder)
- [x] 3.4 `GoalSetupDialog` wizard (split dialog/form/controls/field/preview/model/hooks) with cap warning + live preview
- [x] 3.5 Target + macro_targets surfaced on `EnergyBalanceCard`; goal context (goalType/delta/target/capped) in `query_energy_balance`
- [x] 3.6 Verified green (core 53 + spa 107 energy/goal tests, eslint, 511 guards). Changeset deferred. FOLLOW-UP: thread real clock into `useDayEnergyBalance` so non-today goal horizon uses true today (currently focused date)

## 4. Phase 3 — Intake logging & macros  ✅ (+ built the top-level Nutrition destination, spa-routing)

- [x] 4.1 Intake entry use-cases (logIntakeEntry non-negative validation, listIntakeForDate, deleteIntakeEntry) via the repos
- [x] 4.2 Preset use-cases (saveIntakePreset, listIntakePresets, applyPresetToDate, deleteIntakePreset)
- [x] 4.3 Intake logger UI (IntakeLoggerForm + meal slot + preset one-tap) on the new `/nutrition` page (5th BottomNav tab, Utensils, lazy-loaded)
- [x] 4.4 macro_actuals (sum-macro-actuals) vs macro_targets — MacroRings on Nutrition + EnergyBalanceCard; card deep-links to `/nutrition`; PII-safe static toasts
- [x] 4.5 `log_intake` chat action tool (confirmation-gated) wired through ChatActionOps + run-confirmed-tool
- [x] 4.6 Verified green (181 spa tests across 47 files, eslint, 511 guards). Changeset deferred

## 5. Phase 4 — Prospective planning (forward weekly kcal plan)  ✅

- [x] 5.1 Curated MET table keyed by the core `Sport` enum (`met-table.ts`: MET_TABLE + DEFAULT_MET=6.0 + metForSport). SCOPING: curated factual values for kaiord's sports rather than vendoring the 800-row Compendium (avoids the 800→sport mapping + dataset licensing); extensible
- [x] 5.2 `estimateExpectedActivityKcal` tiered estimator (power→kJ, running distance ≈1 kcal/kg/km, duration×MET×kg). Power tier skipped in practice (planned workouts express zones not absolute watts) → robust MET/running tiers
- [x] 5.3 `estimate-day-activity-kcal` + `build-week-energy-plan`; expectedActivityKcal threaded into BOTH predicted expenditure AND the periodized target (target now rises on scheduled-sport days; measured days keep measured expenditure)
- [x] 5.4 `WeeklyPlanSection`/`WeeklyPlanRow` + `useWeeklyEnergyPlan` in the Nutrition page
- [x] 5.5 Verified green (core 71 + spa 411 energy tests, eslint, 511 guards). Changeset deferred

## 6. Phase 5 — Tracking & correlations  ✅

- [x] 6.1 Core `exponentialMovingAverage` (alpha=2/(windowDays+1)) + `buildWeightTrend`/`useWeightTrend` (raw + smoothed + goal target-weight line)
- [x] 6.2 Core `aggregateEnergyBalance` (null intake/net excluded, never coerced to 0) + `buildEnergyRollup`/`useEnergyRollup` (gated days skipped)
- [x] 6.3 `EnergyTrendsSection` (lazy uPlot `UplotChart`): EMA weight + raw + dashed goal line, steps/sleep/weekly-training-time as trend-line overlays (no coefficients)
- [x] 6.4 Calendar net-balance badge: `DayWellness.net` + Flame badge def + `buildNetByWeek`/`mergeNetByDay` in the wellness pipeline; shown only when resolvable + intake logged, omitted otherwise
- [x] 6.5 Verified green (core 89 + spa 113+ tests, eslint, 511 guards). Changeset deferred

## 7. Phase 6 — Adaptive TDEE  ✅

- [x] 7.1 Core `computeAdaptiveTdee` (maintenance = avgIntake − weightChangeKg·KCAL_PER_KG_FAT/windowDays; MIN_ADAPTIVE_DAYS=14 → sufficientData gate; isEstimate always true)
- [x] 7.2 `compute-adaptive-maintenance` use-case feeds adaptive maintenance into the periodized target when sufficientData (self-correcting), modeled otherwise; estimate flag threaded through
- [x] 7.3 `AdaptiveMaintenanceCard` + `use-adaptive-maintenance` in Nutrition; adaptive maintenance in the `query_energy_balance` goal context
- [x] 7.4 Verified green (core 95 + spa 425 tests, eslint, 511 guards). Changeset in the wrap-up step

## 8. Cross-cutting verification

- [x] 8.1 New core energy modules ~100% covered; full-tree `pnpm -r build && pnpm -r test` green (exit 0)
- [x] 8.2 `openspec validate energy-balance-tracking --strict` valid (4/4 artifacts); repo `pnpm lint` confirmed clean; changeset `.changeset/energy-balance-tracking.md` (@kaiord/core minor) added
- [ ] 8.3 Manual smoke (USER): complete profile → set goal → log intake → see deficit on Today/Calendar → ask the chatbot
- [ ] 8.4 After merge, run `/opsx:archive` for the change

> NOTE: implemented on a branch in the MAIN checkout, predating the standing
> "always use git worktrees" directive. Branch commits are safe; consider moving to
> a worktree before push/PR.
