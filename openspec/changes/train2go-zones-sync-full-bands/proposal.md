## Why

The shipped `train2go-zones-sync` capability extracts only one number per sport (the threshold at z4Upper) and writes it to the profile. But Train2Go's `/user/details` page already exposes the **full Z1-Z5 band table** for HR, power, and pace — pre-computed by T2G via Karvonen %FCR, Coggan, and VAM. After the first sync, Pablo's Profile Manager shows `FTP=268W` and `cycling LTHR=174 bpm` correctly but the actual zone bands stay at `0-0`, because Kaiord has no zone-derivation logic of its own. The user expected the bands to populate alongside the threshold ("the FTP came through, why didn't the FTP zones?"), and confirmed the right policy out loud while inspecting the live HTML: _"si hay específicas, tomamos las específicas, sino las generales"_.

Pulling the bands directly from T2G — instead of building a derivation engine in Kaiord — collapses two unrelated future projects (a Coggan/Karvonen derivation library + a method-picker UI) into a one-PR mapper extension and is closer to the "Train2Go is the source of truth" framing of the original change.

## What Changes

- **Parser** (`@kaiord/train2go-bridge`) emits the full Z1-Z5 bands per zone block, not just the threshold value at `z4Upper`:
  - `payload.hrZones.generic = { z1: { lower, upper }, …, z5: { lower, upper } }` (NEW; was absent — only the per-sport blocks were extracted before).
  - `payload.hrZones.cycling | running` extended from `{ z4Upper }` (today) to `{ z1..z5: { lower, upper }, z4Upper }` (full-band shape).
  - `payload.hrZones.swimming` is **NEW** (the shipped parser at `packages/train2go-bridge/parser.js` does not emit a swimming HR block — only cycling and running). The new block has the same `{ z1..z5: { lower, upper }, z4Upper }` shape and is emitted only when `heart-rate-zone-swimming` is present in the upstream HTML.
  - `payload.paces.cycling = { z1..z5: { lower, upper } }` for watts (single integer per bound).
  - `payload.paces.running | swimming = { z1..z5: { lower: { min, sec }, upper: { min, sec } } }` for min:sec/km or min:sec/100m.
  - `payload.physiological.bpmRest` (NEW; previously dropped by allowlist) — used as a future input for non-T2G Karvonen, no consumer in this change.
- **SyncZones mapper** (`@kaiord/workout-spa-editor`) gains a per-sport HR fallback chain: prefer `payload.hrZones.<sport>` when present, else `payload.hrZones.generic`. Writes the full `HeartRateZone[]`, `PowerZone[]`, `PaceZone[]` arrays to `profile.sportZones.<sport>.{heartRateZones,powerZones,paceZones}.zones`. Threshold scalars (FTP, LTHR, threshold pace, CSS) keep coming from each block's z4Upper — `FieldKey` set unchanged for those.
- **Conflict policy stays per-band**: each Z-band that disagrees with the persisted profile becomes its own row in the existing `ZonesConflictDialog`. Empty bands are silent-filled. No new dialog, no new orchestrator.
- **`FieldKey` union grows** from 7 logical keys to ~50+ band-level keys (`cycling.heartRateZones.z2.maxBpm`, etc.). Static label map in the dialog gains the new entries; the dialog's render path (no `dangerouslySetInnerHTML`, static labels keyed on `FieldKey`) is unchanged.
- **Privacy surface**: parser allowlist extended to all band fields and `bpm_rest`. Recursive redaction key-walk test re-asserts no forbidden field leaks. Privacy-surface golden's `train2go-bridge.allowed_paths` count stays at 5 (no new endpoints). Store-listing copy updated to mention "zone tables (Z1-Z5)" alongside the existing thresholds list, and explicitly re-confirms the deny-list (gender, birthday, fat%, IMC, smoker, coach contact details).
- **Cancels** the previously-considered `kaiord-zone-derivation` capability. T2G already does the math; Kaiord trusts it.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `train2go-bridge`: parser allowlist + `parseDetailsHtml` shape extended for full Z1-Z5 + generic block + `bpm_rest`.
- `spa-train2go-extension`: `ZonesPayload` type extended; `CoachingTransport.readZones` payload shape grows; the orchestrator's per-FieldKey conflict surfacing covers band-level keys.
- `train2go-zones-sync`: per-band conflict policy (rows per Z1-Z5 band that disagrees), per-sport HR fallback chain (specific → generic), full-table writes to `profile.sportZones.<sport>.{heartRateZones,powerZones,paceZones}`. Threshold-level FieldKey set unchanged.

## Impact

**Affected packages:**

- `@kaiord/train2go-bridge` — parser shape change, allowlist extension, store-listing copy, privacy-surface fixture entry update.
- `@kaiord/workout-spa-editor` — `ZonesPayload` Zod type extension, mapper fallback chain, profile write paths for zones arrays, `FieldKey` union growth, conflict-dialog label-map entries, unit tests + e2e fixture-derived assertions.

**Privacy / store impact:**

- `scripts/fixtures/bridge-privacy-surface.json` — no path-count change (still 5); the fixture's `extracted_fields` array (or equivalent comment) gets an explicit "zone bands" mention so the listing copy and the surface stay aligned.
- `packages/train2go-bridge/store-listing.md` — broadened-read paragraph extended to enumerate Z1-Z5 bands.
- No new Chrome permissions strings; surface widens within the existing `host_permissions: app.train2go.com/*`. The extension's `externally_connectable.matches` set, action-icon manifest, and content-script registration are unchanged from a CWS-review perspective — the only diff is what the parser emits, all within the already-allowlisted `/user/details` path.

**No public API breakage.** Backwards-compat for downstream consumers of `payload.hrZones.<sport>.z4Upper` / `payload.paces.<sport>.z4Upper`: the mapper computes those scalars from the new band shape so the existing FieldKey writes (`cycling.thresholds.ftp`, etc.) keep working byte-identically. Profiles persisted by older builds remain readable; the new band arrays write into existing `sportZones.<sport>.{heartRateZones,powerZones,paceZones}.zones` slots that were already optional.
