<!-- opsx-ship: chunking
PR 1 (bridge-full-bands):     §1, §2 — parser + privacy. Independently reviewable; no SPA changes. (implements D-FB2, D-FB8)
PR 2 (spa-mapper-bands):      §3, §4, §6.1 — payload type + mapper full-table writes + per-band conflict logic + 15+ unit tests + e2e fixture-data extension (so PR 2 ships green e2e end-to-end). (implements D-FB1, D-FB3, D-FB4, D-FB6, D-FB7)
PR 3 (spa-ui-bands):          §5, §6.2, §6.3 — FieldKey union + label-map entries + dialog test extensions + NEW e2e flows for per-band conflict UX. (implements D-FB5)
PR 4 (archive):               §7 — /opsx-archive + canonical spec sync.

Rationale for moving §6.1 (e2e fixture-data) into PR 2: the e2e fixture stub is the only end-to-end coverage for the mapper's full-table writes. If PR 2 ships without §6.1, the existing e2e baseline either fails (because the fixture payload still has the old `z4Upper`-only shape that the new mapper reconciles against the new ZonesPayload Zod schema) or stays artificially green by reverting the schema change. Bundling §6.1 with PR 2 keeps PR 2 independently testable.

PR independence:
  PR 1: independent. Touches packages/train2go-bridge/{parser.js,test/parser.test.js,test/fixtures/details-active.html} + scripts/fixtures/bridge-privacy-surface.json + packages/train2go-bridge/store-listing.md.
  PR 2: depends on PR 1 (consumes the new payload shape). Touches packages/workout-spa-editor/src/types/coaching-zones.ts, src/application/coaching/sync-zones-payload-mapper.ts, src/application/coaching/sync-zones-profile-fields.ts, src/application/coaching/sync-zones-helpers.ts, src/application/coaching/commit-conflict-resolution.ts + unit tests + e2e/helpers/train2go-bridge-stub-page-script.ts (fixture-data extension only — no new e2e flows).
  PR 3: depends on PR 2 (consumes the new FieldKey union). Touches src/components/organisms/ZonesConflictDialog/{field-labels.ts,ZonesConflictDialog.test.tsx} + e2e/zones-sync.spec.ts (NEW per-band conflict-row flows + assertions on the persisted bands).
  PR 4: depends on PR 1, PR 2, PR 3 all merged.
-->

## 1. Bridge — parser full-band extraction (implements D-FB2, D-FB8)

- [ ] 1.1 Update `packages/train2go-bridge/test/fixtures/details-active.html` to include the Generic HR block (`heart-rate-zone heart-rate-zone-generic`) with the canonical Z1-Z5 values from Pablo's live data: Z1 107-133, Z2 134-147, Z3 148-160, Z4 161-174, Z5 175-187. Keep the existing cycling-Specific block. Add `<input name="bpm_rest" value="51">` to the physio block. Add `<input name="imc" value="26.4">` to the physio block as well — this is required so the redaction key-walk test (1.3h) actually exercises the IMC blocked path (the canonical spec previously listed IMC in prose only; the new code-block forbidden-set makes it explicit, but the test must have a real IMC field in the input or the assertion is vacuous). Sanitize as before (CSRF/user_id placeholders intact).
- [ ] 1.2 Extend `parseDetailsHtml` in `packages/train2go-bridge/parser.js`:
  - Add `parseGenericHrBlock` helper that finds `heart-rate-zone-generic` and emits `{ z1..z5: { lower, upper } }` from each band's `<input name="zN_lower">` / `<input name="zN_upper">` pair. Returns null if the wrapper is absent.
  - Extend the existing `parseHrZonesBlock` (per-sport) to emit the full Z1-Z5 band shape AND keep the `z4Upper` convenience field (= `z4.upper`) for backwards compatibility.
  - Extend `parsePacesBlock` for cycling: emit `{ z1..z5: { lower, upper } }` integers AND keep `z4Upper`/`z5Lower` convenience fields.
  - Extend `parsePacesBlock` for running/swimming: emit `{ z1..z5: { lower: { min, sec }, upper: { min, sec } } }` AND keep `z4Upper` convenience field as `{ min, sec }` of the band's upper.
  - Extend `parsePhysioBlock` to emit `bpmRest` from `<input name="bpm_rest">` alongside `weight` and `bpmMax`.
  - Each new sub-helper function SHALL be ≤40 lines (per `max-lines-per-function`).
  - **Scope of 100-line file cap**: applies only to NEW files added by this change (e.g., new `parser-hr-bands.js` / `parser-pace-bands.js` if helpers are split out). The existing `parser.js` is already ~437 lines (legacy, predates this convention) — refactoring the existing file to fit under the cap is OUT OF SCOPE for this change. New helpers MAY be inlined into `parser.js` (which keeps it growing) OR split into new files (each new file under the 100-line cap). The PR author picks; a follow-up "parser-modernization" change can address the legacy oversize file separately.
  - Reuse the existing `sliceWithinForm` / `extractInputValueByNameSuffix` / `escapeForRegex` helpers.
