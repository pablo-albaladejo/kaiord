I have enough evidence now. I've covered the highest-logic converters across all three packages, the magic-number sweeps, the auth/token/retry flows, and boundary exports. Let me compile findings.

---

# Semantic Quality Audit: packages/fit, packages/garmin, packages/garmin-connect

## Findings

### packages/fit

- **[INFO] [conversion] target/power-helpers.ts:1-43** — `interpretWorkoutPower` and `convertPowerValue` both carry the +1000 watts-offset rule as JSDoc and split the math out of the converter body. — EXEMPLARY: the FTP-vs-watts sentinel (1000) is named conceptually and documented in two co-located helpers. — keep as the pattern other target converters should follow.

- **[INFO] [loss] health/weight/health-weight.converter.ts:14-23**, **health/sleep/health-sleep.converter.ts:19-30**, **health/daily/health-daily.converter.ts:36-42**, **health/body-composition/health-body-composition.converter.ts:38-45**, **health/hrv/health-hrv.converter.ts:13-19** — every health converter has a doc-comment stating the scale factor (`/100` kg), the sentinel (`0xFFFE`/`0xFFFF` non-positive guard), and what is dropped (multi-user fan-out, per-sample HRV, `unmeasurable` sleep stages, intensity-minutes defaulting to 0). — EXEMPLARY: this is the gold standard for lossy-conversion honesty in the repo. — replicate this comment discipline in the workout target/duration converters.

- **[MEDIUM] [conversion] krd-to-fit/krd-to-fit-target-heart-rate.converter.ts:22-23** — the encode side adds `+100` with comment "Absolute bpm needs +100 offset", but the magic `100` is a bare literal and the decode side (`target/target-heart-rate.converter.ts:71-95`) re-implements the inverse (`value - 100`, `value > 100`) with its own comment and its own bare `100`. — The bpm-offset rule lives in two files as two unconnected literals; nothing names it or links encode↔decode, unlike power which has a shared `power-helpers.ts`. A future change to one side will silently break round-trips. — Extract `interpretWorkoutHeartRate`/`encodeWorkoutHeartRate` helpers (mirroring `power-helpers.ts`) with a single `BPM_OFFSET = 100` constant; have both converters import them.

- **[MEDIUM] [conversion] target/target-power.converter.ts:69 / target-heart-rate.converter.ts:56 / target-pace.converter.ts:55** — the zone-validity bounds (`>= 1 && <= 7` power, `1..5` HR, `1..5` pace) are inline magic numbers with only a line comment ("valid range 1-7"). The "if out of range, reinterpret as an absolute value" decision is a real domain rule (FIT overloads the zone field). — These breakpoints are domain constants (FIT defines 7 power zones, 5 HR zones) duplicated as literals; the fallback-to-absolute behaviour is a silent reinterpretation. — Name them (`POWER_ZONE_MAX = 7`, `HR_ZONE_MAX = 5`) and state the overload rule once in a shared comment/helper.

- **[LOW] [conversion] krd-to-fit/duration-converters/simple.ts:13** — `duration.seconds * 1000` carries a trailing comment "durationValue is in milliseconds". — Acceptable, but the `1000` s→ms factor is a bare literal in a file that already imports schemas; a `SECONDS_TO_MILLIS` constant would make it greppable. — minor: extract the factor or leave the comment (it is at least explained).

- **[LOW] [abstraction] event/event.mapper.ts:36** — `fit.timestamp * 1000` (FIT seconds → JS ms) appears here and the inverse `/ 1000` at line 44, also repeated in all five health `toIsoString` helpers (weight/sleep/hrv/daily/body-composition) as `value * 1000`. — The FIT-epoch-seconds↔JS-millis conversion is duplicated ~7 times with the bare `1000`; each is locally obvious but there is no shared `fitSecondsToIso` util. — Consider a single shared `fitTimestampToIso(value)` helper in `health/shared/` to centralize the factor and the `Date | number | string` branching that is copy-pasted verbatim across all five health converters.

- **[LOW] [loss] krd-to-fit/krd-to-fit-step.converter.ts:9-10,63-85** — notes truncation to 256 chars is exemplary: named constant `FIT_NOTES_MAX_LENGTH`, configurable `truncate|error` behaviour, and a `logger.warn` on truncation. — EXEMPLARY honesty for the workout path. — note that the Garmin side (below) does the same truncation silently; align them.

### packages/garmin

- **[MEDIUM] [loss] converters/executable-step.converter.ts:41** — `step.description.slice(0, 256)` silently truncates step notes with no warning, no named constant, and the bound is `256` here vs `255` for workout-name truncation (`garmin-to-krd.converter.ts:34`, `krd-to-garmin.converter.ts:44`). — Silent data loss; the off-by-one between 255/256 across sibling files reads as accidental rather than two distinct Garmin limits. — Extract `GARMIN_STEP_NOTES_MAX`/`GARMIN_NAME_MAX` constants and log a truncation warning, matching the FIT step converter's pattern.

