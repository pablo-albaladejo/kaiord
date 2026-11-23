## Why

Review of 2026-11-22, issue #1654 (parent #1670, story 64: "lossless" claimed
only for formats with a Round-trip test). "Lossless" was claimed for formats
no test covered and was withdrawn by #1630. The round-trip validator in the
core compared only a few fields and skipped any value missing on one side, so
a format could drop a field and still pass. Only FIT had a fixture-based
Round-trip test in the CI `round-trip` job.

## What Changes

- **Strict comparison.** `diffRoundTrip(before, after, contract)` in
  `@kaiord/core` compares every leaf of two KRDs: numbers within the first
  matching rule of `DECLARED_TOLERANCES` (declared once, each with its
  reason), everything else exactly. A value lost, added or moved is a
  difference unless the format's contract declares the field.
- **One contract per format.** `FIT_ROUND_TRIP`, `TCX_ROUND_TRIP`,
  `ZWO_ROUND_TRIP` and `GCN_ROUND_TRIP` list, each with its reason, the fields
  the format cannot carry, the fields it fills in, the duration, target and
  intensity kinds it cannot hold and the sports it carries.
- **A Round-trip test per format.** Each adapter's
  `round-trip-contract.test.ts` sends every case `buildRoundTripCases` builds
  from its contract (every duration, target and unit, intensity and sport not
  declared unsupported, a structured workout with repeats, names and notes, a
  pool swim) KRD → format → KRD → format → KRD, and every workout fixture
  format → KRD → format → KRD, through the adapter's real reader and writer.
  It fails on any difference, on a declaration no value needed, and on a kind
  declared unsupported that the format carries after all. The CI `round-trip`
  job gains fit, tcx and zwo shards; its required check keeps its name.
- **Bugs the tests found, fixed.** FIT: `dynastream` was written as
  `dynastreamOem`; a Garmin product name was dropped; workout notes were not
  written to `wktDescription`; a note over the 254 bytes of a FIT string made
  the SDK Encoder refuse the file. TCX and GCN: workout notes were dropped
  although the format has a field for them (TCX `Notes`, GCN `description`).
- **The public statement, per format.** The converters page's "What survives
  a conversion?" and the per-format sections of the fit, tcx, zwo and garmin
  READMEs say, per format, "Round-trip tested" and the fields it cannot
  carry, and are registered claims surfaces proven by those tests. "Lossless"
  stays retired (GLOSSARY.md "Round-trip").
- **A format with no test cannot carry the claim.** `pnpm lint:claims` fails
  on a register entry that says Round-trip and names a format unless it is
  proven by that format's contract test (`scripts/lib/round-trip-formats.vocab.mjs`),
  on one that names a format the SDK does not write (WHOOP, Tanita,
  TrainingPeaks, Train2Go), on a label that names a format, and when a format's
  package has no shard in the CI `round-trip` job.

## Capabilities

### Modified Capabilities

- `krd-format`: Round-Trip Safety is tested per format against a declared
  contract; FIT and GCN round-trip workout-level notes.
- `public-claims`: a Round-trip claim is proven per format.

## Impact

`@kaiord/core` (new public exports, test-utils), `@kaiord/fit`, `@kaiord/tcx`,
`@kaiord/garmin` (bug fixes), `@kaiord/zwo` (test only), `ci.yml`, the claims
guard, the docs converters and KRD pages, four READMEs.
