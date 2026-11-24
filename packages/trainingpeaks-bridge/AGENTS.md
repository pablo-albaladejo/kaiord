<!-- Parent: ../AGENTS.md -->

# trainingpeaks-bridge

## Purpose

Chrome extension (MV3, plain JS) bridging the Kaiord editor to TrainingPeaks.
The **SW-direct, dual-transport** source: the background service worker holds no
password. The durable credential is the user's own `Production_tpAuth` session
cookie (a domain-wide `.trainingpeaks.com` cookie). Every data call needs a
short-lived Bearer minted FROM that cookie, so `tp-auth.js` orchestrates two
vendored masters:

1. **token exchange** — `GET https://tpapi.trainingpeaks.com/users/v3/token`
   COOKIE-ONLY (no `Authorization`) via the `session-fetch` master
   (`credentials:"include"`). Returns a ~1h `access_token`, cached with a 60s
   refresh buffer.
2. **data calls** — the cached Bearer via the `bearer-fetch` master
   (`credentials:"omit"` + `Authorization: Bearer`). A 401 re-runs the token
   exchange once (the "refresh").

**Thin Bridge** (`docs/adr/0004-thin-bridge-smart-connector.md`, protocol
version 2): the App reaches it only through `{ action: "request", method,
path, body? }`, which runs only an entry of the closed `ALLOWED` list in
`background.js` (method + path pattern, and for a write the name of the body
schema the vendored `bridge-request-gate.js` checks it against) and answers
TrainingPeaks's answer unread but for its Session secrets (removed by
the vendored `bridge-answer.js`) as `{ status, contentType, body }`. What to ask for,
how to read it, pacing and retries are the App's Connector (`packages/workout-spa-editor/src/adapters/trainingpeaks/`). The App
falls back to the protocol-1 actions for the store version. The internal
channel uses `createInternalDispatch`: only the popup is answered, never a
content script (`test/thin-bridge.test.js`).

The token endpoint is not in `ALLOWED` (its answer is the token); the token is
minted only for a real request or `read-athlete-id`, which the App sends just
before a send or an import. Parsing lives in `@kaiord/trainingpeaks`, App-side.

## Key Files

| File                                    | Description                                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background.js`                         | Service worker: closed list with body schemas, `request`, `read-athlete-id`, popup-only internal channel.                                                                                                                                                                                                              |
| `personal-fields.js`                    | The one declaration of the personal fields of the Platform's answers that no Connector reads; `bridge-answer.js` removes them by name from every answer (ADR 0004, `openspec/changes/bridges-owner-decisions`)                                                                                                         |
| `tp-auth.js`                            | Bridge-specific dual transport (cookie→token→Bearer). Holds the TP host/paths.                                                                                                                                                                                                                                         |
| `session-fetch.js`                      | Vendored identity-free cookie transport (bridge-core master).                                                                                                                                                                                                                                                          |
| `bearer-fetch.js`                       | Vendored identity-free Bearer transport (bridge-core master).                                                                                                                                                                                                                                                          |
| `bridge-identity.js`                    | Per-bridge identity consumed by the vendored announce core.                                                                                                                                                                                                                                                            |
| `popup.js` / `popup.html` / `popup.css` | Shared bridge shell: status block, capability chips, fix-first CTA pair.                                                                                                                                                                                                                                               |
| `manifest.json` / `manifest.prod.json`  | MV3 manifest (`storage` only; host: `https://tpapi.trainingpeaks.com/*`).                                                                                                                                                                                                                                              |
| `store-listing.md`                      | Store listing copy. Short and Detailed Description are a registered claims surface (`claims/trainingpeaks.json`, `pnpm lint:claims`).                                                                                                                                                                                  |
| `privacy-justification.md`              | Permission justifications. A registered claims surface: every paragraph needs an entry in `claims/trainingpeaks.json`.                                                                                                                                                                                                 |
| `test/token-confinement.test.js`        | A Session check makes no request and mints nothing; a token is minted only for a real request and stays in `chrome.storage.local`; no answer carries it; the athlete id goes only to `read-athlete-id`; every request goes to `tpapi.trainingpeaks.com`; no DELETE/PUT/PATCH. Proof for the listing and policy claims. |

### Vendored bridge-core files

`bridge-envelope.js`, `bridge-answer.js`, `session-fetch.js`, `bearer-fetch.js`,
`kaiord-announce.js`, `bridge-popup-utils.js`, `bridge-popup-shell.js`,
`popup.css`, and
`test/{chrome-mock,bridge-envelope.test,bearer-fetch.test,bridge-popup-shell.test}.js`
are
byte-identical vendored copies of `packages/_shared/bridge-core/` masters —
never edit them here; edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). The masters are identity-free: the
TrainingPeaks host, paths, and metric type-ids live in `tp-auth.js` /
`background.js`, never in a master. Identity values in `bridge-identity.js` must
match `BRIDGE_MANIFEST` in `background.js`.

## For AI Agents

- Plain JavaScript by design (strict-TS exception in root `CLAUDE.md`);
  correctness lives in the vitest suite (`pnpm test` / `test:coverage`).
- The bridge NEVER parses metrics and NEVER imports `@kaiord/trainingpeaks` — it
  returns raw JSON; the SPA parses.
- External dispatch is origin-pinned and action-allowlisted via the vendored
  envelope. `EXTERNAL_ACTIONS`: `ping` / `checkSession` / `request` / `read-athlete-id` /
  `open-trainingpeaks` / `set-theme`. `read-athlete-id` is read just before a
  send and is where the token is minted; `checkSession` asks TrainingPeaks
  nothing (`signed-in` from a valid stored token, else `not-checked`). The App's Connector reads one workout by id and keeps only its id and day, and, only after a send that got no answer, the workouts of that one day (`workouts/<day>/<day>`, both dates equal), keeping only their titles.
- The session cookie is never read, stored, or logged; the extension only holds
  the minted access token. A Session check never mints it (#1643).
- Weight-unit assumption: the type-9 metric value is kilograms (see
  `@kaiord/trainingpeaks` `TRAININGPEAKS_WEIGHT_UNITS`).
- English and Spanish: `_locales/en/` (default) and `_locales/es/`, same keys,
  chosen by the browser's UI language; the name is "Kaiord for TrainingPeaks" in both
  (R-BridgeLocalesEnglishSpanish, `scripts/check-bridge-locales-en-es.test.mjs`).
- Changing what the extension does (a new path, action or stored key) changes
  the registered texts: rewrite the sentence and its entry in
  `claims/trainingpeaks.json`, or `pnpm lint:claims` and
  `check-privacy-policy` fail. `extDescription` is a registered claim too.
