## 1. Shared masters

- [x] 1.1 `bridge-request-gate.js` with its vendored test (red first): only method, path and a declared body; an entry of the list; a body only where an entry names a schema, matched against it.
- [x] 1.2 `bearer-fetch.js`: `raw: true`, wrapped in one scope object; `check-bridge-core-parity.test.mjs` evaluates each service worker with its imports in one scope (red on the old master).
- [x] 1.3 `pnpm bridge:sync`; `sync-bridge-core.mjs` consumer sets.

## 2. Extensions at the message contract (seam 3)

- [x] 2.1 `test/thin-bridge.test.js` per extension (red first): protocol 2; raw answer on a listed path; refusals outside the list, with headers, with a body where none is declared, with a body outside its schema, with nothing sent; dead Session as `needsReauth`; legacy actions no longer served; content scripts get no answer; the popup's actions answered.
- [x] 2.2 Garmin: `request` under one deadline; closed list with `workout`, `fit-file`, `schedule` schemas; legacy actions, pacing and reading removed; deadline tests ported to `request`.
- [x] 2.3 Tanita: `request`; the HEAD Session check unchanged.
- [x] 2.4 TrainingPeaks: `request` with raw Bearer answers; token path out of the list; `workout` and `weight` schemas; throttle and 402 message removed.
- [x] 2.5 WHOOP: closed list in `background.js`, `request` relayed to the WHOOP tab, raw answer from `content.js`; `capture-token` listener that answers nothing.
- [x] 2.6 `bridge-identity.js` `protocolVersion: 2`; token-confinement tests cover every list entry and the token endpoints.

## 3. Connectors in the App

- [x] 3.1 `adapters/bridge/thin-bridge-request.ts` (`callThroughBridge`, `BridgeAnswerRefusal`); Train2Go delegates to it.
- [x] 3.2 Garmin Connector: paths, ids, answers, activities pacing; `executePush`, `executeList`, the calendar port, the activities and body-composition transports.
- [x] 3.3 Tanita, TrainingPeaks and WHOOP Connectors through the same transports.
- [x] 3.4 Contract tests per extension (current and previous protocol, closed-list check) with the extension's former cases ported.
- [x] 3.5 `bridge-protocol.ts`: all five on `[1, 2]`; tests.
- [x] 3.6 Safe-writes seam tests unchanged in meaning (TrainingPeaks fake on protocol 2).

## 4. Guards and truth

- [x] 4.1 `check-bridge-privacy-surface.mjs` records a write entry's body schema and reads `background.js` first; golden refreshed.
- [x] 4.2 `check-bridge-exact-origin.mjs` R-BridgeInternalDispatch, with tests.
- [x] 4.3 Justifications, privacy-policy sections, READMEs, TESTING checklists, AGENTS; claims proofs repointed; `check-privacy-policy.mjs` rules and floors raised.
- [x] 4.4 Delta specs.

## 5. Quality gates

- [x] 5.1 `pnpm lint`, `pnpm test:scripts`, the five extension suites, App unit suite, end-to-end specs, `pnpm lint:claims`, `pnpm lint:connection-notices`.
- [x] 5.2 Changesets.
