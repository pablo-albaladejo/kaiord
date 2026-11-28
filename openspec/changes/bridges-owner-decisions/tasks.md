## 1. Spanish wording

- [x] 1.1 Try-again sentence without a pronoun in the master; `pnpm bridge:sync`; tests and listing quotes

## 2. Unused surface

- [x] 2.1 Train2Go tooltip path, TrainingPeaks weight write, schema and `write:body`, Garmin `connect.garmin.com` (both manifests)
- [x] 2.2 Golden, listings, justifications, policy, claims, privacy-policy check

## 3. Personal fields

- [x] 3.1 `bridge-answer.js` trims declared names; master tests
- [x] 3.2 `personal-fields.js` per extension, derived from each Connector
- [x] 3.3 Bridge tests on the fixtures; App tests that the Connector's output is unchanged
- [x] 3.4 Listings (en, es), justifications, policy, claims, privacy-policy rules and floors

## 4. Bounded exception

- [x] 4.1 ADR 0004 amended
- [x] 4.2 `check-bridge-popup-reads.mjs` with tests and its storage vocab; wired in `pnpm lint`
- [x] 4.3 `POPUP_READS` / `POPUP_READ_SCRIPTS` in each extension; Train2Go's check decoupled from the parser; no rollup cache
- [x] 4.4 Train2Go texts and claims

## 5. Quality gates

- [x] 5.1 `pnpm lint`, `pnpm test:scripts`, the extension, `@kaiord/i18n` and App suites, the e2e specs, `openspec validate --strict`