- **[MEDIUM] [conversion] converters/target-to-garmin.converter.ts:75-91 + mappers/target-pace.mapper.ts:31-36** — the "faster-first" ordering rule (`fasterFirst && ... ? [max, min] : [min, max]`) is the single most domain-loaded line in the package and is conveyed only by a boolean parameter name. The pace mapper hard-codes the inverse (`targetValueOne: entry.maxMps, targetValueTwo: entry.minMps`) with no comment at all. — A reader cannot tell _why_ power/pace want the faster (higher) bound first while HR/cadence want ascending; this is a Garmin wire convention (a slower pace = larger m/s for some, smaller for others) that is invisible. The asymmetry between the two call sites (`true` for power/pace, `false` for HR/cadence at lines 27,31,39) encodes a rule with zero documentation. — Add a comment block on `mapRangeOrValue` stating the Garmin convention ("Garmin orders speed/power targets fastest-bound-first; HR/cadence ascending"), and a matching comment in `resolvePaceZone`.

- **[MEDIUM] [boundary] mappers/workout-summary.mapper.ts:12** — `sport: garminWorkout.sportType?.sportTypeKey ?? "unknown"` passes the raw Garmin sport key straight into the domain `WorkoutSummary.sport` field. The package already has `mapGarminSportToKrd` (sport.mapper.ts) that translates these keys to KRD vocabulary. — SDK vocabulary leaks past the adapter into a `@kaiord/core` DTO consumed as domain data; `WorkoutSummary.sport` is typed loosely as `string` so the leak is silent. The list view will show "cardio_training"/"lap_swimming" instead of KRD sport names. — Route through `mapGarminSportToKrd` (or document that summary.sport is intentionally the raw listing key).

- **[MEDIUM] [loss] mappers/condition.mapper.ts:30-35,88-90 + intensity.mapper.ts:30,33** — multiple converters silently collapse unknown inputs to a default with no log: unknown `conditionTypeKey` → `open` duration; unknown `durationType` → lap-button; unknown `stepTypeKey` → `active`; unknown intensity → `interval`. The schema defines a `REPS` condition (`condition-type.schema.ts:12`) that `mapConditionToDuration` does not handle — reps end-conditions become `open` silently. — Lossy fallbacks with no warning; the reps gap is a concrete silent drop. — At minimum `logger.warn` on the default branch in `mapConditionToDuration` (it has no logger today); decide whether reps should be modelled or explicitly rejected.

- **[LOW] [loss] converters/flatten-segments.converter.ts:49-57** — nested repeat groups are flattened with a `logger.warn("Nested repeat groups are flattened")`. — GOOD: this loss is explicit and logged. — keep; this is the model the condition/intensity defaults should follow.

- **[LOW] [conversion] converters/garmin-pool-info.mapper.ts:11-15** — `poolLengthUnit: { unitId: 1, unitKey: "meter", factor: 100 }` — `unitId: 1` and `factor: 100` are unexplained Garmin wire constants. — The `factor: 100` (cm-per-meter scaling Garmin uses) and `unitId: 1` are opaque; a reader cannot tell what `factor` scales. — Add a one-line comment ("Garmin pool unit descriptor: meters, cm scaling factor") or named constants.

- **[LOW] [abstraction] mappers/stroke.mapper.ts:57-80** — three separate stroke tables (`STROKE_TO_FIT`, `FIT_TO_STROKE`, plus the Garmin tables above) with bare integer ids; `im: 5` collides with `mixed: 5` in `STROKE_TO_FIT` so a round-trip of `im` decodes to `mixed`. — Silent lossy collision (im↔mixed share FIT value 5) with no comment acknowledging it. — Comment the deliberate `im→5` collapse (or flag it as a known loss).

### packages/garmin-connect

- **[INFO] [flow] token/token-manager.ts + token-manager.helpers.ts:34-57** — single-flight refresh (`if (state.refreshPromise) return state.refreshPromise`), generation counter, and the stale-refresh guard (`if (state.generation !== generationAtStart) return`) read as clear business invariants. `garmin-auth-fetch.ts:38-47` re-checks the generation before a second refresh to avoid double-refresh on concurrent 401s. — EXEMPLARY: the auth/refresh concurrency story is legible and the invariants are enforced in code. — no action.

- **[INFO] [flow] http/sso-login.ts + sso-oauth.ts** — the SSO flow reads as a business process: embed bootstrap → CSRF token → submit login → extract ticket → OAuth1 preauthorized → OAuth2 exchange, each step a named function with its own error. — EXEMPLARY for boundary clarity. — no action.

