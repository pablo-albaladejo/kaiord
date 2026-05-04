---
"@kaiord/workout-spa-editor": minor
---

SPA mapper now consumes the new full-Z1-Z5-band Train2Go payload shape and writes the full HR / power / pace zone arrays to the persisted profile. Band-level entries flow through the existing `IncomingMap` / `reconcile` / `commitConflictResolution` pipeline as ~60 new band-level `FieldKey` entries.

**HR fallback chain** (D-FB1): per sport, `payload.hrZones.<sport>` (Specific) wins when present; `payload.hrZones.generic` (Karvonen) is the fallback; otherwise the sport's HR bands are not touched. A triathlete with only cycling Specific configured gets running and swimming HR bands populated from the Generic block.

**Cycling power conversion** (D-FB6): watts → %FTP via `Math.round(watts / z4Upper * 100)`. The divisor is `payload.paces.cycling.z4Upper` (T2G's view of FTP), NEVER the persisted profile's FTP — mixing sources distorts %. When `z4Upper` is absent or zero, cycling power band writes are skipped entirely.

**Pace inversion** (D-FB7): T2G `lower` is the SLOWER edge (larger seconds) → maps to `maxPace`; T2G `upper` is the FASTER edge (smaller seconds) → maps to `minPace`. The Kaiord `minPace <= maxPace` invariant follows from this unconditional assignment.

**Power-zone count mismatch** (D-FB3): Kaiord's `DEFAULT_POWER_ZONES` defines 7 zones (Z1=Active Recovery..Z7=Neuromuscular Power) but T2G emits 5. The mapper writes a 5-element array; pre-existing Z6/Z7 entries are NOT preserved (T2G is the source of truth at sync time per the design).

**Per-band conflict policy**: when the persisted sport-kind table is empty (zones array missing OR length === 0), all bands are silent-fills. When the table is populated, per-band conflicts surface as `{<sport>.<kind>.zN.<bound>}` rows in the existing dialog. `commitConflictResolution` accepts band-level decisions; merge: accepted bands take T2G; rejected bands keep pre-sync values.

**bpmRest flow-through-but-not-persisted** (D-FB8): the new `physiological.bpmRest` field flows through the validated payload but the SPA mapper does NOT write it to the profile in this change — Kaiord has no `restingHeartRate` consumer field yet. Pinned by a deep-diff test.

UI label-map changes for the new ~60 band-level keys are auto-generated at module-load time from a hardcoded cross-product (`Cycling HR Z2 max`-style) — never interpolates an external string. PR 3 polishes the label format and adds dedicated dialog tests; this PR just keeps the dialog rendering correct values for the new keys.

Type: `ZonesPayload` Zod schema extended with `physiological.bpmRest`, `paces.cycling.z1..z5: { lower, upper }`, `paces.{running,swimming}.z1..z5: { lower:{min,sec}, upper:{min,sec} }`, `hrZones.generic.z1..z5`, `hrZones.{cycling,running,swimming}.z1..z5`. Backwards-compat: existing convenience scalars (`z4Upper`, `z5Lower`) are preserved; older bridge payloads with only `z4Upper` continue to work for threshold-scalar writes.

12 new unit tests in `sync-zones-bands.test.ts` cover the HR fallback chain, watts→%FTP, pace inversion, re-sync stability, bpmRest non-persistence, power-zone count mismatch, and band-level merge.
