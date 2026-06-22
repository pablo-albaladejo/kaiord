## Why

Athletes can already see ingested wellness data (steps, sleep, HRV, weight, and
`activeCalories`/`restingCalories` per `DailyWellness`) but the SPA cannot answer the
question that actually drives training nutrition: **am I in a calorie deficit or
surplus today, and what should I eat?** The expenditure half of that equation is
already ingested and surfaced; the intake side, a deficit/surplus goal engine, the
roll-up of net energy over time, and chatbot answerability do not exist. This change
closes the loop so users can set a body-composition goal and get periodized,
sport-aware daily kcal + macro targets they can track against real intake.

## What Changes

- Add **physiological profile fields** (`height`, `birthDate`→age, `sex`, optional
  `restingHeartRate`/`activityLevel`) needed for basal-metabolic-rate estimation.
- Compute **energy expenditure** per day: measured (`activeCalories + restingCalories`
  when a connection covers the day) or predicted (`BMR + expectedActivityKcal`). BMR
  uses Katch-McArdle when body-fat % is known (from ingested `BodyComposition`), else
  Mifflin-St Jeor. Expected workout kcal is tiered: power→kJ, then running distance,
  then duration×MET×bodyweight via a MET compendium + sport→activity-code mapping.
- Add **manual nutrition intake** logging (kcal + protein/carb/fat, optional meal
  slot) with reusable quick-presets.
- Add a **deficit/surplus goal engine**: from start/target weight + date, derive a
  safe daily kcal delta (7700 kcal/kg fat; conservative caps with user override +
  warning), a **periodized daily target** that shifts kcal toward harder sport days,
  and full **macro targets** (protein/fat floors, carbs by load).
- Add **energy-balance roll-ups**: daily/weekly/monthly expenditure vs intake vs
  target, EMA-smoothed weight trend vs the goal line, steps/sleep/weekly-time-in-zone
  **trend overlays** (no statistical coefficients in v1), and a later-phase
  **adaptive TDEE** that back-calculates real maintenance from weight Δ vs net energy.
- Make all of it **chatbot-answerable** via a new `query-energy-balance` tool (plus an
  optional intake-logging action tool).
- Add a new top-level **"Nutrition" destination** (primary home), a compact
  energy-balance card on Today/Daily, and a net-balance badge on the Calendar
  WellnessBand.
- Persist new device-local data (`intakeEntries`, `intakePresets`, `energyTargets`)
  via a **Dexie v25** migration; this data is PII, excluded from the cloud snapshot.

No public API (`@kaiord/*` exports) breaking changes — all additive.

## Capabilities

### New Capabilities
- `energy-expenditure`: per-day basal + activity expenditure — BMR
  (Katch-McArdle/Mifflin-St Jeor), measured-vs-predicted resolution, and the tiered
  expected-workout-kcal estimator with the MET compendium + sport mapping. Requires
  the new anthropometric profile fields.
- `nutrition-intake`: manual intake entries (kcal + P/C/F, meal slot) and reusable
  presets, with their device-local persistence.
- `energy-goal`: deficit/surplus goal model, safe daily-delta derivation with caps +
  override, periodized daily kcal target, and macro-target derivation.
- `energy-balance`: daily/weekly/monthly net-balance roll-ups, EMA weight trend,
  steps/sleep/zone trend overlays, adaptive TDEE, the `query-energy-balance` chatbot
  tool, and the Today/Nutrition surfaces.

### Modified Capabilities
- `spa-ai-chat`: the assistant gains an energy-balance query tool (and optional
  intake-logging action tool) in the existing tool registry.
- `spa-routing`: a new top-level "Nutrition" destination is added to the SPA's
  navigation/route map.
- `spa-persistence-port`: new persisted stores (`intakeEntries`, `intakePresets`,
  `energyTargets`) and the Dexie v25 migration, all excluded from the snapshot.
- `spa-calendar`: the WellnessBand gains a per-day net-balance badge.

## Impact

- **Packages**: `@kaiord/core` (new `domain/schemas/health/**` energy/nutrition
  schemas, pure `application/` calculators for BMR/TDEE/goal/macros/expenditure, new
  `ports/` for intake + energy-target repositories) and
  `@kaiord/workout-spa-editor` (Dexie adapters + v25 migration, new Nutrition pages,
  Today/Calendar surfaces, chat tool, profile-field UI). Reuses existing
  `health-data` records and the `spa-ai-chat` tool pattern.
- **Hexagonal**: domain + pure use-cases land in core (`application` imports no
  adapters/external libs); Dexie + React stay in the SPA. New I/O ports are defined
  before their Dexie adapters. No format-adapter-to-format-adapter imports.
- **Data/PII**: intake, goal, weight, and body-composition data are device-local,
  excluded from the cloud snapshot, and must keep `check-no-pii-leakage.mjs` green.
- **Reference specs**: builds on `health-data`, `spa-ai-chat`, `spa-routing`,
  `spa-persistence-port`, `spa-calendar`; honors `hexagonal-arch`, `test-conventions`,
  `test-minimality`, `spa-quality-gates`.
- **Release**: version-worthy `feat` — needs a changeset. No new publishable package,
  so no CI/changeset-config additions.
- **Estimation accuracy**: values are estimates with conservative safety clamps; not
  medical-grade. Real Garmin Body Battery ingestion remains a separate deferred epic.
