> Completed: 2026-10-10

# Proposal: Import activity FIT files from the decoder's real message shape

## Why

The `adapter-contracts` coverage matrix declares FIT `recorded_activity` as
`read+write`, but no activity FIT file could be read. A production audit found
it through the SPA, and the same failure reproduces in Node with the full SDK
profile and through the CLI (`kaiord inspect --input Activity.fit`). Every
activity fixture in `test-fixtures/fit/` threw a ZodError:
`timestamp`/`startTime` "expected number, received Date".

The session, lap, record and event schemas and mappers were written against a
hand-built message shape (numeric timestamps, durations in milliseconds,
numeric swim strokes) that the `@garmin/fitsdk` `Decoder` never produces: it
converts `date_time` fields to `Date`, applies the profile scale (durations
come back in seconds) and returns enums as profile names. Every unit test fed
the mappers that hand-built shape, so none of them could see the mismatch.

## What Changes

- `fitDateTimeSchema` (`Date | number`) for `timestamp`/`startTime` in the
  session, lap, record and event schemas; all mappers convert through the
  shared `fitTimestampToIso`.
- Session and lap durations are taken as seconds in both directions; the SDK
  Encoder applies the scale on write.
- A lap's `swimStroke` accepts the decoder's profile name as well as the
  number.
- Records without a timestamp are dropped with a warning.
- Fixture tests read every activity fixture through the real decoder and
  validate the result against `krdSchema`.

## Impact

- `@kaiord/fit` (patch). The CLI and the SPA read activities through the same
  reader, so both start working.
- Spec: `adapter-contracts` gains the requirement below.
