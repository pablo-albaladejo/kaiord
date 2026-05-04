## Context

The `train2go-zones-sync` change shipped 2026-05-03 (4 PRs: #471, #473, #474, #479) and an e2e follow-up (#486). It established the bridge action `read-details`, the `CoachingTransport.readZones` port, the `syncZones` use case + `commitConflictResolution` + `Train2GoZonesSyncProvider`, and three e2e flows. The shipped scope was **threshold-only**: each sport gets one number (FTP for cycling, LTHR per sport, threshold pace, CSS) extracted from each block's `z3_upper` (T2G's 0-indexed name for the upper bound of visual Z4). The decision in design D7 of that change was explicit: _"full Z1-Z5 zone tables are derivable from threshold + zone-method, so leave them out of v1."_

That decision assumed Kaiord had a zone-method derivation engine. Pablo discovered after shipping that it doesn't — the Profile Manager's HR Zones table stays at `0-0` after sync (cycling tab has FTP=268W and LTHR=174 bpm but the bands are empty), and the Running tab is worse: pace=4:10/km filled, but LTHR empty (no per-sport HR block in his T2G account, only Generic). The capability gap in Kaiord is a real one but turns out to be unnecessary: T2G's `/user/details` already pre-computes the bands using Karvonen %FCR (with maxHR + bpm_rest as inputs) for the Generic block and a per-sport "Specific" override block for each sport the coach has explicitly configured.

Concrete evidence from Pablo's live `/user/details` HTML:

| Block                      | Z1      | Z2      | Z3      | Z4      | Z5      |
| -------------------------- | ------- | ------- | ------- | ------- | ------- |
| `heart-rate-zone-generic`  | 107-133 | 134-147 | 148-160 | 161-174 | 175-187 |
| `heart-rate-zone-cycling`  | 107-133 | 134-147 | 148-160 | 161-174 | 175-187 |
| `heart-rate-zone-running`  | absent  |         |         |         |         |
| `heart-rate-zone-swimming` | absent  |         |         |         |         |

The user's policy verbatim: _"si hay específicas, tomamos las específicas, sino las generales."_ This is the load-bearing decision behind D-FB1 below.

T2G also exposes full Z1-Z5 bands for `paces` (per sport) and the cycling power table, so the same pattern extends to power and pace zones with no extra design work.

This change is a **mapper extension on top of the shipped capability**, not a re-architecture. The `Train2GoZonesSyncProvider`, the orchestrator, the connect/sync fan-out, the conflict dialog, and the Dexie write paths all stay in place — only the `ZonesPayload` shape, the parser, and the mapper widen.

## Goals / Non-Goals

**Goals:**

- Populate `profile.sportZones.<sport>.heartRateZones.zones`, `.powerZones.zones`, and `.paceZones.zones` directly from the T2G payload, so the Profile Manager's Z1-Z5 tables show real values after the first sync — no Kaiord-side math.
- Per-sport HR fallback: when a sport has no Specific block in T2G, the mapper writes the Generic Karvonen-derived bands to that sport's profile slot. Only when both Specific AND Generic are absent does the sport's `heartRateZones.zones` stay untouched.
- Backwards-compatible: every consumer that today reads `payload.hrZones.<sport>.z4Upper` (i.e., the LTHR threshold scalar) continues to work — the parser keeps emitting `z4Upper` derived from `z4.upper`, so the existing FieldKey-level writes (`cycling.thresholds.lthr`, `running.thresholds.lthr`, etc.) are byte-identical.
- Conflict policy unchanged at the dialog level: per-row accept/reject; silent fills committed eagerly; cancel discards conflicting writes only. The new bands surface as additional rows when they disagree with persisted values.
- One additional physiological field (`bpm_rest`) added to the parser allowlist. No mapper consumer in this change; reserves the data for a future Kaiord-side Karvonen path if a non-T2G profile ever needs it.

**Non-Goals:**

- A Kaiord-side zone-derivation engine (Coggan, Karvonen, %LTHR, %maxHR, etc.). Cancelled as a separate capability — T2G is the source of truth.
- Method-picker UI per sport. Today's "Custom" mode in the profile editor stays as the catch-all for users not on T2G; the picker isn't needed when the bands arrive pre-computed.
- Bidirectional sync (Kaiord → T2G zone updates).
- Zone derivation for sports T2G doesn't model (Kaiord `generic` sport stays manual).
- Any change to the shipped FieldKey union for **threshold scalars** — `cycling.thresholds.ftp`, etc. keep their current names and write paths.
- Reducing the conflict dialog row count via heuristic ("collapse same-direction band-set into single row"). v1 ships raw per-band rows; UX iteration is a follow-up.

## Conventions

**Capitalization (used throughout this change):**

- **Specific** / **Generic** (capitalized) — refers to T2G's UI block names (proper-noun usage; e.g., "the Specific block", "the Generic Karvonen-derived block").
- _specific_ / _generic_ (lowercase) — adjective usage in prose (e.g., "this sport-specific override", "the generic case").
- `specific` / `generic` (lowercase, code-style) — payload key names; e.g., `payload.hrZones.generic`.

**Format:**

- `Z1-Z5` always uses ASCII hyphen `-`, never en-dash.
- `FieldKey` (PascalCase) is the TypeScript type name; "field key" (two words, lowercase) is the conceptual noun in prose.

**Acronyms:**

- The DOM field is `name="imc"` (lowercase, matching T2G's HTML form name); the user-facing acronym is `IMC` (uppercase, matching the medical convention for "Índice de Masa Corporal" / Body Mass Index). Code-block forbidden-set entries use the DOM-side lowercase form (`"imc"`); prose enumeration in `proposal.md` and `store-listing.md` uses the uppercase acronym (`IMC`).
- `FTP`, `LTHR`, `CSS`, `HR`, `SPA`, `CWS`, `T2G` are always uppercase (acronyms in code-comments, prose, and tests).

**Function-length cap (per the project's `CLAUDE.md` at the repo root, "Code Style" section):**

- ≤40 lines per function for non-component code (mappers, helpers, parsers).
- ≤60 lines per function for React component bodies.
- Tests are exempt.

The cap applies to NEW functions added by this change. Existing functions over the cap (e.g., `parser.js`'s legacy helpers) are NOT refactored as part of this change.

## Decisions

### D-FB1: Per-sport HR fallback chain — Specific → Generic → skip

For each sport `s ∈ { cycling, running, swimming }`, the mapper's HR-band lookup order is:

1. `payload.hrZones.<s>` — the Specific block, when the coach has explicitly configured it in T2G.
2. `payload.hrZones.generic` — Karvonen %FCR-derived bands, always present in T2G when the user has bpm_max + bpm_rest set.
3. _skip_ — neither block present (e.g., a brand-new T2G account with no physiological data). The sport's `heartRateZones.zones` stays at whatever the user previously had (empty if untouched).

**Why this rule:** mirrors T2G's own UI model (the "+ New heart rate zone" button on the Specific column makes the override explicit; the Generic block is always rendered as the fallback). Pablo's quote is the policy.

**Why not "Specific only":** would leave running and swimming HR bands at 0-0 for every triathlete who has only configured cycling-specific (the common case), defeating the whole point of this change.

**Why not "Generic only":** would silently overwrite the cycling-specific bands the coach explicitly configured. Specific MUST win when present.

**Why not "ask the user":** the conflict dialog already covers _changes to existing Kaiord values_; the fallback chain is for the source-of-truth selection BEFORE any conflict check. Adding a UI for it would surface a question that has a single sensible answer.

### D-FB2: Full-band parser shape (raw bridge contract)

**Naming pun (load-bearing, called out for reviewers):** the payload key `payload.paces.cycling` carries **WATTS**, not pace. T2G's HTML organises both pace bands (running/swimming, in min:sec) and the cycling power table under the same `paces` form (their internal naming) keyed by `sport_id`. Kaiord's bridge intentionally preserves T2G's form-key naming so the parser stays a thin shim — the 0-indexed `z3_upper` DOM names map uniformly across all three sports without per-sport branching at the bridge layer. The semantic flip from "pace" → "power" happens in one place, the SPA mapper, where `payload.paces.cycling` is fed into `powerZones`. Renaming `payload.paces.cycling` to `payload.power.cycling` is OUT OF SCOPE here; revisit when adding a non-T2G power source where the symmetry no longer holds.

To make the units self-describing in tests and to prevent shape drift, each block carries an implicit unit by its location:

- `payload.paces.cycling.zN.{lower,upper}` — `number` (watts)
- `payload.paces.{running,swimming}.zN.{lower,upper}` — `{ min: number, sec: number }` (min:sec/km or /100m)
- `payload.hrZones.*.zN.{lower,upper}` — `number` (bpm)

The Zod parser branches on this shape per sport-kind; the SPA mapper branches symmetrically. Tests assert the shape branch coverage at the Zod parse step.

The `parseDetailsHtml` allowlist gains five `{ lower, upper }` pairs per block, replacing today's single `z4Upper` per block. The 0-indexed → 1-indexed naming convention from the original change holds (DOM `z3_upper` → payload `z4.upper`).

```text
payload.hrZones.{generic,cycling,running,swimming}? = {
  z1: { lower: number, upper: number },  // bpm
  ...
  z5: { lower: number, upper: number },
}

payload.paces.cycling? = {
  z1: { lower: number, upper: number },  // watts (single int per bound)
  ...
  z5: { lower: number, upper: number },
}

payload.paces.{running,swimming}? = {
  z1: { lower: { min, sec }, upper: { min, sec } },  // min:sec/km or /100m
  ...
  z5: { lower: { min, sec }, upper: { min, sec } },
}

payload.physiological.{weight, bpmMax, bpmRest}?
```

The parser still emits `z4Upper` as a derived convenience field on each block (`z4.upper` for HR, `z4.upper` for cycling power, `z4.upper.min * 60 + z4.upper.sec` for run/swim pace) so existing FieldKey-level writes stay byte-identical. **One emit point, two consumer shapes**: full-table writers read `z1..z5`; threshold writers read `z4Upper`.

**Why not "drop z4Upper":** would force a synchronous coordinated change to the SPA mapper for threshold writes. Keeping the convenience field lets PR 1 (parser) ship independently of PR 2 (mapper).

**Why not "compute z4Upper SPA-side":** would push T2G's 0/1-indexed naming convention into the SPA layer. The bridge already owns that translation; keeping it there is hexagonally cleaner.

### D-FB3: Mapper writes `HeartRateZone[] | PowerZone[] | PaceZone[]` arrays directly

Per sport, the mapper builds an array shaped exactly like the existing `sportZonesRecordSchema.<sport>.heartRateZones.zones` field (`[{ zone: 1, name: "Recovery", minBpm: 107, maxBpm: 133 }, ...]`). Zone names follow the canonical Kaiord convention (Z1=Recovery, Z2=Aerobic, Z3=Tempo, Z4=Threshold, Z5=VO2 Max for HR). The `DEFAULT_HEART_RATE_ZONES` and `DEFAULT_POWER_ZONES` constants in `types/profile-defaults.ts` provide the names; there is no `DEFAULT_PACE_ZONES` constant today, so pace-band names reuse the HR-zone names verbatim (the schema does not enforce a per-kind name set).

**Power-zone count mismatch (load-bearing decision):** Kaiord's `DEFAULT_POWER_ZONES` defines **7 zones** (Coggan-style: Z1=Active Recovery, Z2=Endurance, Z3=Tempo, Z4=Lactate Threshold, Z5=VO2 Max, Z6=Anaerobic Capacity, Z7=Neuromuscular Power) but T2G only emits **5 zones** (Z1-Z5). The mapper writes a **5-element** `powerZones.zones` array (Z1-Z5 only); pre-existing Z6/Z7 entries on the persisted profile are NOT preserved on a successful sync — they are replaced by the 5-band write. Rationale: T2G is the source of truth at sync time; preserving Z6/Z7 from defaults would silently mix two zone-method sources (T2G's 5-band Coggan-derived bands plus Kaiord's hardcoded Z6/Z7 percentages) and produce a Profile Manager view where the user can't tell which bands are user-configured vs T2G-imported. The Profile Manager renders whatever length array it receives; if a future UX change requires a fixed 7-band display, that's a separate issue.

This decision applies ONLY to cycling power zones — HR (5 bands) and pace (5 bands) match T2G 1:1 and have no count mismatch.

A test (`sync-zones.test.ts` 4.7q) asserts: GIVEN a profile with `cycling.powerZones.zones = [Z1..Z7 manual entries]`, WHEN `syncZones` runs against a T2G payload with full Z1-Z5 power bands, THEN the post-sync `cycling.powerZones.zones` SHALL have exactly 5 entries (Z1-Z5 from T2G); Z6 and Z7 SHALL NOT survive the sync.

**Why pre-named bands and not just `{ min, max }` pairs:** the profile schema already requires the `name` field; the conflict dialog (and the user's eye) reads names not just numbers; aligning with the existing schema avoids a Zod migration.

**Why write the WHOLE array atomically and not per-band:** band 3 alone makes no sense without bands 1, 2, 4, 5 — a partial write would leave the Profile Manager rendering a broken table. The conflict policy still operates at band granularity for the dialog (each disagreeing band is its own row), but the persisted profile mutation is a full `zones: [Z1, Z2, Z3, Z4, Z5]` replace when the user accepts even one band's incoming value (with rejected bands keeping their pre-sync value in the merged array).

### D-FB4: Conflict policy at band granularity, full-array commit

Conflict detection compares each Z-band's `{ minBpm, maxBpm }` (or power / pace equivalents) against the persisted profile's same-zone band. Three states per band:

| Persisted band state              | Action                                                                |
| --------------------------------- | --------------------------------------------------------------------- |
| Empty (`zones=[]` or zone absent) | Write the full T2G array silently and include each band in `applied`. |
| Same as T2G                       | No-op (the band's row is omitted from `conflicts`).                   |
| Different from T2G                | Include in `conflicts` (NOT written by `syncZones`).                  |

`commitConflictResolution` then merges per the user's per-row decisions:

- If ANY band of `{ heartRateZones | powerZones | paceZones }.<sport>` is accepted, the full T2G array is written (with the user's pre-sync values restored for rejected bands).
- If ALL bands of that sport's table are rejected, no write happens.

**Why merge instead of full-replace on accept:** preserves the user's manual tweaks to specific bands while accepting the coach's update to the rest. Cleaner than the alternative ("you accept this band? then the whole table comes from T2G").

**Why not full-replace:** if the user accepts Z4 (the threshold band) but rejects Z1 (their custom recovery), the full-replace path silently overwrites Z1, defeating the point of per-row review.

### D-FB5: FieldKey union growth + label map convention

`FieldKey` extends from 7 logical keys to a flat union with band-level entries:

```ts
| `${'cycling'|'running'|'swimming'}.heartRateZones.z${1|2|3|4|5}.${'minBpm'|'maxBpm'}`
| `cycling.powerZones.z${1|2|3|4|5}.${'minPercent'|'maxPercent'}`  // FTP-relative %
| `${'running'|'swimming'}.paceZones.z${1|2|3|4|5}.${'minPace'|'maxPace'}`  // seconds
| ...existing 7 threshold keys
```

The static label map in `field-labels.ts` gains entries like:

```ts
"cycling.heartRateZones.z2.maxBpm": "Cycling HR Z2 max",
"cycling.powerZones.z4.maxPercent": "Cycling Power Z4 max",
```

**Why a flat union and not nested `{ sport, kind, band, bound }` objects:** the dialog is keyed on `FieldKey` strings throughout (the testid `zones-conflict-row-${field}` is the load-bearing example). Going nested would force a refactor of every consumer. Strings are cheaper.

**Why static labels and not derived (e.g., `Sport HR Zone N max`):** project rule from the original change — labels MUST come from a static SPA-side map, NEVER from T2G strings, because the dialog renders them as React children and labels-from-T2G-strings would re-introduce an XSS vector even though React escapes by default. Static-only is the load-bearing invariant.

### D-FB6: Power zones stored as `{ minPercent, maxPercent }`, not `{ minWatts, maxWatts }`

The existing `powerZoneSchema` is FTP-relative (Coggan-style) — values are percentages of FTP. T2G emits absolute watts (e.g., Z1 111-149 W with FTP=268). The mapper converts: `minPercent = round(minWatts / ftp * 100)`, same for `maxPercent`.

**FTP source for the conversion (load-bearing):** the watts→% conversion uses **`payload.paces.cycling.z4Upper` (T2G's view of FTP)** as the divisor, NEVER the persisted profile's `cycling.thresholds.ftp`. Rationale: the bands are a snapshot of T2G's view of the athlete's training zones; mixing T2G watts with the user's manually-entered FTP would produce nonsensical % (e.g., T2G Z4 240W with persisted FTP=200 would round to 120% Z4). When the user has a manual-FTP conflict, the conflict dialog still surfaces FTP as ITS OWN row; the power bands convert against T2G's FTP regardless of whether the user accepts or rejects the FTP scalar conflict.

**Why not the persisted FTP:** the persisted FTP may be stale (older test) or manual (user override); pairing T2G's watts bands with the user's FTP would cross sources and silently distort the % values. The bridge contract is "T2G is the source of truth for the bands at the moment of sync".

**FTP-absent guard:** if `payload.paces.cycling.z4Upper` is absent OR zero (no FTP test result for the athlete), the cycling power band write is SKIPPED entirely (logged at info level). No partial conversion.

**Display-watts divergence (intentional UX subtlety):** the persisted profile stores `minPercent`/`maxPercent` derived from T2G's z4Upper. When the Profile Manager renders these as absolute watts ("Z4: 240-268 W"), it uses the **persisted** `cycling.thresholds.ftp` as the multiplier — NOT T2G's z4Upper. If the user has rejected the FTP scalar conflict (keeping their persisted FTP=200), the displayed watts will be `200 * 90% = 180W` for Z4 lower, NOT T2G's reported 240W. This divergence is by design: the FTP scalar conflict row surfaces the disagreement; once the user has explicitly chosen "keep persisted FTP", the displayed-watts derivation against persisted FTP is the consistent semantics. If the user later accepts the FTP conflict, the displayed watts re-converge with T2G's reported numbers without any further sync.

Verified by tasks.md task 4.7t (unit test against the render helper at `src/lib/profile/zone-display-watts.ts`).

**Why convert to %:** keeps the schema invariant (Profile Manager renders Z1 as "55-56% FTP" today; switching to absolute watts is a separate UX change). Round-trip: `displayedWatts = ftp * pct / 100` — the user sees the same numbers.

**Why not store both (% and W):** schema bloat. The single-source-of-truth principle says store one; derive the other.

### D-FB7: Pace zones stored as integer seconds per the existing `paceZoneSchema` (lower/upper inversion)

The existing `paceZone.minPace` / `maxPace` is `number ≥ 0` with a `unit: "min_per_km" | "min_per_100m"` discriminator. The mapper converts T2G's `{ min, sec }` to integer seconds per the unit (`min * 60 + sec`), the same conversion used for the threshold scalars in the original change.

**Inversion rule (load-bearing):** T2G's `lower` is the SLOWER edge of a pace band (larger seconds-per-km — e.g., `{ min: 4, sec: 44 }` → `284 s/km`) and `upper` is the FASTER edge (smaller seconds-per-km — e.g., `{ min: 4, sec: 10 }` → `250 s/km`). This is the natural T2G HTML convention. Kaiord's `paceZoneSchema` follows the opposite numeric convention: `minPace` is the smaller numeric (faster), `maxPace` is the larger numeric (slower). The mapper therefore assigns:

- `minPace = secondsOf(payload.<sport>.zN.upper)` (FASTER edge)
- `maxPace = secondsOf(payload.<sport>.zN.lower)` (SLOWER edge)

This is NOT an `if (a > b) swap` — the assignment is unconditional. The bridge intentionally preserves T2G's `lower`/`upper` naming (matches the HTML form names). The semantic flip from "edge label" (lower-pace = slower) to "magnitude label" (minPace = smaller seconds) happens in one place, the SPA mapper, and is asserted by the spec scenario "Pace minPace/maxPace invariant holds across all bands".

Tests assert the stored seconds for representative bands AND the inversion invariant (`minPace <= maxPace` for all persisted bands).

### D-FB8: `bpm_rest` allowlist addition is data-only, no consumer

`payload.physiological.bpmRest` is added to the bridge parser allowlist alongside `weight` and `bpmMax`. The SPA mapper does NOT read it in this change — Kaiord has no consumer field for resting HR yet. The reason to flow it through now: a future change ("Karvonen for non-T2G profiles", or the long-deferred `kaiord-zone-derivation` if it ever returns) will need it, and adding the field through the privacy-surface review now is cheaper than a separate one-line privacy review later.

The redaction key-walk test re-asserts the forbidden-set is unchanged after this addition (the new field's name `bpmRest` does not collide with any forbidden key — `bpm_rest` is the DOM name; the parsed key is `bpmRest`).

## Risks / Trade-offs

| Risk                                                                                                 | Mitigation                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FieldKey` union grows from 7 to ~50+ entries — schema bloat, slower autocomplete, larger label map. | Acceptable: TypeScript handles 100+-member string unions without measurable compile cost. Label map is generated by sport × kind × band cross-product (helper at the top of `field-labels.ts` keeps the source size linear, not quadratic).                                                                               |
| Conflict dialog with 50 potential rows is overwhelming.                                              | v1 ships raw per-band rows. Rows are grouped visually by sport-kind in the dialog (insertion order respects this). Heuristic collapse ("all Z1-Z5 of cycling.heartRateZones changed → single 'Accept cycling HR table' row") is a documented follow-up, NOT in scope. Cancel-dialog still works (silent fills committed). |
| User toggles T2G's `Auto-calculate` switch on/off → Generic bands recompute from changed maxHR.      | Same staleness window as today's threshold sync (10 min auto-sync gate + manual sync button). The conflict dialog will surface every recomputed band as a row on next sync, giving the user explicit accept/reject — not silent.                                                                                          |
| Cycling Specific bands today equal Generic bands (T2G default for one configured sport).             | Mapper picks Specific anyway per D-FB1; result is identical numbers — no conflict surfaces, profile gets the bands. If the coach later differentiates cycling from generic, the Specific override flows through cleanly.                                                                                                  |
| Power-zone % conversion rounds → 1-2W drift between displayed and Kaiord-stored bands.               | Round-trip tolerance is the same one Kaiord already accepts for power (`±1W or ±1% FTP` per `docs/krd-format.md` round-trip tolerances). Test with FTP=268, Z4 240-268 W → `90-100%` after rounding → `~241-268 W` displayed back; within tolerance.                                                                      |
| User's Profile Manager already has manually-entered bands → entire table flagged as conflict.        | Per-band granularity exposes this clearly: each band is its own row. User can accept the coach's update or keep their manual values per band. The merge in `commitConflictResolution` (D-FB4) ensures rejected bands keep their pre-sync values.                                                                          |
| Backwards compatibility for downstream callers reading `payload.hrZones.cycling.z4Upper`.            | Parser keeps emitting the convenience field (D-FB2). Bridge unit tests pin both the new shape AND the legacy field to prevent regressions.                                                                                                                                                                                |

## Migration Plan

This change is **forward-compatible** at the data layer — no Dexie schema bump, no profile-version bump. New writes populate `sportZones.<sport>.{heartRateZones,powerZones,paceZones}.zones` in slots that were already optional and present (just empty arrays for users who never edited them). Older builds reading a profile written by this change see populated arrays and render them; no breakage.

Bridge upgrade order:

1. **PR 1** ships the parser shape change. Older SPA builds keep reading `z4Upper` (still emitted); they ignore the new band fields.
2. **PR 2** ships the SPA mapper extension. New SPA builds read the band fields when present, fall back to the legacy `z4Upper` only path if the user is on an older bridge that still emits the original shape (the parser is forward-compatible: new shape includes `z4Upper`, but if the bridge is ancient and only emits `z4Upper`, the SPA mapper handles that gracefully — the band-array writes simply don't fire for that sport-kind).
3. **PR 3** ships the FieldKey + label-map + dialog test extension.
4. **PR 4** archives the change and syncs canonical specs.

Rollback strategy: revert PRs in reverse order. Each PR is independently revertable because the data path is forward-compatible. The Profile's existing `sportZones.<sport>.heartRateZones.zones` arrays (if populated by this change) stay valid even if the writer is rolled back — the user can clear them via the Profile Manager UI as a manual recovery if needed.

## Open Questions

- **Q1: Naming convention for the ~50 new label-map entries.** Proposed format: `"Cycling HR Z2 max"` (Sport + Kind-abbrev + Z + bound). Alternatives: full sport names, no abbrev. Decision: short form, deferred to PR 3 author at label-map time. Document the chosen convention in PR 3's commit message.
- **Q2: Does the conflict dialog need a "select all rows for this table" affordance?** Defer until users complain. v1 ships with per-row accept/reject only; if real-world conflicts produce 30+ rows the user has to click through, file a follow-up.
- **Q3: Should `bpm_rest` be added to a Kaiord profile field now or later?** Defer. The data flows through the bridge → mapper but is not persisted in v1. Adding `profile.restingHeartRate?: number` is a one-line schema change; do it when the first consumer exists.
- **Q4: How do users restore Kaiord's 7-zone Coggan defaults (Z6=Anaerobic Capacity, Z7=Neuromuscular Power) after T2G sync has replaced them with T2G's 5-band table?** Defer. T2G is the source of truth at sync time per D-FB3, so the 5-band write is the intentional outcome. If the user later disables T2G sync OR wants Z6/Z7 back without unlinking T2G, the path is: edit the Profile Manager manually and append the missing bands. No automated restoration is in scope. Manually-added Z6/Z7 entries will render against the persisted FTP via the same display-watts derivation as T2G-imported bands (per D-FB6), so the post-recovery view stays internally consistent. If field reports show users want Z6/Z7 back without manual editing, file a follow-up "restore-zone-defaults" capability — likely a one-button "reset to 7-zone Coggan defaults" affordance on the Profile Manager UI, NOT a sync-time decision.