- **[MEDIUM] [conversion] http/retry.ts:21-22,86-87** — `isRetryable` uses bare `429`, `500`, `599`; defaults are bare `3`/`1000`/`10000`. The retryable-status policy (Too Many Requests + 5xx) is a domain decision encoded as anonymous numbers. — The "retry on rate-limit and server errors, give up on client errors" rule is invisible without decoding the literals. — Name them: `HTTP_TOO_MANY_REQUESTS = 429`, `SERVER_ERROR_RANGE`, `DEFAULT_MAX_RETRIES`, `DEFAULT_BASE_DELAY_MS`. (The AGENTS.md already documents the policy in prose — mirror it in code constants.)

- **[LOW] [boundary] http/sso-oauth.ts:77 + token-manager.helpers.ts:31-32** — `Date.now() / 1000` (ms→epoch-seconds) appears in token expiry math in two files as a bare `/ 1000`, and `expires_at = floor(now/1000) + expires_in` encodes the OAuth2-token expiry convention inline. — The epoch-seconds convention is a quiet invariant duplicated across the expiry computation and the `isExpired` check. — minor: a shared `nowEpochSeconds()` helper would make the unit explicit and keep the two sites in sync.

- **[LOW] [abstraction] client/garmin-workout-service.ts:46** — the Garmin Connect web URL `https://connect.garmin.com/modern/workout/${id}` is hard-coded in the push result builder while every other URL lives in `http/urls.ts`. — Boundary inconsistency; a wire/UI URL leaks into the service layer instead of the URL module. — Move to `urls.ts`.

---

## Per-Package Grades

| Package                     | Grade  |
| --------------------------- | ------ |
| **packages/fit**            | **A−** |
| **packages/garmin**         | **B**  |
| **packages/garmin-connect** | **A−** |

---

## Top 3 Improvements (cross-package)

1. **Mirror the `power-helpers.ts` pattern for the heart-rate (+100) offset** (fit): extract a shared encode/decode helper with a named `BPM_OFFSET` so the offset rule lives once and encode↔decode cannot drift. Same treatment for the zone-bound magic numbers (7/5/5).
2. **Make Garmin's silent losses honest** (garmin): add `logger.warn` to the step-notes truncation, the condition/intensity/stroke default branches, and either handle or explicitly reject the `REPS` end-condition. Adopt the FIT step converter's named-constant-plus-warning model.
3. **Document the "faster-first" target ordering and stop leaking the raw Garmin sport key** (garmin): comment the wire convention on `mapRangeOrValue`/`resolvePaceZone`, and route `mapToWorkoutSummary.sport` through `mapGarminSportToKrd` so the domain DTO speaks KRD vocabulary.

---

## Verdicts

**packages/fit** — The strongest of the three on semantic quality. The health converters are a model of lossy-conversion honesty: every scale factor (`/100`), every sentinel (`0xFFFE`/`0xFFFF`), and every dropped field is stated in a co-located doc-comment, and `power-helpers.ts` shows exactly how a wire-offset (the +1000 watts FTP sentinel) should be named and shared. The workout target converters read as domain mappings (zone → range → absolute, each a named builder). The one real weakness is asymmetry: the power offset is centralized but the identical bpm-offset and the zone-validity breakpoints are inlined as bare literals duplicated across encode/decode files, inviting round-trip drift. Fixing that asymmetry would make it a clean A.

**packages/garmin** — Functionally correct and well-decomposed (small converters, lookup-table mappers), but it is the weakest on the two dimensions that matter most here: lossy honesty and conversion legibility. Several genuine data losses are silent — step-notes truncation, unknown-condition/intensity/stroke defaults, the unhandled `REPS` condition, and the `im↔mixed` FIT-value collision — and the single most domain-loaded rule in the package, the "faster-first" target ordering, is conveyed only by a boolean parameter with no comment explaining the Garmin wire convention. The raw `sportTypeKey` leaking into the domain `WorkoutSummary` is a boundary miss the package already has the mapper to fix. None are bugs, but a reader cannot reconstruct the domain rules from the code alone. Comments and a few `logger.warn` calls would lift this to A−.

**packages/garmin-connect** — The auth and token machinery is the highlight of the entire audit: the SSO flow reads as a step-by-step business process, and the token manager's single-flight refresh, generation counter, and stale-generation guards are textbook-clear with invariants enforced in code. The boundary is well kept — SDK/OAuth vocabulary stays inside `http/`. The only soft spots are cosmetic: the retry policy's HTTP-status and backoff numbers are anonymous literals (the policy is documented in AGENTS.md but not named in code), the ms→epoch-seconds convention is duplicated as bare `/1000`, and one Garmin web URL escaped the `urls.ts` module. Naming the retry constants is the only change with real legibility payoff.
