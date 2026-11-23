## 1. Proofs at the message contract (seam 3), red first

- [x] 1.1 Tanita `test/export-confinement.test.js`: a check is one `HEAD`, no body read, yes or no; signed out only on a bounce to the login page; a failure is `not-answering`
- [x] 1.2 TrainingPeaks `test/token-confinement.test.js`: a check makes no request and stores nothing; `signed-in` from a valid token with no athlete id; a token is minted only for a real request; the athlete id only to `read-athlete-id`
- [x] 1.3 Garmin `test/token-confinement.test.js`: a check makes no request and stores nothing; `signed-in` from valid tokens, no workout in the answer
- [x] 1.4 Train2Go `test/request-confinement.test.js`: a check is one ping and yes or no; `signed-out` only on Train2Go's word; the profile and coach notes only to the popup's internal `read-profile`, refused to the App
- [x] 1.5 WHOOP `test/session-confinement.test.js` (new): a check makes no request, stores nothing, carries no id; the id only to `read-user-id`

## 2. Extensions

- [x] 2.1 Tanita `HEAD` check and allowlist entry
- [x] 2.2 TrainingPeaks `checkStoredToken`, `read-athlete-id`; popup "Not checked yet"
- [x] 2.3 Garmin `checkStoredTokens`; popup "Not checked yet"
- [x] 2.4 Train2Go `ping` yes or no; internal `read-profile` for the popup (after merging #1641's thin Bridge)
- [x] 2.5 WHOOP `status` yes or no, `read-user-id`, internal `popup-status`

## 3. Kaiord App

- [x] 3.1 `bridge-session-outcome`: typed outcome, prober mapping, use gate (tests first)
- [x] 3.2 `not-checked` is `installed` with `detail.notChecked` (en, es)
- [x] 3.3 Garmin send gate and TrainingPeaks import gate go ahead on `not-checked`
- [x] 3.4 TrainingPeaks push reads `read-athlete-id`; WHOOP import reads `read-user-id`; Train2Go link reads the profile ping through `request` (`readProfileAnswer`); each falls back for an older extension

## 4. Texts and guards

- [x] 4.1 Store listings, justifications, policy sections and READMEs rewritten; `claims/*.json` entries and proofs
- [x] 4.2 `check-privacy-policy` rules and mutation cases; floors unchanged
- [x] 4.3 `scripts/fixtures/bridge-privacy-surface.json` refreshed

## 5. Quality gates

- [x] 5.1 `pnpm lint`, `pnpm test:scripts`, the five extension suites, the App unit suite, the Connections end-to-end specs, `pnpm lint:claims`, `openspec validate --strict`