- [ ] 1.3 Tests in `packages/train2go-bridge/test/parser.test.js`:
  - 1.3a Generic HR block: feed the fixture, assert `output.hrZones.generic` has all five `{ lower, upper }` bands with the canonical values.
  - 1.3b Cycling Specific block extended: assert `output.hrZones.cycling.z3.lower = 148`, `output.hrZones.cycling.z3.upper = 160`, AND `output.hrZones.cycling.z4Upper = 174` (convenience field preserved).
  - 1.3c Per-sport HR block emitted only when present: feed a fixture WITHOUT `heart-rate-zone-running` block; assert `output.hrZones.running` is absent (`'running' in output.hrZones === false`).
  - 1.3d Cycling pace bands as integer watts: assert `output.paces.cycling.z1.lower = 111`, `output.paces.cycling.z4.upper = 268`, AND `output.paces.cycling.z4Upper = 268`.
  - 1.3e Running pace bands as `{ min, sec }`: assert `output.paces.running.z4.upper = { min: 4, sec: 10 }`, AND `output.paces.running.z4Upper = { min: 4, sec: 10 }`.
  - 1.3f Swimming pace bands as `{ min, sec }`: assert `output.paces.swimming.z5.upper = { min: 1, sec: 26 }`.
  - 1.3g `bpm_rest` extraction (camelCase only): assert `output.physiological.bpmRest = 51`. **Additionally** assert that a recursive key-walk over the parsed `output` MUST NOT find any key matching the literal string `bpm_rest` (snake_case) at any nesting depth — only the camelCased `bpmRest` is permitted to surface (per the spec scenario "bpm_rest is allowlisted and emitted (camelCase only)"). A regression where the parser accidentally emits both forms (e.g., copy-paste from the DOM) must fail this assertion.
  - 1.3h Redaction key-walk (extended): walk the parsed output recursively; assert no key in `FORBIDDEN_KEYS = {gender, birthday, fat, smoker, imc, user_notes, email, records, tests}` and no nested path in `FORBIDDEN_NESTED_PATHS = {coach.email, coach.name}` appears at any depth. Note: `bpm_rest` is REMOVED from the forbidden set in this test (it's now allowlisted as `bpmRest`); `imc` is now EXPLICITLY enumerated (was prose-only in the canonical spec; the fixture from 1.1 must contain a real `imc` field for this assertion to be non-vacuous). The forbidden-set in this test SHOULD be loaded from a single source of truth shared with the spec — preferred approach: add a small fixture `scripts/fixtures/forbidden-set.json` containing both arrays, and have BOTH the spec lint and the parser test load from it. If a single source isn't feasible in PR 1, add a `node:test` script `scripts/check-forbidden-set-spec-vs-test.test.mjs` that:
    - Reads `openspec/specs/train2go-bridge/spec.md` (or the active change spec, whichever is canonical at script run time).
    - Locates the fenced code block whose first non-whitespace content matches `FORBIDDEN_KEYS = {`.
    - Parses the matched block as JSON5 (handling the `=` assignment and trailing commas via simple regex stripping before `JSON.parse`, OR using `json5` package if already a dependency).
    - Same for `FORBIDDEN_NESTED_PATHS`.
    - Compares against the test's hardcoded `Set` using set-equality (per the "Comparison semantics" subsection in the spec).
    - Fails with a clear diff message naming which keys are missing/extra on which side.
- [ ] 1.4 Run `pnpm --filter @kaiord/train2go-bridge test`: all parser tests SHALL pass green.

## 2. Bridge — privacy surface + listing copy (implements D-FB8 privacy surface)

- [ ] 2.1 Update `scripts/fixtures/bridge-privacy-surface.json`:
  - Inspect the current shape: if it has an `extracted_fields` array (or equivalent), append the new emitted fields ("hr-zones-z1-z5-bands", "power-zones-z1-z5-bands", "pace-zones-z1-z5-bands", "physiological-bpm-rest"). If no such array exists, ADD it as a top-level array on the `train2go-bridge` entry — do NOT leave the listing-copy and the surface fixture out of sync.
  - The `allowed_paths` count stays at 5 (no new endpoints).
  - Verify `pnpm test:scripts` passes — specifically `check-bridge-privacy-surface.test.mjs`. If the test was previously asserting only `allowed_paths` and not `extracted_fields`, extend it (one-line addition) so a future field surface widening fails the test until the fixture is updated.
- [ ] 2.2 Update `packages/train2go-bridge/store-listing.md` "broadened-read paragraph". The PR SHALL paste the following exact copy verbatim (no rewording at PR-review time):

  > After enabling Sync zones, the extension reads the following fields from your Train2Go user-details page (`https://app.train2go.com/user/details`): your training thresholds (FTP, LTHR per sport, threshold pace, CSS), the full Z1-Z5 zone tables for heart rate, power, and pace per configured sport, your maximum heart rate (`bpm_max`), your resting heart rate (`bpm_rest`), and your body weight. The extension never reads or transmits gender, birthday, body fat percentage, IMC, smoking status, body composition labels, coach contact details (email, name), records, tests, email, or user notes. All fields are read on-demand when you click "Sync zones" — the extension does not background-poll your Train2Go account.

  Verification: PR 1 diff against `tasks.md` §2.2 produces an exact match in `packages/train2go-bridge/store-listing.md`.
- [ ] 2.3 Add a changeset entry: `@kaiord/train2go-bridge: minor`. Body summarises the new emitted fields per the proposal's "What Changes" list.

## 3. SPA — `ZonesPayload` type extension (implements D-FB2, D-FB5)

- [ ] 3.1 Extend `packages/workout-spa-editor/src/types/coaching-zones.ts` `zonesPayloadSchema` (Zod):
  - Replace the per-block `{ z4Upper }` shape with `{ z1..z5: { lower, upper }, z4Upper, z5Lower? }` where `z4Upper` and `z5Lower` are convenience scalars derived from the bands.
  - Cycling power band: `{ lower: number, upper: number }` (both watts integers).
  - Running/swimming pace band: `{ lower: { min: 0..59, sec: 0..59 }, upper: { min: 0..59, sec: 0..59 } }` plus convenience `z4Upper: { min, sec }`.
  - HR band: `{ lower: bpm, upper: bpm }` plus convenience `z4Upper: bpm`.
  - Add `physiological.bpmRest?: number` (positive integer, ≤250).
- [ ] 3.2 Extend the canonical `FieldKey` union (in the same file). Add band-level keys via a generated cross-product (helper at top of file, NOT a hand-written 50-line list). For each `(sport ∈ [cycling, running, swimming], kind ∈ [heartRateZones, powerZones, paceZones], band ∈ [z1..z5], bound ∈ [min, max])` valid combination, emit one FieldKey. Power keys exist only for cycling. Pace keys exist only for running and swimming.
- [ ] 3.3 Update `WrittenField`/`ConflictItem` type docs to reference the new band-level keys. No shape change.

## 4. SPA — mapper + conflict logic (implements D-FB1, D-FB3, D-FB4, D-FB6, D-FB7)

- [ ] 4.1 Implement HR fallback chain in `packages/workout-spa-editor/src/application/coaching/sync-zones-payload-mapper.ts`:
  - For each sport, prefer `payload.hrZones.<sport>` over `payload.hrZones.generic`. Build the `incoming.<sport>.heartRateZones.zones` array as `HeartRateZone[]` with the canonical zone names from `DEFAULT_HEART_RATE_ZONES`. Skip if both sources are absent.
- [ ] 4.2 Cycling power-band mapper: convert each `{ lower, upper }` watts band to `{ minPercent, maxPercent }` via `round(watts / ftp * 100)`. The divisor MUST be `payload.paces.cycling.z4Upper` (T2G's FTP, per D-FB6) — NOT the persisted profile's `cycling.thresholds.ftp` (which may be stale or manual; mixing sources distorts %). If `payload.paces.cycling.z4Upper` is absent OR zero, skip the power band write (log info `"cycling power bands skipped: T2G FTP missing"`). Names from `DEFAULT_POWER_ZONES`.
- [ ] 4.3 Pace-band mapper for running/swimming: convert `{ min, sec }` to integer seconds with the lower/upper inversion per D-FB7 (`minPace = secondsOf(payload.upper)`, `maxPace = secondsOf(payload.lower)`). Build `PaceZone[]` with the existing `paceZoneSchema` shape (zone, name, minPace, maxPace, unit). Unit is `min_per_km` for running, `min_per_100m` for swimming. Zone names: reuse the canonical Z1=Recovery..Z5=VO2 Max names from `DEFAULT_HEART_RATE_ZONES` (the project does NOT have a `DEFAULT_PACE_ZONES` constant; the zone-name convention is the same across HR/power/pace per the existing schema). If a `DEFAULT_PACE_ZONES` constant is added by a parallel change, switch to that — but DO NOT add it as part of this PR (out of scope).
- [ ] 4.4 Extend `sync-zones-profile-fields.ts` `readField`/`writeField`:
  - Add band-level read accessors: e.g., `cycling.heartRateZones.z2.maxBpm` reads `profile.sportZones.cycling.heartRateZones.zones[1].maxBpm`. Five bands × two bounds × three sports × three kinds (not all combinations valid; respect sport-kind matrix from §3.2) handled via a lookup helper, not 50 case statements.
  - Add band-level writers that mutate the specific band of the array. Writing a missing band creates a fresh entry from the defaults.
- [ ] 4.4a Unit test for the band-name → array-index map: assert the mapping `z1 → zones[0]`, `z2 → zones[1]`, ..., `z5 → zones[4]` for each (sport, kind) pair via a parameterized test. Off-by-one regressions (e.g., `z1` accidentally pointing at `zones[1]`) MUST fail this test, not just the higher-level integration test.
- [ ] 4.5 Extend `sync-zones-helpers.ts` `reconcile`:
  - For each sport-kind table where ANY band differs from the persisted profile, emit per-band `ConflictItem`s.
  - For sport-kind tables where the persisted `zones` is empty (no entries), apply the silent-fill rule: write the full T2G-derived array eagerly and add each band as a `WrittenField` to `applied`.
- [ ] 4.6 Extend `commit-conflict-resolution.ts` to handle band-level FieldKeys: group decisions by `<sport>.<kind>`, then for each sport-kind table apply the merge rule (accepted bands take T2G values, rejected bands keep pre-sync values). Idempotent.
- [ ] 4.7 Tests in `sync-zones.test.ts` (new cases, ≥15):
  - 4.7a Triathlete profile, cycling Specific present, running/swim absent → fallback chain writes Generic to running and swim, Specific to cycling. Assert all three sports get HR bands.
  - 4.7b Empty profile + full payload → silent fills for every sport-kind table; conflicts empty.
  - 4.7c Manually-tuned cycling HR Z2 differs from T2G → one conflict row per disagreeing bound.
  - 4.7d All-reject decisions for cycling HR table → persisted bands stay byte-identical.
  - 4.7e Mixed accept/reject for cycling HR table → merged array (accepted bands updated, rejected bands preserved).
  - 4.7f Cycling power-band watts → percentage conversion (deterministic integer rounding): assert Z4 `{lower: 240, upper: 268}` with `payload.paces.cycling.z4Upper = 268` → `zones[3] = { minPercent: 90, maxPercent: 100 }` EXACTLY (using `expect(...).toBe(90)` and `toBe(100)` — NO ±1 tolerance). The integer-equality contract from the per-band conflict policy spec (round-trip stability) requires deterministic rounding; a tolerance would mask off-by-one bugs (`Math.floor` vs `Math.round`).
  - 4.7g Running pace-band conversion (with lower/upper inversion per D-FB7): `z4.lower = { min: 4, sec: 44 }`, `z4.upper = { min: 4, sec: 10 }` → `paceZones.zones[3] = { minPace: 250, maxPace: 284, unit: "min_per_km" }` (faster bound `upper` → `minPace`; slower bound `lower` → `maxPace`). Assert `minPace <= maxPace` invariant.
  - 4.7h FTP absent + cycling power bands present → power write SKIPPED, log emitted, no conflict.
  - 4.7i Generic HR block absent + per-sport Specific present → only Specific sports get HR; sports without Specific stay untouched.
  - 4.7j Generic HR block absent + no Specific anywhere → all three sports' HR untouched, no conflicts.
  - 4.7k Backwards compat — payload with `z4Upper` only (no `z1..z5` bands, simulating an older bridge) → threshold scalars work, band writes skipped.
  - 4.7l `commitConflictResolution` mixed-decisions for HR Z1-Z5 with merge.
  - 4.7m `commitConflictResolution` all-accept for cycling power table.
  - 4.7n `commitConflictResolution` idempotency for band-level decisions.
  - 4.7o Profile-deleted-mid-commit at band level → `ProfileNotFoundError`.
  - 4.7p `bpmRest` flow-through-but-not-persisted (per D-FB8): given `payload.physiological.bpmRest = 51`, after `syncZones` the persisted profile MUST NOT gain a `restingHeartRate` (or equivalent) field. Use a deep-diff helper (NOT a single field-name absence check). The allowed-keys whitelist MUST be **derived programmatically from the source-of-truth schemas** at test runtime (NOT hardcoded as a string array): walk `sportZonesRecordSchema.shape` and `profileSchema.shape` (Zod `.shape` introspection) to enumerate the writable paths under `bodyWeight`, `heartRate.max`, `sportZones.*.{heartRateZones,powerZones,paceZones}.zones`, `cycling.thresholds.*`, `running.thresholds.*`, `swimming.thresholds.*`.

    **Zod-walk recursion contract** (load-bearing — implementers MUST follow this exactly to avoid one-level walks that miss nested fields like `cycling.thresholds.ftp`):
    - For `ZodObject` (`schema._def.typeName === "ZodObject"`): recurse into each `.shape` entry, prepending the entry key to the path.
    - For `ZodOptional` / `ZodNullable` / `ZodDefault`: unwrap via `_def.innerType` (or `_def.schema` for `ZodDefault`) and recurse without changing the path.
    - For `ZodArray`: append `*` to the path as an index wildcard, then recurse into `.element`.
    - For `ZodRecord`: append `*` to the path, then recurse into `.valueSchema`.
    - For `ZodUnion` / `ZodDiscriminatedUnion`: take the union of paths from each `_def.options[i]` (some branches may have fields others don't — all are allowed).
    - For terminal types (`ZodNumber`, `ZodString`, `ZodBoolean`, `ZodEnum`, `ZodLiteral`, `ZodDate`, etc.): emit the dotted path.
    - Output: `Set<string>` of dotted paths with `*` as array/record wildcard. The deep-diff comparator matches paths against this set, treating `*` as "any single dotted segment".
    - Reuse: if `packages/workout-spa-editor/src/test-utils/zod-walk.ts` already exists, use it. Otherwise add the helper there (export `zodWalk(schema): Set<string>`) so other tests can share it.

    The diff between pre-sync and post-sync profile MUST include only keys whose dotted path matches one of those derived paths. Rationale: a hardcoded whitelist drifts when the schema gains a new field (e.g., a hypothetical future `cycling.thresholds.criticalPower`); deriving it means schema additions either auto-extend the whitelist (legitimate) or fail noisily (forcing explicit review). Any other key surfacing in the diff MUST fail the test, including a hypothetical future `restingHeartRate`, `physiology.bpmRest`, or any other consumer derived from `bpmRest`. Flipping this assertion in a future PR is intentional (when a consumer is added).
  - 4.7q Power-zone count mismatch (T2G 5 vs Kaiord 7 default — per D-FB3): given the profile pre-sync has `sportZones.cycling.powerZones.zones = DEFAULT_POWER_ZONES.slice()` (i.e., 7 entries Z1-Z7 with default percentages), and the T2G payload provides full Z1-Z5 power bands with FTP=268, after `syncZones` the post-sync `sportZones.cycling.powerZones.zones` SHALL have exactly 5 entries (length === 5); the entries SHALL be Z1-Z5 derived from T2G's bands; Z6 and Z7 SHALL NOT be in the persisted array.
  - 4.7r Re-sync stability — HR bands: given a profile previously sync'd from T2G with HR bands persisted, re-running `syncZones` against the same T2G payload SHALL produce zero conflicts and zero applied entries for that sport's HR bands. Equality is integer bpm (no tolerance).
  - 4.7s Re-sync stability — pace bands: given a profile previously sync'd from T2G with running pace bands persisted, re-running `syncZones` against the same T2G payload SHALL produce zero conflicts and zero applied entries for `running.paceZones.*`. Equality is integer seconds (no tolerance).
  - 4.7t Display-watts divergence (per D-FB6 "Display-watts divergence" subsection): unit-test the Profile Manager's render helper that converts persisted `{minPercent, maxPercent}` back to absolute watts. GIVEN persisted `cycling.thresholds.ftp = 200` (user rejected the FTP scalar conflict) AND persisted `cycling.powerZones.zones[3] = { zone: 4, name: "Lactate Threshold", minPercent: 90, maxPercent: 100 }` (computed during sync against T2G's `z4Upper = 268`, then user accepted the band conflict), WHEN the render helper computes display-watts for Z4, THEN it SHALL emit `Z4: 180-200 W` (= `200 * 90% .. 200 * 100%`) — NOT T2G's reported `240-268 W`. Locks the documented divergence so a regression that switches the render multiplier to T2G's z4Upper fails this test.

    **Render helper location**: if a discrete pure function does NOT yet exist, extracting it is in scope of 4.7t. Suggested location: `packages/workout-spa-editor/src/lib/profile/zone-display-watts.ts` exporting `renderPowerZoneWatts(zone: PowerZone, ftp: number): { lowerW: number; upperW: number }`. The Profile Manager component (e.g., `PowerZonesTable.tsx`) imports this helper rather than inlining the multiplication.

    **Chunking**: 4.7t ships with **PR 2** if the helper lands in `src/lib/profile/` (application-layer pure function, naturally PR-2-aligned with the mapper writes). It ships with **PR 3** if the helper is co-located with the Profile Manager component (e.g., `src/components/.../zone-display-watts.ts`). The PR-2 path is preferred because the helper is a pure function and pulling it from the component is a clean split. The PR author SHALL pick at PR-2-write time and document the choice in the PR description; if the choice slips to PR 3, update the chunking comment at the top of tasks.md.
- [ ] 4.8 Add changeset: `@kaiord/workout-spa-editor: minor`. Body summarises the mapper + conflict-policy extension.

## 5. SPA — UI: FieldKey label map + dialog tests (implements D-FB5)

- [ ] 5.1 Extend `packages/workout-spa-editor/src/components/organisms/ZonesConflictDialog/field-labels.ts`:
  - Add a generator helper at the top (sport × kind × band × bound) that emits the full label map at module-load time. No T2G strings; labels follow Q1's chosen short form (e.g., `"Cycling HR Z2 max"`). Document the convention in the file's JSDoc.
  - Keep the existing 7 threshold-scalar labels unchanged.
  - Verify the static-only invariant: `field-labels.ts` never reads from a parameter or external string.
- [ ] 5.1a Unit test for the label-map helper: assert (a) every band-level `FieldKey` has a non-empty label entry; (b) the count matches the expected cross-product (3 sports × heartRateZones × 5 bands × 2 bounds = 30, plus cycling × powerZones × 5 × 2 = 10, plus 2 sports × paceZones × 5 × 2 = 20 — total 60 band-level entries, plus the existing 7 threshold-scalar entries = 67 total); (c) no entry contains a substring that could come from T2G (e.g., `coach`, `email`, `birthday`).
- [ ] 5.2 Extend `ZonesConflictDialog.test.tsx` cases:
  - 5.2a Render with a band-level conflict (`cycling.heartRateZones.z2.maxBpm`) and assert the row's testid + label render correctly.
  - 5.2b Render with mixed scalar + band conflicts and assert insertion order groups by sport-kind for visual coherence.
  - 5.2c All-accept across an HR sport-kind table → confirm callback receives all five `accept` decisions for that table.

## 6. SPA — e2e fixture + flows

> **Chunking note**: §6.1 ships with PR 2 (mapper) so PR 2 has end-to-end coverage of the new full-table writes. §6.2 and §6.3 ship with PR 3 (UI) because they exercise the per-band conflict-row dialog rendering.

- [ ] 6.1 (PR 2) Extend `packages/workout-spa-editor/e2e/helpers/train2go-bridge-stub.ts` `FIXTURE_ZONES_PAYLOAD` constant: add the full Generic HR Z1-Z5, Specific cycling Z1-Z5, cycling power Z1-Z5, running/swim pace Z1-Z5, and `bpmRest`. Keep the existing convenience scalars (`z4Upper`, `z5Lower`). Update existing e2e flow (b) to assert the persisted profile gets the FULL `sportZones.cycling.heartRateZones.zones` array (5 bands), not just LTHR. Same for power and pace tables.
- [ ] 6.2 (PR 3) Add new e2e flows in `e2e/zones-sync.spec.ts`:
  - 6.2a New flow (d) — toggle-on with manually-tuned cycling HR Z2 → conflict dialog opens with the per-band rows; user accepts only Z2 → merged array verified.
  - 6.2b New flow (e) — toggle-on with all-rejected cycling power-band conflicts → persisted bands stay byte-identical post-cancel-resolution.
  - 6.2c Verify `cycling.powerZones.zones[3]` (Z4) is exactly `{ minPercent, maxPercent }` matching `round(240/268*100)..round(268/268*100)` (i.e., bounds in `[89, 100]`). Use `toBeGreaterThanOrEqual` / `toBeLessThanOrEqual`, NOT a `≈` tolerance — the rounding is deterministic.
- [ ] 6.3 (PR 3) Run the e2e three iterations to verify stability: `pnpm exec playwright test e2e/zones-sync.spec.ts --project=chromium --retries=0` × 3. All three runs SHALL pass with **zero retries** (a flake that surfaces 1/3 still fails this gate) and **zero `.fixme` / `.skip` annotations** in the new test code. The PR description SHALL quote the three CI-run URLs as evidence.

  **Escalation path (1/3 or 2/3 flake):** if a flake surfaces in any of the three runs, the PR author SHALL EITHER:
  - (a) **Root-cause and fix the flake before merging.** Common Playwright flake sources: missing `await` on auto-waiting locators, stale snapshots after navigation, race conditions in stub initialization. Fix at the source.
  - (b) **Document the flake explicitly in the PR description AND file a follow-up issue with `[flake]` label** AND get explicit reviewer sign-off. Only acceptable when the flake is reproducibly NOT triggered by the band-sync code path under review (e.g., a pre-existing flake in an unrelated test).

  Silent retry-loops in CI (re-running until green) are NOT permitted. The CI matrix SHALL run with `--retries=0` for this spec.

## 7. Final wiring + archive

- [ ] 7.1 Run the full validation pipeline:
  - `pnpm -r build`
  - `pnpm -r test` — expect a strict increase over the baseline. The exact delta is the sum of: §1.3 (8 cases, 1.3a-1.3h), §4.4a (1 parameterized case across the sport-kind matrix), §4.7 (≥19 cases, 4.7a-4.7s), §5.1a (1 case), §5.2 (3 cases). If the post-§5 test count does not strictly exceed the baseline by ≥30 net new cases, the PR author SHALL audit which tests were skipped or merged. The actual baseline number is captured at PR-1-merge time and recorded in the PR description (no hardcoded count in tasks.md — would drift between proposal-write and PR-3-merge).
  - `pnpm lint:fix`
  - `pnpm test:scripts` (mechanical guards including `check-bridge-privacy-surface`, `check-no-pii-leakage`, redaction key-walk, optionally `check-forbidden-set-spec-vs-test` from §1.3h)
  - `pnpm lint:specs` (34→34 specs, no new capability)
  - `npx openspec validate train2go-zones-sync-full-bands --strict`
- [ ] 7.2 Manual verification with Pablo's actual T2G account (per design D-FB1):
  - Pre-sync: Profile Manager Cycling tab shows FTP=268, LTHR=174, HR zones 0-0 (carried over from before this change)
  - Post-sync: HR zones populate with 107-187 across Z1-Z5; Running tab gets HR zones from Generic block (107-187 same values); Power zones table populates with %FTP bands; Pace zones for running/swimming populate with min:sec bands
  - Conflict dialog: if any band differs, dialog opens with per-band rows; accept/reject works per-row; cancel preserves silent fills
  - **Acceptance gate**: the manual verification result MUST be recorded as a bullet list at the top of the archived `proposal.md` (under a `## Manual verification` heading) before §7.3 archive runs. Discrepancies between observed and expected behavior MUST NOT be silently accepted — file a follow-up issue and decide explicitly whether to ship-as-is or block.
- [ ] 7.3 Archive the change via `/opsx:archive train2go-zones-sync-full-bands` once all PRs merged on main.
