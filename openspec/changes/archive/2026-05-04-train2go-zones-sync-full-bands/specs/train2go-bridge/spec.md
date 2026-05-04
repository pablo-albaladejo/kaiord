## MODIFIED Requirements

### Requirement: parseDetailsHtml emits an explicit field allowlist

The `parseDetailsHtml` parser SHALL emit ONLY the fields in the following allowlist:

- `physiological.{weight, bpmMax, bpmRest}`
- `paces.cycling.{z1..z5: { lower, upper }}` (each bound is a non-negative integer in watts) **AND** `paces.cycling.{z4Upper, z5Lower}` derived convenience fields (each equal to the matching band's `upper` / `lower`)
- `paces.{running, swimming}.{z1..z5: { lower: { min, sec }, upper: { min, sec } }}` (min:sec/km or min:sec/100m) **AND** `paces.{running, swimming}.{z4Upper}` derived convenience field (the `{min, sec}` of the band's `upper`)
- `hrZones.generic.{z1..z5: { lower, upper }}` (always emitted when the upstream Generic block is present)
- `hrZones.{cycling, running, swimming}.{z1..z5: { lower, upper }}` per-sport Specific blocks (each block is emitted ONLY when present in the upstream HTML) **AND** `hrZones.{cycling, running, swimming}.{z4Upper}` derived convenience field (the band's `upper`). NOTE: `hrZones.swimming` is NEW in this change — the shipped parser only emitted cycling and running per-sport HR blocks; swimming is added here because the same `heart-rate-zone-swimming` wrapper exists in T2G's HTML and the per-sport extraction generalises uniformly.

Any field present in the page that falls outside the allowlist MUST be discarded at parse time and SHALL NOT appear in the returned `ZonesPayload`. The bridge SHALL include a redaction unit test that walks the parsed object recursively (NOT a substring match against `JSON.stringify(output)` — substring matches false-pass on benign keys that contain a forbidden token like `emailReceiptsEnabled`) and asserts no key in the forbidden set appears at any depth.

The post-change FORBIDDEN SET is the EXACT enumeration below — any change to this set requires a separate privacy-surface review:

```text
FORBIDDEN_KEYS = {
  "gender",
  "birthday",
  "fat",
  "smoker",
  "imc",
  "user_notes",
  "email",
  "records",
  "tests"
}

FORBIDDEN_NESTED_PATHS = {
  "coach.email",
  "coach.name"
}
```

**Comparison semantics (load-bearing for the spec↔test invariant):**

- `FORBIDDEN_KEYS` is a **Set** — the spec↔test invariant compares set-equality (order-insensitive, duplicate-tolerant in source, unique in semantics).
- Keys are **case-sensitive lowercase** (matches the DOM `name=` attribute); the test loader MUST NOT lowercase or normalize before comparing.
- Whitespace in the spec's code block is ignored by the parser (the test loader strips lines and re-tokenizes).
- `FORBIDDEN_NESTED_PATHS` is also a Set; each entry is a dotted path interpreted as "a subobject keyed by the first segment containing a key matching the second segment". The recursive walk MUST handle this two-level check (NOT a substring match against the dotted form).

**Mismatched-case behaviour (consequence):** if a future spec author adds an uppercase or mixed-case key (e.g., `"IMC"` instead of `"imc"`) to either set, the spec↔test invariant SHALL fail noisily — the parser test hardcodes the lowercase DOM-name form and the script comparison is exact-case. Adding both cases (`"imc"` AND `"IMC"`) is FORBIDDEN; there is exactly one canonical case (lowercase, matching the DOM `name=` attribute on T2G's HTML form). The lint failure is the intended forcing function: a spec author trying to relax the case-sensitivity rule MUST first update the parser test (and have that change reviewed).

Note for migration reviewers: this set previously included `bpm_rest`. It is removed in this change because the camelCased emit key `bpmRest` is now allowlisted under `physiological.bpmRest` (see D-FB8). The DOM-level snake_case `bpm_rest` is still NOT a valid emit key (see "bpm_rest is allowlisted and emitted (camelCase only)" scenario); only the camelCased form `bpmRest` is permitted.

Additionally, `imc` is now EXPLICITLY enumerated in `FORBIDDEN_KEYS` for the first time. It was previously listed only in the prose enumeration in the shipped canonical spec (which is human-readable but not machine-comparable); the explicit code-block makes it grep-able for the redaction test. The semantics are unchanged — `imc` was always forbidden and never emitted by the parser — but the test fixture (`packages/train2go-bridge/test/fixtures/details-active.html`) MUST contain a real `<input name="imc">` element for the assertion to be non-vacuous (see task 1.1).

#### Scenario: Redaction — sensitive fields are dropped

- **GIVEN** a fixture HTML containing every key in `FORBIDDEN_KEYS` and every nested path in `FORBIDDEN_NESTED_PATHS` (gender, birthday, fat, smoker, imc, user_notes, email, records, tests, coach.email, coach.name)
- **WHEN** `parseDetailsHtml` runs against the fixture
- **THEN** the returned `output.physiological` SHALL contain ONLY the allowlisted keys (`weight`, `bpmMax`, `bpmRest`)
- **AND** a recursive key walk over the parsed `output` SHALL NOT find any key in `FORBIDDEN_KEYS` at any nesting depth
- **AND** the recursive walk SHALL NOT find any of the `FORBIDDEN_NESTED_PATHS` (a subobject named `coach` with key `email` or `name` MUST NOT appear)

#### Scenario: T2G's 0-indexed DOM names map to 1-indexed payload keys

- **GIVEN** the upstream HTML has `<input name="z3_upper" value="174">` inside `#hrzones-{userId}` for the cycling block (T2G uses 0-indexed `z0..z4` form names for visual zones Z1..Z5; `z3_upper` is therefore the upper bound of visual Z4)
- **WHEN** `parseDetailsHtml` runs
- **THEN** the returned `output.hrZones.cycling.z4.upper` SHALL equal `174`
- **AND** the convenience field `output.hrZones.cycling.z4Upper` SHALL also equal `174`
- **AND** the parser SHALL NOT emit any key prefixed `z0..z4` (the 1-indexed mapping is the parser's contract)

#### Scenario: Generic HR block extraction (full Z1-Z5 bands)

- **GIVEN** the upstream HTML has `<div class="heart-rate-zone heart-rate-zone-generic">` with five `<input name="zN_lower">` / `<input name="zN_upper">` pairs (N=0..4)
- **AND** the values are `Z1: 107-133`, `Z2: 134-147`, `Z3: 148-160`, `Z4: 161-174`, `Z5: 175-187`
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.hrZones.generic` SHALL equal `{ z1: { lower: 107, upper: 133 }, z2: { lower: 134, upper: 147 }, z3: { lower: 148, upper: 160 }, z4: { lower: 161, upper: 174 }, z5: { lower: 175, upper: 187 } }`

#### Scenario: Per-sport HR Specific block emitted only when present

- **GIVEN** the upstream HTML has `<div class="heart-rate-zone heart-rate-zone-cycling">` (Specific cycling) but NO `heart-rate-zone-running` or `heart-rate-zone-swimming` blocks
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.hrZones.cycling` SHALL be a full Z1-Z5 band object
- **AND** `output.hrZones.running` SHALL be absent (the key MUST NOT appear in the parsed object)
- **AND** `output.hrZones.swimming` SHALL be absent

#### Scenario: Swimming HR Specific block — newly emitted when present

- **GIVEN** the upstream HTML has `<div class="heart-rate-zone heart-rate-zone-swimming">` with five `<input name="zN_lower">` / `<input name="zN_upper">` pairs (N=0..4)
- **AND** the shipped parser previously dropped this block (only cycling and running per-sport HR were emitted)
- **WHEN** `parseDetailsHtml` runs against the new build
- **THEN** `output.hrZones.swimming` SHALL be a full Z1-Z5 band object with five `{ lower, upper }` pairs
- **AND** the convenience field `output.hrZones.swimming.z4Upper` SHALL equal the band's Z4 upper bound

#### Scenario: Cycling pace block emits watts as integer bounds

- **GIVEN** the cycling pace form has `<input name="measurement[z3_upper][0]" value="268">` and `<input name="measurement[z4_lower][0]" value="269">` (watts; single integer per bound, NOT min:sec)
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.paces.cycling.z4.upper` SHALL equal `268`
- **AND** `output.paces.cycling.z5.lower` SHALL equal `269`

#### Scenario: Running pace block emits min:sec pairs per band

- **GIVEN** the running pace form has `<input name="measurement[z3_upper][0]" value="04">` and `<input name="measurement[z3_upper][1]" value="10">` (min:sec/km)
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.paces.running.z4.upper` SHALL equal `{ min: 4, sec: 10 }`
- **AND** the convenience field `output.paces.running.z4Upper` SHALL also equal `{ min: 4, sec: 10 }`

#### Scenario: bpm_rest is allowlisted and emitted (camelCase only)

- **GIVEN** the upstream HTML has `<input name="bpm_rest" type="number" value="51">` inside the `#physio-{userId}` block
- **WHEN** `parseDetailsHtml` runs
- **THEN** `output.physiological.bpmRest` SHALL equal `51` (camelCase key)
- **AND** the parsed `output` MUST NOT contain a key named `bpm_rest` (snake_case) at any nesting depth — the DOM snake_case name is camelCased on emit
- **AND** a recursive key walk SHALL assert this absence (the same recursive walk used by the redaction test)
