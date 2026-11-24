## ADDED Requirements

### Requirement: Each extension section states what checking the connection costs

The Tanita, Train2Go, TrainingPeaks, Garmin and WHOOP sections of the privacy
policy SHALL state what a Session check sends and what it hands to the Kaiord
App, from what the code does: Tanita sends a `HEAD` of the export and
downloads no measurement; Train2Go asks who is signed in and passes on only
whether the athlete is, the profile and the coach's name and notes travelling
only to the connect flow and the popup; TrainingPeaks and Garmin send no
request and mint no token; the WHOOP identifier is returned only when the
Kaiord App is about to import. `check-privacy-policy` SHALL hold a rule for the
Tanita and TrainingPeaks checks, anchored to their sections, with the section
rule floors unchanged.

#### Scenario: The Tanita check stops being disclosed

- **WHEN** the Tanita section stops saying the check sends a `HEAD` that returns no measurement
- **THEN** `check-privacy-policy` SHALL fail on "Tanita session check by HEAD, downloading nothing, disclosed"

#### Scenario: The TrainingPeaks check stops being disclosed

- **WHEN** the TrainingPeaks section stops saying the check asks TrainingPeaks nothing and mints no token
- **THEN** `check-privacy-policy` SHALL fail on "TrainingPeaks connection check minting no token disclosed"

## MODIFIED Requirements

### Requirement: Kaiord for Tanita section states what the extension does

The privacy policy SHALL have a `## Kaiord for Tanita Extension` section,
registered in `claims/tanita.json`. It SHALL state that the extension uses no
password and cannot read the `TANITASESS` cookie (no `cookies` permission);
that it sends read-only requests only to
`https://mytanita.eu/en/user/export-csv`, a `GET` that returns the athlete's
whole body-composition history and a `HEAD` that checks the connection; that
it hands the export to the Kaiord App unparsed; that each popup open, Refresh,
and session check sends only the `HEAD`, downloads no measurement and keeps
only whether the athlete is signed in; that `chrome.storage.local` holds
only the popup's health stamps and the theme preference; that it injects no
content script on `mytanita.eu`; and that it has no telemetry.

#### Scenario: The check is no longer disclosed

- **WHEN** the Tanita section stops saying that checking the connection sends only a `HEAD` and downloads nothing
- **THEN** `check-privacy-policy` SHALL fail on "Tanita session check by HEAD, downloading nothing, disclosed"

#### Scenario: The storage disclosure is dropped

- **WHEN** the Tanita section stops naming what `chrome.storage.local` holds
- **THEN** `check-privacy-policy` SHALL fail on "Tanita chrome.storage.local contents disclosed"

### Requirement: The TrainingPeaks section discloses every write

The `## Kaiord for TrainingPeaks Extension` section of the privacy policy
SHALL disclose that the extension adds each Workout the athlete sends from the
Kaiord App to their TrainingPeaks calendar, that it cannot delete anything in
TrainingPeaks or change a Workout already there, that it accepts a weight
write the Kaiord App does not send today, that a check of the sign-in asks
TrainingPeaks nothing and mints no token, and the `read:body`, `write:body` and
`write:workouts` capabilities. `check-privacy-policy` SHALL hold one rule per
disclosure, anchored to that section.

#### Scenario: The Workout write is removed from the section

- **WHEN** the sentence disclosing the Workout write is removed from the
  TrainingPeaks section
- **THEN** `check-privacy-policy` SHALL fail on that rule alone
