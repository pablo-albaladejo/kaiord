## ADDED Requirements

### Requirement: Each extension is named Kaiord for its Platform

Every extension SHALL be named "Kaiord for <Platform>" (Garmin, Train2Go,
Tanita, TrainingPeaks, WHOOP) by `extName` in `_locales/en` and
`_locales/es`, with the same text in both; its manifests SHALL declare
`"name": "__MSG_extName__"`, `"description": "__MSG_extDescription__"` and
`"default_locale": "en"`. The name SHALL be at most 75 characters and the
description at most 132 in each locale. The popup's title and header SHALL
show that name.

#### Scenario: A Spanish browser shows the same name

- **GIVEN** a browser whose UI language is Spanish
- **WHEN** the Train2Go extension's popup opens
- **THEN** its title and header SHALL read "Kaiord for Train2Go"

### Requirement: English and Spanish at parity

Every extension SHALL ship exactly `_locales/en` and `_locales/es`, declaring
the same keys and the same placeholders, with no empty message
(R-BridgeLocalesEnglishSpanish, `scripts/check-bridge-locales-en-es.test.mjs`).
Every string a popup shows SHALL come from those catalogs or from the shared
Connection notices: `popup.html` SHALL hold no words outside a mark hidden
from assistive technology, and the `KAIORD_POPUP_MESSAGES` fallback SHALL
repeat `_locales/en`. The popup SHALL render the notice and the outage date in
the language whose catalog Chrome renders: Spanish when the browser's UI
language is Spanish, English otherwise.

#### Scenario: A Platform that does not answer, in Spanish

- **GIVEN** a browser whose UI language is Spanish and Garmin does not answer
- **WHEN** the Garmin popup opens
- **THEN** it SHALL read "Garmin no responde, así que ahora mismo no puedes usarlo en Kaiord." with the action "Reintentar"

#### Scenario: A key added in one language only

- **WHEN** a key is added to `_locales/en/messages.json` and not to `_locales/es/messages.json`
- **THEN** `pnpm test:scripts` SHALL fail naming the extension and the key

### Requirement: The athlete never reads bridge or the Kaiord extension

No athlete-facing text SHALL say "bridge" or "the Kaiord extension" (in
Spanish, "la extensión de Kaiord"): the registered claims surfaces, the App's
dictionaries and UI copy, the extensions' `_locales` and popups, the store
listings' names and the WHOOP listing, the privacy policy and the docs pages
that address the athlete. `pnpm lint:retired-terms` SHALL fail on either,
except for an exact phrase in `ATHLETE_ALLOWED` of
`scripts/retired-terms.vocab.mjs`, each with its reason; an allowed phrase no
text holds SHALL fail too. Code identifiers, package names, file names and
developer docs keep "bridge".

#### Scenario: The old name comes back

- **WHEN** a dictionary, a catalog or a listing says "Kaiord Garmin Bridge"
- **THEN** `pnpm lint:retired-terms` SHALL fail naming the file

#### Scenario: A package name is shown

- **GIVEN** a README intro that names `@kaiord/garmin-bridge`
- **WHEN** the guard runs
- **THEN** it SHALL pass, because the package name is an allowed phrase

### Requirement: Spanish store listings are registered claims

Each published or prepared store listing SHALL carry a Spanish Short and
Detailed Description. For every extension whose English listing is a claims
surface, the Spanish sections and `extDescription` in `_locales/es` SHALL be
registered in the same `claims/*.json`, each entry with the proof of the
English sentence it translates.

#### Scenario: A Spanish sentence without an entry

- **WHEN** a sentence is added to "Detailed Description, Spanish" of a registered listing
- **THEN** `pnpm lint:claims` SHALL fail on the unregistered claim
