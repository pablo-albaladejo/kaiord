## ADDED Requirements

### Requirement: A popup reads only for its own window

An extension's popup MAY read and interpret Platform data only for its own
window, when the athlete opens it, through the extension's closed list of
paths. It SHALL NOT store that data beyond the popup's lifetime and SHALL NOT
hand it to the Kaiord App. Each extension's `background.js` SHALL declare
`POPUP_READS` and `POPUP_READ_SCRIPTS` (possibly empty), and
`scripts/check-bridge-popup-reads.mjs` SHALL fail when a popup read is an
external action, when any other action reaches its code, when it asks for a
path outside `ALLOWED` or fetches without `isAllowed`, or when popup-read data
can reach `chrome.storage`; every storage key an extension writes SHALL be
listed with its reason in `scripts/bridge-popup-reads.vocab.mjs`.

#### Scenario: The App cannot reach a popup read

- **GIVEN** Train2Go's `read-week` is a popup read
- **WHEN** an App-facing action's code calls the popup's weekly reader
- **THEN** `pnpm lint:bridge-popup-reads` SHALL fail naming that action

#### Scenario: The popup stores nothing it read

- **GIVEN** the Train2Go popup has shown this week's figures
- **WHEN** it is opened again
- **THEN** it SHALL read the week again, and `chrome.storage` SHALL hold no weekly rollup it wrote

#### Scenario: A new storage key needs a reason

- **WHEN** an extension writes a `chrome.storage` key not listed for it in the vocab
- **THEN** the guard SHALL fail naming the key

### Requirement: Answers carry no personal field the Connector does not read

Each extension SHALL declare, in its `personal-fields.js`, the personal
fields of its Platform's answers that its Connector does not read, and SHALL
remove them by name from every answer it returns to the Kaiord App, after its
Session secrets: JSON members at any depth and HTML form controls, names
compared in lower case without `_` or `-`. It SHALL keep every field a
Connector reads, SHALL read no value, and SHALL hand an answer with nothing
to remove over byte for byte.

#### Scenario: Train2Go's profile page

- **WHEN** the App asks for `/user/details`
- **THEN** the answer SHALL hold no `gender`, `birthday`, `height`, `fat`, `imc`, `smoker`, `user_notes`, email, phone or address control, and the Connector SHALL read from it the same zones, weight and heart rates as from Train2Go's answer

#### Scenario: Garmin's workout list

- **WHEN** the App lists workouts
- **THEN** no workout SHALL carry its `author`, and the App's Garmin reader SHALL read each to the same KRD

### Requirement: No extension declares surface nothing uses

An extension SHALL NOT list a path, a body schema, a capability or a host
permission that no Connector and no popup uses. Train2Go SHALL list four
paths, without `/api/v2/workplan/tooltip/activity/{id}`; TrainingPeaks SHALL
list no metric write and announce `read:body` and `write:workouts` only;
Garmin's manifests SHALL ask only for `https://connectapi.garmin.com/*` and
`https://sso.garmin.com/*`.

#### Scenario: A weight write is refused

- **WHEN** the App sends TrainingPeaks a `POST …/consolidatedtimedmetric`
- **THEN** the extension SHALL answer `Request not allowed`, `retryable: false`, minting no token and sending nothing

### Requirement: The Spanish Try-again notice names the Platform

The Spanish wording of the Try-again fix SHALL be "{platform} no responde,
así que ahora mismo no puedes usar {platform} en Kaiord.", with no gendered
pronoun, in the master and in every copy `pnpm bridge:sync` writes.

#### Scenario: A Platform that does not answer, in Spanish

- **GIVEN** a browser whose UI language is Spanish and Garmin does not answer
- **WHEN** the Garmin popup opens
- **THEN** it SHALL read "Garmin no responde, así que ahora mismo no puedes usar Garmin en Kaiord." with the action "Reintentar"
