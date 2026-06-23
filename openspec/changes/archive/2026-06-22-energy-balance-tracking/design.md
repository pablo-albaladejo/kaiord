## Context

The SPA already ingests and surfaces health records (`SleepRecord`,
`WeightMeasurement`, `HrvSummary`, `DailyWellness`, `BodyComposition`,
`StressEpisode`) keyed by `[profileId+date]`, and `DailyWellness` already carries
`steps`, `activeCalories`, and `restingCalories`. The chatbot already exposes a
tool registry (`query-health-tool`, `query-workouts-tool`, `query-coaching-tool`).
What is missing is intake, a goal engine, net-balance roll-ups, and chatbot
answerability. This design adds the new domain in `@kaiord/core` (pure types +
calculators + ports) and its Dexie/React adapters in `@kaiord/workout-spa-editor`,
reusing the existing health-data and chat-tool infrastructure. The work is an epic
delivered in six independently-shippable phases.

## Goals / Non-Goals

**Goals:**
- Pure, fully-tested energy math in core (BMR/TDEE, goal delta, macros, expenditure).
- Day energy balance computable from already-ingested data with a BMR fallback for
  uncovered/future days, distinguishing measured vs predicted.
- A safe, sport-aware goal engine and manual intake logging that close the
  deficit/surplus loop.
- Chatbot can answer "am I in deficit today / kcal left / macro target".

**Non-Goals:**
- Food database, barcode scanning, recipe search, third-party intake import.
- Any server-side component (PWA stays client-only; no OAuth nutrition sources).
- Statistical correlation coefficients in v1 (trend overlays only).
- Medical-grade accuracy; Garmin Body Battery ingestion (separate deferred epic).

## Decisions

- **Domain lives in `@kaiord/core` (domain + application + ports).** Energy/nutrition
  schemas join `domain/schemas/health/**`; BMR/TDEE/goal/macro/expenditure
  calculators are pure functions in `application/`. *Why over SPA-local:* matches
  where `DailyWellness`/`BodyComposition` already live, keeps math reusable + unit
  tested at 80%, and `application` imports no adapters/external libs. Layer: domain +
  application.
- **New ports before adapters.** `IntakeRepository`, `IntakePresetRepository`, and
  `EnergyTargetRepository` (or a cohesive extension of the existing persistence port)
  are declared in `core/ports`; Dexie implementations live in the SPA. *Why:*
  hexagonal rule — I/O contract precedes the adapter. Layer: ports → adapters.
- **BMR = Katch-McArdle when body-fat % is known, else Mifflin-St Jeor.** *Why over
  always-Mifflin:* the SPA already ingests `BodyComposition`; lean-mass-based BMR is
  more accurate when present. The chosen formula is recorded on the result so the UI
  and chatbot can explain the number. Alternative (user-selectable formula) rejected
  as needless UI surface for v1.
- **Expenditure resolution: measured wins.** A day with connection coverage uses
  `restingCalories + activeCalories`; uncovered/future days use
  `BMR + expectedActivityKcal` and are labelled `predicted`. *Why:* ingested device
  data beats a modeled estimate; the label keeps the distinction honest.
- **Expected workout kcal is tiered** (power→kJ, then running distance ≈1 kcal/kg/km,
  then duration×MET×kg). MET values come from a vendored **Compendium of Physical
  Activities** data table plus a kaiord `sport`/`subSport`→activity-code mapping.
  *Why over TSS:* power/MET are sport-agnostic and need no FTP per sport. The
  compendium is static vendored data (no runtime npm dependency).
- **Goal math with conservative caps + override.** Fat loss uses 7700 kcal/kg; daily
  delta is clamped (deficit ≤~0.75%/week bodyweight, never below BMR/floor; muscle
  gain ≤0.5 kg/month) but the user MAY override with an on-screen warning. *Why:*
  safety by default without paternalistically blocking informed users.
- **Periodized daily target** holds the weekly net constant while shifting kcal toward
  higher-expenditure (sport) days: `target(day) = BMR + expectedActivityKcal(day) +
  dailyDelta`. *Why:* directly answers "kcal per day given the sport."
- **New top-level "Nutrition" destination.** *Why over sub-view:* it is the primary
  home for goals/logging/trends and warrants first-class navigation; Today/Calendar
  carry compact secondary surfaces. Layer: SPA routing/UI.
- **Persistence: Dexie v25, device-local, snapshot-excluded.** New stores
  `intakeEntries`/`intakePresets`/`energyTargets` follow the `SCHEMAS.vN` +
  `applyVNUpgrade` pattern with a co-located `*-migration.test.ts`. *Why:* intake,
  goal, and weight data are PII; they must stay local and pass
  `check-no-pii-leakage.mjs`.
- **Weight trend uses EMA; adaptive TDEE deferred to the last phase.** *Why:* daily
  weigh-ins are noisy; the EMA trend is the progress source-of-truth. Adaptive TDEE
  needs accumulated paired intake+weight history, so it ships only after intake
  (Phase 3) and tracking (Phase 5).

## Risks / Trade-offs

- [Estimates read as facts] → Always label `measured` vs `predicted`; show the active
  BMR formula; present goal outputs as estimates with clamps.
- [Sparse/incomplete connection data] → Net balance shown only when expenditure is
  resolvable; predicted fallback fills future days; missing intake yields "untracked",
  never a silent zero.
- [PII leakage] → Device-local stores, snapshot exclusion, static toast/console
  args; covered by `check-no-pii-leakage.mjs` and a migration test.
- [Unsafe user goals] → Default caps + explicit warning on override; never below a
  kcal floor.
- [MET compendium → kaiord sport mapping gaps] → Mapping table with a documented
  default MET for unmapped sports, logged (non-PII) so gaps surface.
- [Adaptive TDEE misleads on thin data] → Activates only past a minimum paired-history
  threshold and is labelled an estimate.
- [Scope creep across 6 phases] → Phases are independently shippable; each is its own
  spec slice and PR with its own quality gates.

## Migration Plan

No public-API breaking change (additive). Internal data migration only: Dexie **v25**
adds `intakeEntries`, `intakePresets`, `energyTargets`; Profile gains optional
`height`/`birthDate`/`sex`/`restingHeartRate`/`activityLevel` (optional ⇒ no
backfill; BMR-dependent UI is gated until the fields are filled). Rollback: the new
stores are additive and ignored by prior versions; a forward-only Dexie upgrade with
a co-located migration test guards it.

## Open Questions

- EMA smoothing window length (e.g. 7 vs 10 days) — pick a default, expose later.
- Minimum paired-history threshold before adaptive TDEE activates.
- Exact vendored MET compendium source file + license attribution.
- Whether the intake-logging chatbot action tool ships in Phase 3 or later.
