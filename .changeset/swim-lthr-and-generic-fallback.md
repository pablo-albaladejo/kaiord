---
"@kaiord/workout-spa-editor": patch
---

Fix LTHR-scalar sync from Train2Go for sports without a Specific HR block.

Two coupled issues:

1. **Swimming LTHR was never written.** The mapper only emitted `cycling.thresholds.lthr` and `running.thresholds.lthr`; `swimming.thresholds.lthr` had no corresponding `FieldKey`, no read/write accessor, no field label, and was missing from the `IncomingMap`. After sync, the LTHR field on the Swimming tab stayed empty even when Generic HR was configured upstream.

2. **Cycling/running/swimming LTHR scalars didn't apply the Specific → Generic → skip fallback** that the band tables already use (D-FB1). The mapper read `payload.hrZones.{sport}.z4Upper` directly, so on profiles with only the Generic Karvonen block configured (the common shape — Pablo's account has cycling Specific only, running and swimming inherit Generic) the running LTHR field stayed empty too.

The fix:

- Adds `swimming.thresholds.lthr` to `ThresholdFieldKey`, with read/write cases in `sync-zones-threshold-fields.ts`.
- Adds the corresponding label ("Swimming LTHR") and unit ("bpm") to `field-labels.ts`.
- Refactors `setThresholdScalars` to resolve LTHR for all three sports through a new `resolveLthrScalar` helper that mirrors `resolveHrBands`' Specific → Generic → undefined chain, but keys on `z4Upper` directly (the legacy payload shape that has only `z4Upper` without the full Z1-Z5 bands still resolves correctly).

Behavior summary post-fix on Pablo's account (cycling Specific = Generic = 107-187, no running/swimming Specific):

- Cycling LTHR → 174 ✓ (unchanged: Specific block has z4Upper)
- Running LTHR → 174 ✓ (was empty: Generic-fallback now fires)
- Swimming LTHR → 174 ✓ (was empty: new field + Generic-fallback)
