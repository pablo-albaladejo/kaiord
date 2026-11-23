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

## Risks

- The GCN writer now sends a workout `description`. Garmin Connect accepts
  the field on its workout DTO (the output fixtures carry it); a length limit,
  if Garmin has one, is not known.
- The ZWO shard runs every case through the XSD validator; cases run
  concurrently, about 25 s locally.
