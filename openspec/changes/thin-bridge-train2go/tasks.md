## 1. Extension at the message contract (seam 3)

- [x] 1.1 `test/thin-bridge.test.js` (red first): protocol 2; `request` on a listed path answers Train2Go's raw answer; a path outside the list, a POST, headers or a body are refused with no request; a dead Session is `needsReauth`; `read-week` / `read-day` / `read-details` are no longer served to the App; the internal channel gives a content script and another extension no answer, refuses `request` to the popup and answers the popup's weekly read.
- [x] 1.2 `background.js`: `request` action, `EXTERNAL_ACTIONS` with `request`, `INTERNAL_ACTIONS` (`ping`, `read-week`) behind `createInternalDispatch`; `PROTOCOL_VERSION = 2`.
- [x] 1.3 `parser.js` reduced to the popup's needs; the moved parser tests and fixtures leave the extension.
- [x] 1.4 Shared masters: `createInternalDispatch` in `bridge-envelope.js` with its tests; `kaiord-announce.js` reads the identity's protocol version; `pnpm bridge:sync`.

## 2. Connector in the App

- [x] 2.1 Parsers ported to typed TypeScript under `adapters/train2go/connector/` with every original test case; fixtures byte-identical and prettier-ignored.
- [x] 2.2 `train2go-paths.ts`, `train2go-bridge-request.ts` (`readThroughBridge`), `read-train2go-answers.ts`.
- [x] 2.3 `store/train2go-extension-transport.ts` and `store/train2go-extension-read-zones.ts` read through the Connector.
- [x] 2.4 `store/train2go-connector-contract.test.ts`: current extension (week, day with date backfill and comments, profile page kept to zones and weight, dead Session, malformed answer), extension one version behind (all three reads through the legacy actions, failure passed through), every path the Connector asks for admitted by the extension's list.
- [x] 2.5 `adapters/bridge/bridge-protocol.ts`; discovery, Session probe and detection accept `[1, 2]` for Train2Go, `[1]` for the others, with tests.

## 3. Truth

- [x] 3.1 Store listing, permission justification, privacy-policy section, `claims/train2go.json` and `claims/readme.json` proofs.
- [x] 3.2 `packages/docs/scripts/check-privacy-policy.mjs` rules and floor; `scripts/fixtures/bridge-privacy-surface.json`.
- [x] 3.3 Bridge README / AGENTS, bridge-core AGENTS, adapter AGENTS.
- [x] 3.4 Delta specs.

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, bridge suites, App unit suite, Train2Go end-to-end specs (on the protocol-1 stub), `pnpm lint:claims`.
- [x] 4.2 Changeset for `@kaiord/train2go-bridge`, the four other bridges (vendored masters) and the App.
