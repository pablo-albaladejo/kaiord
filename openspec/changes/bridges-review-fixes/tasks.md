## 1. Extensions

- [x] 1.1 `bridge-answer.js`: strip Session secrets from every answer; per-extension tests with the real fixtures
- [x] 1.2 Garmin: FIT weight file only, closed workout schema; crafted-body tests
- [x] 1.3 WHOOP content script closed list with a parity test
- [x] 1.4 Signed out only when the Platform verified it, per extension
- [x] 1.5 Garmin legacy `ping` never implies a sign-out
- [x] 1.6 WHOOP check answers `hasAccountId` and `tabOpen`
- [x] 1.7 Shared request gate on Train2Go; shared answer, `toBridgeError` and broken notice; Garmin service worker split

## 2. Kaiord App

- [x] 2.1 A 403 is not answering; signed out only on `needsReauth`
- [x] 2.2 No costly check on protocol 1
- [x] 2.3 Not-checked per reason; no-account-id and no-tab notices with the popup; import refused with the notice
- [x] 2.4 Fix targets: Garmin listing or the install guide; `check-site-links` over them
- [x] 2.5 Generated notices copy in `@kaiord/i18n`
- [x] 2.6 Tagged error, one `SessionOutcome`, protocol version only, one call helper, Connectors under `adapters/<platform>/connector/`, one descriptor per extension

## 3. Texts and specs

- [x] 3.1 Listings, justifications, policy and claims follow the code (en, es)
- [x] 3.2 Install guide (en, es) registered as a claims surface
- [x] 3.3 Requirements restored to their owning change; later changes modify them in their own deltas

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, the extension, package and App suites, the e2e specs, the site guards, `openspec validate --strict`
