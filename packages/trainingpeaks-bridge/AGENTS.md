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

Raw metric JSON is returned verbatim; parsing lives in `@kaiord/trainingpeaks`,
called SPA-side.

## Key Files

| File                                    | Description                                                                                                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background.js`                         | Service worker: path allowlist, read throttle, action routing.                                                                                                                                                               |
| `tp-auth.js`                            | Bridge-specific dual transport (cookie→token→Bearer). Holds the TP host/paths.                                                                                                                                               |
| `session-fetch.js`                      | Vendored identity-free cookie transport (bridge-core master).                                                                                                                                                                |
| `bearer-fetch.js`                       | Vendored identity-free Bearer transport (bridge-core master).                                                                                                                                                                |
| `bridge-identity.js`                    | Per-bridge identity consumed by the vendored announce core.                                                                                                                                                                  |
| `popup.js` / `popup.html` / `popup.css` | Shared bridge shell: status block, capability chips, fix-first CTA pair.                                                                                                                                                     |
| `manifest.json` / `manifest.prod.json`  | MV3 manifest (`storage` only; host: `https://tpapi.trainingpeaks.com/*`).                                                                                                                                                    |
| `store-listing.md`                      | Store listing copy. Short and Detailed Description are a registered claims surface (`claims/trainingpeaks.json`, `pnpm lint:claims`).                                                                                        |
| `privacy-justification.md`              | Permission justifications. A registered claims surface: every paragraph needs an entry in `claims/trainingpeaks.json`.                                                                                                       |
| `test/token-confinement.test.js`        | The token stays in `chrome.storage.local`, no answer to any external action carries it, every request goes to `tpapi.trainingpeaks.com`, and the allowlist has no DELETE/PUT/PATCH. Proof for the listing and policy claims. |

### Vendored bridge-core files

`bridge-envelope.js`, `session-fetch.js`, `bearer-fetch.js`,
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
  envelope. `EXTERNAL_ACTIONS`: `ping` / `checkSession` / `read-metrics` /
  `push-weight` / `push-workout` / `read-workout` / `open-trainingpeaks` /
  `set-theme`. `read-workout` reads one workout by id and returns only its id
  and day, so the App can check its own copy before a re-send.
- The session cookie is never read, stored, or logged; the extension only holds
  the minted access token. Session presence is a boolean only.
- Weight-unit assumption: the type-9 metric value is kilograms (see
  `@kaiord/trainingpeaks` `TRAININGPEAKS_WEIGHT_UNITS`).
- English-only: `_locales/en/` is the sole locale (hard constraint).
- Changing what the extension does (a new path, action or stored key) changes
  the registered texts: rewrite the sentence and its entry in
  `claims/trainingpeaks.json`, or `pnpm lint:claims` and
  `check-privacy-policy` fail. `extDescription` is a registered claim too.
