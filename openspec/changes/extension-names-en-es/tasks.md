## 1. Locale rule (seam: the repo tree)

- [x] 1.1 `scripts/check-bridge-locales-en-es.test.mjs` (red first), replacing `check-bridge-locales-english-only.test.mjs`.
- [x] 1.2 `scripts/check-bridge-popup-message-parity.test.mjs` covers `es` and `extName`.

## 2. Popups (seam: the popup in jsdom)

- [x] 2.1 `bridge-popup-utils.js`: `uiLocale`, `localizePage`, a Spanish outage date; vendored tests (red first).
- [x] 2.2 `connection-notices.js` loses `EXTENSION_LOCALE`; the five popups pass `uiLocale()`.
- [x] 2.3 `popup.html` without words; `test/popup-locales.test.js` vendored master (English and Spanish per bridge).
- [x] 2.4 `_locales/en` names "Kaiord for <Platform>"; `_locales/es` for all five.

## 3. Texts

- [x] 3.1 App settings dictionary (en/es), docs pages, privacy policy prose and WHOOP heading, Train2Go identity name.
- [x] 3.2 Store listings: name, languages, Spanish Short and Detailed Description; registered in `claims/*.json`.

## 4. Vocabulary guard (seam: `checkAthleteTerms`)

- [x] 4.1 `scripts/check-retired-terms.test.mjs` (red first), then `ATHLETE_TERMS`, `ATHLETE_ALLOWED`, `ATHLETE_FILES` and `checkAthleteTerms`.

## 5. Quality gates

- [x] 5.1 Bridge suites, `pnpm test:scripts`, `pnpm lint`, claims, notices, retired terms, privacy policy, App, docs, landing, e2e.
- [x] 5.2 Changeset.
