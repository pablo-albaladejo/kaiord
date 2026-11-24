## Context

ADR 0001 says Round-trip is claimed per format, and only where a test proves
it within the declared tolerances. GLOSSARY.md defines Round-trip as every
value preserved within the declared tolerances and retires "lossless".

## Decisions

- **Compare every leaf, excuse by declaration.** The old comparers skip a field
  missing on either side, so they cannot prove "every value". The new diff
  flattens both KRDs to dotted paths and reports every difference; a contract
  excuses a path pattern (`*` one segment, `**` any) only with a reason.
  Rejected: extending `compareKRDs`, whose tolerance of missing fields is
  public behaviour the CLI and MCP `validate` rely on.
- **Tolerances in one place.** `DECLARED_TOLERANCES` holds the project-wide
  rules (time, distance, power, heart rate, cadence, pace). A target value is
  read by its target's type and unit, so a zone stays exact while watts get
  ±1. Every format uses the same list; none needed a wider one.
- **Unsupported kinds are tested, not skipped.** A duration, target or
  intensity a format cannot hold is left out of the passing cases and sent
  through on its own: the test fails if it comes back intact, so a declaration
  cannot outlive the gap it names. Sports are declared as the carried list;
  every other sport is tested as not carried.
- **Cases are generated from KRD, plus the real fixtures.** The fixtures in
  `test-fixtures/` cover few target and duration types; the generated cases
  cover every one. Each case goes through the format twice, so both
  KRD → format → KRD and format → KRD → format → KRD are compared.
- **FIT workout notes.** The writer still copies workout notes onto a first
  step with none, so a watch shows them (#816), and now also writes
  `wktDescription`. The reader drops the first step's note when it equals the
  description, the copy, and reads the description as the workout notes.
- **Activities.** No writer writes a recorded activity; each contract test
  proves the writer refuses one, and the public text claims no Round-trip for
  activities or health data.
- **The claims rule keys on the format name.** A unit that says Round-trip and
  names FIT, TCX, ZWO/Zwift or GCN/Garmin Connect must be proven by that
  format's contract test. A sentence naming no format ("CI runs the
  round-trip checks") is an ordinary claim.

- **The first read is checked too.** A second trip compares the KRD a
  fixture becomes with the KRD after another trip, so a field the reader drops
  on first read is invisible to it. Each format's `first-read.test.ts` lists
  every value of every workout fixture with a reader of its own (the Garmin FIT
  SDK Decoder, a fast-xml-parser parse, `JSON.parse`) and requires it in the
  KRD after the first read, or declared with a reason (`firstReadReport` in
  `@kaiord/core/test-utils`). Each KRD value answers one source value, so a
  dropped repeat is found; a declaration no fixture needs fails. It found and
  fixed: TCX skipped lap-button, calorie and heart-rate-below steps and read
  a custom heart-rate zone and a cadence target as no target; GCN read a
  `cadence.zone` target as no target, dropped a stroke or equipment given only
  by its id, and stamped the read time over `createdDate`. Declared, because
  KRD cannot hold them: a FIT repeat step's name, a FIT custom heart-rate
  range as a share of maximum (read as bpm), a TCX heart-rate-above end, a
  second GCN target, a GCN repeat inside a repeat, GCN repetition ends,
  strength and multisport GCN workouts. The ZWO fixtures were written by
  Kaiord, so the ZWO claim names KRD → ZWO → KRD.
- **Heart rate as a share of maximum ±0.5 %.** FIT holds it in whole percent,
  so rounding moves it at most half a percent: 0.95 bpm at the maximum of
  190 bpm the GCN test uses, under 1 bpm for any maximum up to 200 bpm. The
  old ±1 % allowed 1.9 bpm. Distance ±1 m and pace ±0.01 m/s stay: FIT holds
  whole centimetres and mm/s, and both are the validator's defaults.
- **The claims rule reads every spelling.** Formats match in any case, by name,
  common name or extension; "lossless", "zero data loss" and "keeps every
  value" count as Round-trip words; a claim naming no format cites every
  format's contract test; ERG, MRC, KRD JSON and any unknown extension are
  refused like the read-only formats.
- **"Round-trip tested", not "lossless" (for the owner to confirm).** Story 64
  says "lossless returns to the public texts, per format". This change keeps
  "lossless" retired and says "Round-trip tested" instead, a deliberate
  departure from the story: GLOSSARY.md defines Round-trip as every value
  within the declared tolerances and lists "lossless" under _Avoid_, and a
  tolerance is not lossless.

## Risks

- The GCN writer now sends a workout `description`. Garmin Connect accepts
  the field on its workout DTO (the output fixtures carry it); a length limit,
  if Garmin has one, is not known.
- The ZWO shard runs every case through the XSD validator; cases run
  concurrently, about 25 s locally.
