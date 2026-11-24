## ADDED Requirements

### Requirement: A check that asked nothing is neither working nor broken

The Kaiord App SHALL read the typed `session` outcome of a Session check when
the extension sends one, and the extension's own booleans when it does not.
`"signed-in"` SHALL be a live session; `"signed-out"` an inactive one whose
Platform ended it; `"not-answering"` an inactive one with an error and no
sign-out. `"not-checked"` SHALL put a probed source in the `installed` status,
never `attention`, with copy saying the session is known at the first read or
send. A real read or send SHALL go ahead on `"signed-in"` and `"not-checked"`
and stop only on a verified sign-out or a Platform that did not answer.

`tanita-bridge` SHALL stay without a session prober: an extension older than
the cheap check downloads the whole export on `checkSession`, and the App
cannot tell which one is installed before asking.

#### Scenario: A check that asked nothing raises no attention

- **GIVEN** a probed source whose last check answered `session: "not-checked"`
- **WHEN** the Connections page renders its card
- **THEN** the status is `installed` and the detail key is `detail.notChecked`, and no attention banner counts it

#### Scenario: A send goes ahead when nothing was checked

- **GIVEN** Kaiord for Garmin answers `session: "not-checked"`
- **WHEN** the athlete sends a Workout
- **THEN** the App does not stop the send for a missing session; the send itself mints access and finds out
