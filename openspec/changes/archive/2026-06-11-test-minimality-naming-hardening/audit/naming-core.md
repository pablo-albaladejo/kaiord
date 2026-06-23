One important note: `garmin/src/adapters/mappers/target.converter.ts` is named `.converter.ts` but lives in a `mappers/` folder, and `mapGarminTargetToKrd` (a `map*` function with branching) is imported from it — that's a naming/location inconsistency. I have comprehensive coverage now. Let me compile the findings.

---

# Identifier & Artifact Naming Audit — Kaiord (7 packages, src non-test)

## Executive Summary

The codebase speaks **strong business language**. Domain vocabulary (workout, step, target, duration, lap, interval, cadence, FTP, sport, intensity) is used pervasively and correctly; the public `@kaiord/core` API is exemplary. The defects are localized and low-to-medium severity: a cluster of cryptic single/two-letter names in `garmin-connect` token management, a generic `data` parameter pattern in adapter converters, a few `*.mapper.ts` files that carry branching logic (violating the repo's mapper-vs-converter convention), and one `do`-prefixed function.

---

## packages/garmin-connect

- [SEVERITY med] [CATEGORY cryptic] `adapters/token/token-manager.ts:20` — `const s: TokenState` — single-letter name for the central mutable auth-state object, referenced ~15 times across two files (`s.oauth1`, `s.generation`, `s.refreshPromise`) — rename to `state` or `tokenState`
- [SEVERITY med] [CATEGORY cryptic] `adapters/token/token-manager.helpers.ts:34,59` — `s: TokenState` (param) — same cryptic param threaded through `doRefresh` / `restoreFromStore` — rename to `state`
- [SEVERITY med] [CATEGORY misleading] `adapters/token/token-manager.helpers.ts:34` — `doRefresh` — `do`-prefix anti-pattern; says nothing beyond the verb it wraps and reads as filler — rename to `performTokenRefresh` or `refreshTokens`
- [SEVERITY low] [CATEGORY cryptic] `adapters/token/token-manager.ts:33` — `setTokens: async (o1, o2) =>` — `o1`/`o2` for OAuth1/OAuth2 tokens — rename to `oauth1Token` / `oauth2Token` (the helper file already uses `oauth1`/`oauth2` correctly — inconsistent)
- [SEVERITY low] [CATEGORY cryptic] `adapters/http/oauth-consumer.ts:12,13,14,19` — `res` — abbreviation for the fetch `Response`; repeated 4x — rename to `response`
- [SEVERITY low] [CATEGORY cryptic] `adapters/http/retry.ts:84,46,53,...` — `opts: ResolvedOptions` — `opts` abbreviation used throughout the retry module — rename to `options` (note `withRetry` already names its public param `options`, then aliases to `opts` — inconsistent within one function)
- [SEVERITY low] [CATEGORY generic] `adapters/http/garmin-auth-fetch.ts:23` — `handleNonOk(res, prefix)` — `handle*` catch-all + `res` abbrev — rename to `throwHttpError(response, messagePrefix)`
- [SEVERITY low] [CATEGORY cryptic] `adapters/http/types.ts:1` — `FetchFn`, and `RefreshFn` (token-manager.types) — `Fn` abbreviation in exported type names — acceptable as idiomatic but `FetchClient` / `TokenRefresher` would be more pronounceable
- [SEVERITY low] [CATEGORY generic] `adapters/http/oauth-consumer.ts:20`, `restoreFromStore` helper `:64` — `const data = await ...` — generic name for parsed token JSON — rename to `tokenJson` / `storedTokens`

## packages/zwo

- [SEVERITY med] [CATEGORY misleading/convention] `adapters/duration/duration.mapper.ts:13-57` — `mapOriginalDurationType` / `mapZwiftDuration` — file is `*.mapper.ts` but contains multi-branch conditional logic (`if orig === "distance" / "heart_rate_less_than" / "power_less_than"`, fallback decisions). Repo convention: mappers have no logic, converters carry logic — rename file to `duration.converter.ts` (and add the test the converter convention requires)
- [SEVERITY med] [CATEGORY misleading/convention] `adapters/interval/steady-state.mapper.ts:36` — `mapSteadyStateToKrd` — `*.mapper.ts` with branching (intensity fallback, conditional `name`/`equipment` assignment, delegates to `restoreSteadyStateTarget`) — should be `steady-state.converter.ts`
- [SEVERITY low] [CATEGORY convention] `adapters/interval/intervals-t.mapper.ts:12` — `mapIntervalsTToKrd` — thin wrapper, but its logic lives in `intervals-t-helpers.ts` (`createOnStep`/`createOffStep` with real branching). The `*-helpers.ts` suffix is a generic catch-all hiding converter logic — fold into `intervals-t.converter.ts` or rename helpers to `intervals-t-step-builders.ts`
- [SEVERITY low] [CATEGORY generic] `adapters/zwift-to-krd/intervals-extractor.ts:26-33`, `intervals-processor.ts:19,36,59` — `data: Record<string, unknown>` and local `const data` — generic name for a Zwift interval payload; in `intervals-processor.ts:35-36` both `normalizedData` and `data` coexist confusingly — rename to `intervalAttributes` / `rawInterval`
- [SEVERITY low] [CATEGORY cryptic] `adapters/duration/duration.mapper.ts:16` — `const orig` — abbreviation — rename to `originalDurationType`
- [SEVERITY low] [CATEGORY cryptic] `adapters/krd-to-zwift/intervals-t-encoder.ts:46,56-57` — `val` (cadence value), `ext` (extensions) — abbreviations — rename to `cadenceValue`, `extensions`
- [SEVERITY low] [CATEGORY generic] `adapters/zwift-to-krd/intervals-extractor.ts:29` — `for (const item of data)` — `item` catch-all for an interval element — rename to `interval`

## packages/fit

- [SEVERITY low] [CATEGORY generic] widespread — `data: Record<string, unknown>` as the converter entry param (`fit-to-krd-session.converter.ts:14`, `fit-to-krd-lap.converter.ts:14`, `fit-to-krd-record.converter.ts`, etc.) — honest enough (it's raw FIT message data) but `fitMessage` / `rawSession` would be more semantic. ~8 converter entry points. Low priority, consistent pattern
- [SEVERITY low] [CATEGORY generic] `adapters/duration/duration-converters.ts:5-86` — `data: FitDurationData` (param in 7 functions) — typed, so acceptable, but `fitDuration` reads better — optional
- No misleading `*.mapper.ts` found: FIT mappers (`duration.mapper.ts`, `target.mapper.ts`) correctly delegate to converters and only hold lookup tables. Convention respected here.

## packages/garmin

- [SEVERITY med] [CATEGORY convention] `adapters/mappers/target.converter.ts` (imported in `executable-step.converter.ts:10`) — file is named `*.converter.ts` but sits in the `mappers/` directory, and exports `mapGarminTargetToKrd` (a `map*` name with real branching). The folder/suffix/function-prefix disagree three ways — pick one: if it has logic, move to `converters/` and keep `.converter.ts`; the `map*` prefix should then become `convert*`
- [SEVERITY low] [CATEGORY cryptic] `adapters/converters/flatten-segments.converter.ts:42-56` — `let idx = startIndex`, `for (const s of nested.steps)` — `idx` and `s` (a `WorkoutStep`) abbreviations in a non-trivial recursive function — rename to `currentIndex` and `nestedStep`
- [SEVERITY low] [CATEGORY cryptic] `adapters/utils/is-logger.ts:3` — `(v: unknown)` — single-letter param in a type guard — rename to `value`. Also `utils/` is a generic catch-all directory name

## packages/tcx

- [SEVERITY low] [CATEGORY generic] `adapters/duration/duration-walker.converter.ts` — `mapTcxDuration(data: TcxDurationData)` — `data` is typed so acceptable; `tcxDuration` would be clearer. The `*-walker` filename is slightly mechanical but defensible (it walks the duration variants)
- Clean otherwise. `mapTcxDuration` carries branching but lives in a `.converter.ts` file — convention respected.

## packages/ai

- [SEVERITY low] [CATEGORY generic] `adapters/text-to-workout.ts:41` — `const system = buildSystemPrompt(...)` then `system` passed positionally — slightly terse; `systemPrompt` is clearer and matches the builder name
- Otherwise strong: `createTextToWorkout`, `executeWithRetry`, `validateInput`, `loadPrompt`, `temperature`, `maxOutputTokens` all clear domain/SDK language.

## packages/core

- [SEVERITY low] [CATEGORY cryptic] `domain/hash/canonical-hash.ts:26-28` — `.reduce((acc, k) => { acc[k] = ... })` — `acc` and `k` in a non-trivial recursive normalizer — acceptable in a tiny reducer lambda but `sorted`/`key` would read better given the recursion
- [SEVERITY low] [CATEGORY cryptic] `test-utils/profile-snapshot-fixtures.ts:64-74` — `const obj = JSON.parse(...)` — generic `obj` (test-util, low impact) — rename to `pollutedPayload`
- Schema fields are exemplary: snake_case enum values (`heart_rate_less_than`, `repeat_until_power_greater_than`), camelCase object fields (`heartRate`, `verticalOscillation`, `stanceTime`). `position.lat`/`lon` are conventional GPS terms — fine. Public API export list (`index.ts`) is pure domain vocabulary.

---

## Per-Package Verdict

| Package            | Grade  | Notes                                                                                                  |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| **core**           | **A**  | Exemplary domain naming, snake/camel conventions correct, public API speaks pure business language     |
| **fit**            | **A−** | Mapper/converter convention respected; only the generic `data` converter-param pattern dings it        |
| **ai**             | **A−** | Clear SDK + domain language; trivial `system` terseness                                                |
| **tcx**            | **B+** | Clean; minor `data` and `*-walker` mechanical naming                                                   |
| **zwo**            | **B−** | Two `*.mapper.ts` files carry real logic (convention break); `orig`/`val`/`ext`/`item`/`data` cryptics |
| **garmin**         | **B−** | `mappers/target.converter.ts` triple-disagreement; `idx`/`s`/`v` cryptics                              |
| **garmin-connect** | **C+** | Worst cluster: `s`/`o1`/`o2`/`res`/`opts` cryptics + `doRefresh` + `handleNonOk`                       |

## Top 5 Renames (highest readability payoff)

1. **`token-manager.ts` / `token-manager.helpers.ts`: `s` → `state`** — the single most-referenced cryptic name in the audit (~15 uses across the auth core, the security-critical path)
2. **`token-manager.helpers.ts:34`: `doRefresh` → `performTokenRefresh`** — removes the `do`-prefix anti-pattern from a public helper
3. **`zwo/duration.mapper.ts` → `duration.converter.ts`** (and `steady-state.mapper.ts` → `steady-state.converter.ts`) — restores the repo's mapper-has-no-logic invariant and signals these need tests
4. **`garmin/mappers/target.converter.ts`: resolve the folder/suffix/`map*`-prefix three-way conflict** — pick `converters/target.converter.ts` + `convertGarminTargetToKrd`
5. **`oauth-consumer.ts` / `retry.ts`: `res` → `response`, `opts` → `options`** — eliminates the two most repeated abbreviations in the HTTP layer (and fixes the within-function alias inconsistency in `withRetry`)

## Overall Assessment

**Yes — the public API speaks business language.** `@kaiord/core/index.ts` exports read as a fitness-domain glossary (`Workout`, `WorkoutStep`, `RepetitionBlock`, `Target`, `Duration`, `Sport`, `SubSport`, `fromBinary`/`toText`, `validateRoundTrip`, `fingerprintSnapshot`). Adapter public functions follow honest `convert*`/`map*`/`encode*`/`extract*` verbs. The naming debt is **internal and concentrated**: cryptic locals in the `garmin-connect` auth/HTTP plumbing and a handful of `*.mapper.ts` files in `zwo`/`garmin` that quietly accumulated branching logic, breaking the repo's own mapper-vs-converter contract. None of it leaks into consumer-facing surface; all of it is mechanically fixable. No misleading `validate*`/`get*` honesty violations were found (the `validate*` and `get*` functions across all packages do what they claim).

Relevant files:

- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/token/token-manager.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/token/token-manager.helpers.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/oauth-consumer.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/retry.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/duration/duration.mapper.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/interval/steady-state.mapper.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/interval/intervals-t-helpers.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/zwift-to-krd/intervals-processor.ts
- /Users/pablo/development/kaiord/packages/garmin/src/adapters/mappers/target.converter.ts
- /Users/pablo/development/kaiord/packages/garmin/src/adapters/converters/flatten-segments.converter.ts
- /Users/pablo/development/kaiord/packages/core/src/index.ts

===NEXT-BLOCK===

Identifier and artifact naming audit complete across all 7 packages. Summary of what I found:

**Overall**: The codebase speaks strong business language. The public `@kaiord/core` API reads as a clean fitness-domain glossary, and adapter functions use honest `convert*`/`map*`/`encode*`/`extract*` verbs. Naming debt is internal and concentrated, not consumer-facing.

**Highest-impact issues:**

1. `garmin-connect` token management has the worst cryptic cluster — `s` (the central auth-state object, ~15 references), `o1`/`o2`, `doRefresh` (do-prefix anti-pattern), `res`, `opts`.
2. Two `zwo` `*.mapper.ts` files (`duration.mapper.ts`, `steady-state.mapper.ts`) carry real branching logic, violating the repo's mapper-has-no-logic convention — they should be `.converter.ts`.
3. `garmin/mappers/target.converter.ts` has a three-way folder/suffix/function-prefix disagreement.
4. A consistent (low-severity) generic `data` parameter pattern across FIT/zwo converter entry points.

**No honesty violations** were found among `validate*`/`get*` functions — they do what they claim.

**Grades**: core A, fit/ai A−, tcx B+, zwo/garmin B−, garmin-connect C+.

Full per-finding breakdown with file:line, severity, category, and suggested renames is in my detailed report above, ending with the top 5 renames by readability payoff and per-package verdicts.

===NEXT-BLOCK===

# Identifier & Artifact Naming Audit — Kaiord

Scope: `packages/core`, `packages/fit`, `packages/tcx`, `packages/zwo`, `packages/garmin`, `packages/garmin-connect`, `packages/ai` — src files, excluding `*.test.*`.

## Executive Summary

The codebase speaks **strong business language**. Domain vocabulary (workout, step, target, duration, lap, interval, cadence, FTP, sport, intensity) is used pervasively and correctly; the public `@kaiord/core` API is exemplary. The defects are localized and low-to-medium severity: a cluster of cryptic single/two-letter names in `garmin-connect` token management, a generic `data` parameter pattern in adapter converters, a few `*.mapper.ts` files that carry branching logic (violating the repo's mapper-vs-converter convention), and one `do`-prefixed function. No misleading `validate*`/`get*` honesty violations were found.

Format: `- [SEVERITY] [CATEGORY] file:line — identifier — why — suggested name`

---

## packages/garmin-connect

- [SEVERITY med] [CATEGORY cryptic] `adapters/token/token-manager.ts:20` — `const s: TokenState` — single-letter name for the central mutable auth-state object, referenced ~15 times across two files (`s.oauth1`, `s.generation`, `s.refreshPromise`) — rename to `state` or `tokenState`
- [SEVERITY med] [CATEGORY cryptic] `adapters/token/token-manager.helpers.ts:34,59` — `s: TokenState` (param) — same cryptic param threaded through `doRefresh` / `restoreFromStore` — rename to `state`
- [SEVERITY med] [CATEGORY misleading] `adapters/token/token-manager.helpers.ts:34` — `doRefresh` — `do`-prefix anti-pattern; says nothing beyond the verb it wraps and reads as filler — rename to `performTokenRefresh` or `refreshTokens`
- [SEVERITY low] [CATEGORY cryptic] `adapters/token/token-manager.ts:33` — `setTokens: async (o1, o2) =>` — `o1`/`o2` for OAuth1/OAuth2 tokens — rename to `oauth1Token` / `oauth2Token` (the helper file already uses `oauth1`/`oauth2` correctly — inconsistent)
- [SEVERITY low] [CATEGORY cryptic] `adapters/http/oauth-consumer.ts:12,13,14,19` — `res` — abbreviation for the fetch `Response`; repeated 4x — rename to `response`
- [SEVERITY low] [CATEGORY cryptic] `adapters/http/retry.ts:84,46,53,...` — `opts: ResolvedOptions` — `opts` abbreviation used throughout the retry module — rename to `options` (note `withRetry` already names its public param `options`, then aliases to `opts` — inconsistent within one function)
- [SEVERITY low] [CATEGORY generic] `adapters/http/garmin-auth-fetch.ts:23` — `handleNonOk(res, prefix)` — `handle*` catch-all + `res` abbrev — rename to `throwHttpError(response, messagePrefix)`
- [SEVERITY low] [CATEGORY cryptic] `adapters/http/types.ts:1` — `FetchFn`, and `RefreshFn` (token-manager.types) — `Fn` abbreviation in exported type names — acceptable as idiomatic but `FetchClient` / `TokenRefresher` would be more pronounceable
- [SEVERITY low] [CATEGORY generic] `adapters/http/oauth-consumer.ts:20`, `token-manager.helpers.ts:64` — `const data = await ...` — generic name for parsed token JSON — rename to `tokenJson` / `storedTokens`

## packages/zwo

- [SEVERITY med] [CATEGORY misleading/convention] `adapters/duration/duration.mapper.ts:13-57` — `mapOriginalDurationType` / `mapZwiftDuration` — file is `*.mapper.ts` but contains multi-branch conditional logic (`if orig === "distance" / "heart_rate_less_than" / "power_less_than"`, fallback decisions). Repo convention: mappers have no logic, converters carry logic — rename file to `duration.converter.ts` (and add the test the converter convention requires)
- [SEVERITY med] [CATEGORY misleading/convention] `adapters/interval/steady-state.mapper.ts:36` — `mapSteadyStateToKrd` — `*.mapper.ts` with branching (intensity fallback, conditional `name`/`equipment` assignment, delegates to `restoreSteadyStateTarget`) — should be `steady-state.converter.ts`
- [SEVERITY low] [CATEGORY convention] `adapters/interval/intervals-t.mapper.ts:12` — `mapIntervalsTToKrd` — thin wrapper, but its logic lives in `intervals-t-helpers.ts` (`createOnStep`/`createOffStep` with real branching). The `*-helpers.ts` suffix is a generic catch-all hiding converter logic — fold into `intervals-t.converter.ts` or rename helpers to `intervals-t-step-builders.ts`
- [SEVERITY low] [CATEGORY generic] `adapters/zwift-to-krd/intervals-extractor.ts:26-33`, `intervals-processor.ts:19,36,59` — `data: Record<string, unknown>` and local `const data` — generic name for a Zwift interval payload; in `intervals-processor.ts:35-36` both `normalizedData` and `data` coexist confusingly — rename to `intervalAttributes` / `rawInterval`
- [SEVERITY low] [CATEGORY cryptic] `adapters/duration/duration.mapper.ts:16` — `const orig` — abbreviation — rename to `originalDurationType`
- [SEVERITY low] [CATEGORY cryptic] `adapters/krd-to-zwift/intervals-t-encoder.ts:46,56-57` — `val` (cadence value), `ext` (extensions) — abbreviations — rename to `cadenceValue`, `extensions`
- [SEVERITY low] [CATEGORY generic] `adapters/zwift-to-krd/intervals-extractor.ts:29` — `for (const item of data)` — `item` catch-all for an interval element — rename to `interval`

## packages/fit

- [SEVERITY low] [CATEGORY generic] widespread — `data: Record<string, unknown>` as the converter entry param (`fit-to-krd-session.converter.ts:14`, `fit-to-krd-lap.converter.ts:14`, `fit-to-krd-record.converter.ts`, etc.) — honest enough (it's raw FIT message data) but `fitMessage` / `rawSession` would be more semantic. ~8 converter entry points. Low priority, consistent pattern
- [SEVERITY low] [CATEGORY generic] `adapters/duration/duration-converters.ts:5-86` — `data: FitDurationData` (param in 7 functions) — typed, so acceptable, but `fitDuration` reads better — optional
- No misleading `*.mapper.ts` found: FIT mappers (`duration.mapper.ts`, `target.mapper.ts`) correctly delegate to converters and only hold lookup tables. Convention respected here.

## packages/garmin

- [SEVERITY med] [CATEGORY convention] `adapters/mappers/target.converter.ts` (imported in `executable-step.converter.ts:10`) — file is named `*.converter.ts` but sits in the `mappers/` directory, and exports `mapGarminTargetToKrd` (a `map*` name with real branching). The folder/suffix/function-prefix disagree three ways — pick one: if it has logic, move to `converters/` and keep `.converter.ts`; the `map*` prefix should then become `convert*`
- [SEVERITY low] [CATEGORY cryptic] `adapters/converters/flatten-segments.converter.ts:42-56` — `let idx = startIndex`, `for (const s of nested.steps)` — `idx` and `s` (a `WorkoutStep`) abbreviations in a non-trivial recursive function — rename to `currentIndex` and `nestedStep`
- [SEVERITY low] [CATEGORY cryptic] `adapters/utils/is-logger.ts:3` — `(v: unknown)` — single-letter param in a type guard — rename to `value`. Also `utils/` is a generic catch-all directory name

## packages/tcx

- [SEVERITY low] [CATEGORY generic] `adapters/duration/duration-walker.converter.ts:14` — `mapTcxDuration(data: TcxDurationData)` — `data` is typed so acceptable; `tcxDuration` would be clearer. The `*-walker` filename is slightly mechanical but defensible (it walks the duration variants)
- Clean otherwise. `mapTcxDuration` carries branching but lives in a `.converter.ts` file — convention respected.

## packages/ai

- [SEVERITY low] [CATEGORY generic] `adapters/text-to-workout.ts:41` — `const system = buildSystemPrompt(...)` then `system` passed positionally — slightly terse; `systemPrompt` is clearer and matches the builder name
- Otherwise strong: `createTextToWorkout`, `executeWithRetry`, `validateInput`, `loadPrompt`, `temperature`, `maxOutputTokens` all clear domain/SDK language.

## packages/core

- [SEVERITY low] [CATEGORY cryptic] `domain/hash/canonical-hash.ts:26-28` — `.reduce((acc, k) => { acc[k] = ... })` — `acc` and `k` in a non-trivial recursive normalizer — acceptable in a tiny reducer lambda but `sorted`/`key` would read better given the recursion
- [SEVERITY low] [CATEGORY generic] `test-utils/profile-snapshot-fixtures.ts:64-74` — `const obj = JSON.parse(...)` — generic `obj` (test-util, low impact) — rename to `pollutedPayload`
- Schema fields are exemplary: snake_case enum values (`heart_rate_less_than`, `repeat_until_power_greater_than`), camelCase object fields (`heartRate`, `verticalOscillation`, `stanceTime`). `position.lat`/`lon` are conventional GPS terms — fine. Public API export list (`index.ts`) is pure domain vocabulary.

---

## Per-Package Verdict

| Package            | Grade  | Notes                                                                                                  |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| **core**           | **A**  | Exemplary domain naming, snake/camel conventions correct, public API speaks pure business language     |
| **fit**            | **A−** | Mapper/converter convention respected; only the generic `data` converter-param pattern dings it        |
| **ai**             | **A−** | Clear SDK + domain language; trivial `system` terseness                                                |
| **tcx**            | **B+** | Clean; minor `data` and `*-walker` mechanical naming                                                   |
| **zwo**            | **B−** | Two `*.mapper.ts` files carry real logic (convention break); `orig`/`val`/`ext`/`item`/`data` cryptics |
| **garmin**         | **B−** | `mappers/target.converter.ts` triple-disagreement; `idx`/`s`/`v` cryptics                              |
| **garmin-connect** | **C+** | Worst cluster: `s`/`o1`/`o2`/`res`/`opts` cryptics + `doRefresh` + `handleNonOk`                       |

## Top 5 Renames (highest readability payoff)

1. **`token-manager.ts` / `token-manager.helpers.ts`: `s` → `state`** — the single most-referenced cryptic name in the audit (~15 uses across the auth core, the security-critical path)
2. **`token-manager.helpers.ts:34`: `doRefresh` → `performTokenRefresh`** — removes the `do`-prefix anti-pattern from a public helper
3. **`zwo/duration.mapper.ts` → `duration.converter.ts`** (and `steady-state.mapper.ts` → `steady-state.converter.ts`) — restores the repo's mapper-has-no-logic invariant and signals these need tests
4. **`garmin/mappers/target.converter.ts`: resolve the folder/suffix/`map*`-prefix three-way conflict** — pick `converters/target.converter.ts` + `convertGarminTargetToKrd`
5. **`oauth-consumer.ts` / `retry.ts`: `res` → `response`, `opts` → `options`** — eliminates the two most repeated abbreviations in the HTTP layer (and fixes the within-function alias inconsistency in `withRetry`)

## Public-API Assessment

**Yes — the public API speaks business language.** `@kaiord/core/index.ts` exports read as a fitness-domain glossary (`Workout`, `WorkoutStep`, `RepetitionBlock`, `Target`, `Duration`, `Sport`, `SubSport`, `fromBinary`/`toText`, `validateRoundTrip`, `fingerprintSnapshot`). Adapter public functions follow honest `convert*`/`map*`/`encode*`/`extract*` verbs. The naming debt is **internal and concentrated**: cryptic locals in the `garmin-connect` auth/HTTP plumbing and a handful of `*.mapper.ts` files in `zwo`/`garmin` that quietly accumulated branching logic, breaking the repo's own mapper-vs-converter contract. None of it leaks into consumer-facing surface; all of it is mechanically fixable. No misleading `validate*`/`get*` honesty violations were found — the `validate*` and `get*` functions across all packages do what they claim.

### Relevant files

- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/token/token-manager.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/token/token-manager.helpers.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/oauth-consumer.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/retry.ts
- /Users/pablo/development/kaiord/packages/garmin-connect/src/adapters/http/garmin-auth-fetch.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/duration/duration.mapper.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/interval/steady-state.mapper.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/interval/intervals-t-helpers.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/interval/intervals-t.mapper.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/zwift-to-krd/intervals-processor.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/zwift-to-krd/intervals-extractor.ts
- /Users/pablo/development/kaiord/packages/zwo/src/adapters/krd-to-zwift/intervals-t-encoder.ts
- /Users/pablo/development/kaiord/packages/garmin/src/adapters/mappers/target.converter.ts
- /Users/pablo/development/kaiord/packages/garmin/src/adapters/converters/flatten-segments.converter.ts
- /Users/pablo/development/kaiord/packages/garmin/src/adapters/utils/is-logger.ts
- /Users/pablo/development/kaiord/packages/tcx/src/adapters/duration/duration-walker.converter.ts
- /Users/pablo/development/kaiord/packages/ai/src/adapters/text-to-workout.ts
- /Users/pablo/development/kaiord/packages/core/src/domain/hash/canonical-hash.ts
- /Users/pablo/development/kaiord/packages/core/src/index.ts
