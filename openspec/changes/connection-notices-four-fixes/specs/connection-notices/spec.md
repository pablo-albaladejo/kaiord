## ADDED Requirements

### Requirement: Four fixes, one wording each, defined once

The fixes a Connection can offer SHALL be exactly Install, Update, Sign in to
the Platform and Try again, defined once in
`packages/_shared/bridge-core/connection-notices.js` together with one
message and one action per fix in English and Spanish. The message SHALL name
the consequence for the athlete and the Platform; Install and Update SHALL
name the extension "Kaiord for <Platform>"; no wording SHALL say "bridge",
"the Kaiord extension" or "signed out". The Kaiord App SHALL read the wording
through `@kaiord/i18n` (`connectionNotice`) in its active locale, and every
extension popup SHALL load the vendored copy and call
`KAIORD_CONNECTION_NOTICES.noticeFor`, in English until
R-BridgeLocalesEnglishOnly is lifted.

#### Scenario: The App and a popup word one state alike

- **GIVEN** the state "not-answering" on Garmin
- **WHEN** the App and the Garmin popup each render its notice in English
- **THEN** both SHALL read "Garmin is not answering, so you cannot use it in Kaiord right now." with the one action "Try again"

#### Scenario: The App shows the Spanish wording

- **GIVEN** the App's locale is Spanish and Train2Go's state is "outdated"
- **WHEN** the notice renders
- **THEN** it SHALL read "No puedes usar Train2Go en Kaiord hasta que actualices Kaiord for Train2Go." with the action "Actualizar Kaiord for Train2Go"

### Requirement: The notice follows the verified state, never an unverified cause

A Connection's verified state SHALL decide its notice: working, still being
checked, or not checked (the check asked the Platform nothing and the first
real use decides) shows no notice; not installed shows Install; an extension on another
protocol version shows Update; a sign-in the Platform itself refused shows
Sign in to the Platform; anything else — no answer, a timeout, a server error,
an extension that did not reply, a state the table does not know — SHALL show
"<Platform> is not answering" with Try again. A failed or unanswered check
SHALL NOT produce "signed out". The App SHALL read each extension's answer
through one adapter (`application/connections/session-outcome.ts`) and every
probe SHALL read the protocol version from the envelope before the session.

#### Scenario: An outdated extension is offered Update

- **GIVEN** an extension answering its Session check in another protocol version, even with an unknown-action error
- **WHEN** the App classifies the answer
- **THEN** its state SHALL be "outdated" and its notice Update, never Sign in

#### Scenario: A failed Garmin read is not a sign-out

- **GIVEN** Garmin's ping reports a read that failed with no refusal from Garmin
- **WHEN** the App and the Garmin popup classify it
- **THEN** both SHALL show the Try again notice and neither SHALL mention signing in or out

#### Scenario: The popup and the card agree

- **GIVEN** a WHOOP extension holding a sign-in with no decoded user id
- **WHEN** the WHOOP popup and the App's WHOOP card render
- **THEN** both SHALL treat the Connection as working and show no notice

#### Scenario: A working Connection shows no notice

- **GIVEN** a Connection whose check succeeded
- **WHEN** any surface renders it
- **THEN** no notice SHALL be rendered

### Requirement: A root guard keeps the fixes single

`scripts/check-connection-notices.mjs` (`pnpm lint:connection-notices`, rule
R-ConnectionNoticesSingleSource) SHALL fail the lint job when the source
holds a fix other than the four, a fix without exactly one message and one
action in each of English and Spanish, or a banned word; when any unit of
text in the App's `en`/`es` dictionaries, its UI source, or an extension's
`_locales` or `popup.js` words one of the fixes, or a fifth one, outside the
source; when a popup does not load the source before `popup.js` or does not
call it; and when a popup names its Platform or sign-in page unlike the App.
An exception SHALL be an exact phrase in an exact place with its reason, and
an exception no longer present SHALL fail.

#### Scenario: A second wording fails lint

- **GIVEN** an App dictionary string "Sign in to Garmin Connect in this browser, then try again."
- **WHEN** the guard runs
- **THEN** it SHALL fail, naming the file and the fix it words

#### Scenario: A fifth fix fails lint

- **GIVEN** the source's fixes extended with "reload"
- **WHEN** the guard runs
- **THEN** it SHALL fail, naming the fixes it found
