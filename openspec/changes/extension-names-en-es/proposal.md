## Why

The athlete read five different names for the five extensions ("Kaiord Garmin
Bridge", "Kaiord · Garmin", "the Kaiord extension"…) and read them only in
English, while the Kaiord App speaks English and Spanish. `GLOSSARY.md`
("Bridge") says the athlete never reads "bridge": each extension is "Kaiord
for" its Platform, and "extension" when a noun is needed. The rule
R-BridgeLocalesEnglishOnly kept the extensions English-only. Ticket #1646,
user stories 36, 42 and 48 of #1670.

## What Changes

- Each extension is named "Kaiord for <Platform>" (Garmin, Train2Go, Tanita,
  TrainingPeaks, WHOOP) through `extName` in `_locales`, the same in English
  and Spanish: it is the product name and is not translated. The popup's title
  and header show that name.
- Every extension ships `_locales/en` and `_locales/es` at parity, and Chrome
  picks the catalog from the browser's UI language. `popup.html` holds no
  words; `localizePage()` fills it from the catalog. The popups pass
  `uiLocale()` to the shared Connection notices instead of the removed
  `EXTENSION_LOCALE = "en"`, and the outage date follows the same language.
- R-BridgeLocalesEnglishOnly is replaced by R-BridgeLocalesEnglishSpanish
  (`scripts/check-bridge-locales-en-es.test.mjs`): exactly `en` and `es`, the
  same keys and placeholders, no empty message, the name in both within the
  store limits, and every popup string from `_locales` or the shared notices.
  The popup message parity guard covers `es`.
- `lint:retired-terms` holds "bridge" and "the Kaiord extension" off every
  athlete-facing text: registered claims surfaces, the App's dictionaries and
  UI copy, the extensions' `_locales` and popups, the store listings' names,
  the WHOOP listing, the privacy policy and the docs pages that address the
  athlete, with an allowlist of exact phrases (package names, the published
  store address, an unpublished extension's source folder).
- The store listings carry a Spanish Short and Detailed Description,
  registered in `claims/*.json` with the English proofs; the privacy policy's
  prose and WHOOP heading name "Kaiord for <Platform>".

## Capabilities

### New Capabilities

- `extension-names`: one name per extension in both languages, English and
  Spanish at parity, and the vocabulary guard for athlete-facing texts.

### Modified Capabilities

- `extension-store-publish`: the Garmin listing's name and languages.
- `train2go-bridge`: the manifest `name` the protocol-2 `ping` answers
  (`"Train2Go"`, as `background.js` declares it).

## Impact

The five `packages/*-bridge` popups, manifests' `_locales` and store
listings, `packages/_shared/bridge-core` (`bridge-popup-utils.js`,
`connection-notices.js`, a new vendored test master), `claims/*.json`, the
privacy policy and its check, docs pages, the App's settings dictionary, root
guards and docs. The published listings (Garmin, Train2Go) change name and
gain a Spanish listing when the next version is published.
