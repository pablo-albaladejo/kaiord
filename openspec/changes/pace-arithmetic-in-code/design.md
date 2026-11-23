## Context

The hub decision "El modelo nombra la zona, el código pone los m/s" (#1503)
settled the pattern for zones: the model emits a symbolic reference, code
resolves it with the same table the consumer uses, and a reference code cannot
resolve stays visibly unresolved instead of being invented. This change
applies it to every other number in a Workout.

## Decisions

### D1. Literal fields, not strings to parse and not totals

The model writes each part of a number in the field of its unit
(`{ minutes: 3, seconds: 30 }`, `{ kilometers: 1.5 }`). Summing parts is the
smallest arithmetic there is, but it is still arithmetic, and it is exactly
where `1h15'` becomes 4350. Paces are the exception: a clock string
(`"4:30"`) is copied character by character and parsed in code
(`coach-clock.ts`, which also reads `4'30"`), because four numeric fields per
pace range would bloat a schema already kept flat for Anthropic's
structured-output limits.

Rejected: a single free-text literal per step parsed by code (moves the
interpretation into a regex), and keeping m/s with a tolerance in the eval (a
tolerance is what let a model's rounding pass before).

### D2. Refuse m/s from the model

No coach writes metres per second, so a pace in m/s is computed by
construction and is refused with a message naming the literal forms. The cost:
a coach who literally writes "3.5 m/s" now goes through a retry and fails.
That case was not found in any benchmark or Train2Go sample. Durations in
seconds stay accepted (`90 s` is a literal), so a model that still sums
minutes cannot be caught by validation; the `numbers` dimension and the live
record are what measure it.

### D3. Rounding

m/s to 0.001 (the precision `resolve-zone-targets` already used); metres and
seconds to 0.001 to drop floating-point noise only (a mile is 1609.344 m).
Over a kilometre at 15:00/km, 0.001 m/s is 0.4 s, inside the ±1 s round-trip
tolerance.

### D4. References map to zones in code

`threshold` and `half_marathon` → Z4, `marathon` → Z3, `10k` → span Z4–Z5,
`5k` → Z5, read off the App's pace model (bounds as fractions of threshold
speed: Z3 90–95%, Z4 95–102%, Z5 above 102%). The table is a calibration
choice and lives in one place (`resolve-references.ts`). With no pace table
the zone becomes `open`, as for any unresolved pace zone.

### D5. Fill counts whole cycles

`fill` replaces rule 11's "number of whole cycles that fit". Every step of a
filled block must be timed; a fill shorter than one cycle is refused.

### D6. push_to_garmin waits for the card

#1578 auto-approved it. That contradicted the `spa-ai-chat` requirement (never
amended), the GLOSSARY's Tool definition, the landing's registered claims and
the system prompt the model reads. The auto-approve path is removed; the
existing pending-action card (`PushToGarminSummary`) already renders a push.
If the owner prefers #1578's behaviour, the spec, the GLOSSARY, the system
prompt and three landing claims (English and Spanish) must change with it.

## Risks

- Until the maintainer re-records, the committed replay is red (stale prompt,
  uncovered cases). Nothing in this change claims a live result.
- A real model may keep emitting seconds or m/s from habit; m/s is refused and
  retried, seconds pass through. The live record measures both.
