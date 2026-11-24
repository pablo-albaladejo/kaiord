## ADDED Requirements

### Requirement: Garmin uploads only the shapes the Kaiord App builds

Kaiord for Garmin SHALL send a write only with the body the Kaiord App's
Connector builds for that path, and SHALL refuse anything else with
`Request not allowed` and no request sent:

- `fit-file` (the body-composition upload): a FIT file of at most 4 KB whose
  header and file CRCs are valid and whose messages are exactly one
  `file_id` of file type 9 (weight), as
  `krd-to-weight-scale-fit.converter.ts` builds it, then one `weight_scale`
  message. An activity file, or a FIT file of any other type, is refused.
- `workout`: the closed shape `@kaiord/garmin`'s writer emits: named keys of
  Garmin's own step, target and condition types only, one segment, at most
  100 steps and at most 50 per repeat, a name of at most 255 characters and
  step notes of at most 256.

#### Scenario: An activity file is refused

- **WHEN** the Kaiord App sends `fit-file` with a FIT activity file
- **THEN** the extension answers `Request not allowed`, `retryable: false`, and sends nothing to Garmin

#### Scenario: The App's body-composition file is uploaded

- **WHEN** the Kaiord App sends the FIT file its weight encoder builds
- **THEN** the extension uploads it

#### Scenario: A workout with an unknown key is refused

- **WHEN** a step carries a key the writer never emits, a string over its bound, or more than 100 steps
- **THEN** the extension refuses it and sends nothing

### Requirement: The legacy ping never implies a sign-out it did not verify

The `ping` answer SHALL carry, in the fields a protocol-1 Kaiord App reads
(`gcApi`), no `needsReauth` unless Garmin verified the sign-out, so an App tab
opened before the update never shows "signed out" for a check that asked
nothing.

#### Scenario: An older App tab reads the new ping

- **GIVEN** the extension holds no Garmin access
- **WHEN** an App tab opened before the update sends `ping`
- **THEN** the answer is `ok: true` with `session: "not-checked"`, `gcApi.ok: false` and no `needsReauth`
