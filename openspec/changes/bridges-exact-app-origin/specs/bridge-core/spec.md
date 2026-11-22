## ADDED Requirements

### Requirement: Wildcard origins are refused by a root guard

`scripts/check-bridge-exact-origin.mjs` (`pnpm lint:bridge-exact-origin`, rule
`R-BridgeExactOrigin`) SHALL fail the lint job when any bridge declares more
than the exact Kaiord App origin. In every `manifest.json` and
`manifest.prod.json`, each `externally_connectable.matches` entry and each
match of the content-script entry that loads `kaiord-announce.js` SHALL be
`https://kaiord.com/*`, or, in the development `manifest.json` only, a Vite
dev-server pattern (`http://localhost:5173/*`, `http://localhost:5174/*`,
`http://localhost/*` for the announce script). `https://kaiord.com/*` SHALL be
declared in both places, and `externally_connectable.ids` SHALL NOT contain
`*`. The shipped `*.js` of each bridge and the bridge-core masters SHALL NOT
contain a `*.kaiord.com` literal or a regex over `kaiord\.com`, comments
excluded. Finding no bridge, or a bridge without `manifest.json`, SHALL be a
fault, not a pass.

#### Scenario: A subdomain wildcard fails lint

- **GIVEN** a bridge manifest whose `externally_connectable.matches` holds `https://*.kaiord.com/*`
- **WHEN** `pnpm lint:bridge-exact-origin` runs
- **THEN** it SHALL fail, naming the manifest and the pattern

#### Scenario: A dev origin in the production manifest fails lint

- **GIVEN** a `manifest.prod.json` declaring `http://localhost:5173/*`
- **WHEN** the guard runs
- **THEN** it SHALL fail, naming that manifest

#### Scenario: A pattern match on the App origin in runtime code fails lint

- **GIVEN** a shipped bridge `*.js` file that tests the sender origin against a regex over `kaiord\.com`
- **WHEN** the guard runs
- **THEN** it SHALL fail, naming the file

## MODIFIED Requirements

### Requirement: Single envelope implementation with uniform external gating

All bridges SHALL produce protocol responses and dispatch messages through
the vendored envelope module's factories (`createDispatch({ handleAction,
protocolVersion })`, `createExternalDispatch({ dispatch, externalActions,
protocolVersion })`). The response envelope SHALL preserve the shared
contract `{ ok, protocolVersion, data?, error?, status?, retryable?,
needsReauth?, resetSeconds? }`. Every external message SHALL be
origin-pinned and action-checked against the bridge's declared
external-actions allowlist before its action handler is invoked — for all
actions, not only snapshot actions. The only accepted origin SHALL be the
exact Kaiord App origin `https://kaiord.com`, compared as a string: no
subdomain, `www` included. The Vite dev origins `http://localhost:5173` and
`http://localhost:5174` SHALL be accepted only when the loaded manifest's
`externally_connectable.matches` declares them, which the development
`manifest.json` does and the packaged `manifest.prod.json` does not. A message
from any other origin SHALL get no answer: the guard returns without calling
`sendResponse` and without keeping the channel open.

#### Scenario: Allowed origin and allowlisted action dispatches

- **WHEN** a sender with origin `https://kaiord.com` sends an external message whose action is in the bridge's external allowlist
- **THEN** the shared dispatch SHALL invoke the bridge's action handler and respond with the success envelope

#### Scenario: Disallowed origin is rejected identically across bridges

- **WHEN** any bridge receives an external message from an origin other than `https://kaiord.com` (for example `https://app.kaiord.com`, `https://www.kaiord.com` or `https://attacker.example`), or from a sender with no origin
- **THEN** it SHALL NOT call `sendResponse`, SHALL return `false`, and SHALL NOT invoke the bridge's action handler

#### Scenario: Dev origins answer only in a development build

- **GIVEN** the loaded manifest is `manifest.prod.json`, whose `externally_connectable.matches` is exactly `["https://kaiord.com/*"]`
- **WHEN** a sender with origin `http://localhost:5173` sends an allowlisted action
- **THEN** it SHALL get no answer, while the same message under the development `manifest.json` SHALL be dispatched

#### Scenario: Action outside the external allowlist is rejected

- **GIVEN** a bridge whose external-actions allowlist does not include `set-credentials`
- **WHEN** an allowed origin sends `{ action: "set-credentials" }` externally
- **THEN** the shared guard SHALL reject it with the error envelope, without invoking the bridge's action handler
