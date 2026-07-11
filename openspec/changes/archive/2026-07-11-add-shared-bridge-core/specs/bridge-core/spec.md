## ADDED Requirements

### Requirement: Vendored shared masters with byte-for-byte parity

Shared bridge runtime code SHALL live as master files under
`packages/_shared/bridge-core/` and SHALL be vendored into each consuming
bridge package by `scripts/sync-bridge-core.mjs` (runtime masters as
top-level flat files, test masters into the bridge's `test/`). Every
vendored copy MUST be byte-identical to its master;
`scripts/check-bridge-core-parity.test.mjs` SHALL fail the lint job on any
drift. Each master declares its consumer set: the envelope, announce core,
popup utilities, and chrome mock are vendored by all bridges; the popup CSS,
popup snapshot module, and profile-snapshot validator are vendored only by
bridges with a profile-snapshot popup (garmin, train2go today).

#### Scenario: Sync propagates a master edit to every consumer

- **WHEN** a master file under `packages/_shared/bridge-core/` is edited and `pnpm bridge:sync` runs
- **THEN** every bridge in that master's consumer set receives a byte-identical copy, and bridges outside the set are untouched

#### Scenario: Drifted vendored copy fails lint

- **GIVEN** a bridge's vendored copy is edited directly instead of via its master
- **WHEN** `pnpm test:scripts` runs
- **THEN** the parity guard SHALL fail, naming the drifted file and its master

### Requirement: Identity loads before its consumer

Per-bridge identity (`id`, `name`, `capabilities`) SHALL live only
in that bridge's `bridge-identity.js`, which defines a single global consumed
by shared masters. Shared master files MUST NOT contain any per-bridge
identity value. In every loading context where a shared master consumes the
identity global, `bridge-identity.js` SHALL load first — today that is the
kaiord.com announce `content_scripts` entry
(`["bridge-identity.js", "kaiord-announce.js"]`). `bridge-identity.js`
MUST NOT be injected into a bridge's integration-site content-script entry.

#### Scenario: Announce carries the loading bridge's identity

- **GIVEN** the garmin-bridge manifest announce entry loads `["bridge-identity.js", "kaiord-announce.js"]`
- **WHEN** the announce core posts `KAIORD_BRIDGE_ANNOUNCE`
- **THEN** the message carries `bridgeId: "garmin-bridge"` and garmin's capability tokens, with the announce message shape unchanged

#### Scenario: Identity value in a shared master is rejected

- **WHEN** a shared master under `packages/_shared/bridge-core/` references a concrete bridge id, bridge name, or capability list
- **THEN** the parity guard's master-purity check SHALL fail the lint job

#### Scenario: Identity is absent from the integration-site entry

- **WHEN** inspecting the `content_scripts` entry matching the integration site (e.g. `connect.garmin.com`)
- **THEN** its `js` list SHALL NOT contain `bridge-identity.js`

### Requirement: Identity and ping manifest consistency

Each bridge SHALL declare identical `id`, `name`, and `capabilities` values
in its `bridge-identity.js` and in the `BRIDGE_MANIFEST` literal in its
`background.js`, so the announce message and the ping manifest can never
diverge. The parity guard SHALL enforce this consistency.

#### Scenario: Consistent identity and manifest pass

- **WHEN** a bridge's `bridge-identity.js` and `BRIDGE_MANIFEST` declare the same id, name, and capabilities
- **THEN** the parity guard's consistency check SHALL pass for that bridge

#### Scenario: Divergent capability lists fail lint

- **GIVEN** a capability is added to a bridge's `BRIDGE_MANIFEST` but not to its `bridge-identity.js`
- **WHEN** `pnpm test:scripts` runs
- **THEN** the parity guard SHALL fail, naming the bridge and the divergent field

### Requirement: Single envelope implementation with uniform external gating

All bridges SHALL produce protocol responses and dispatch messages through
the vendored envelope module's factories (`createDispatch({ handleAction,
protocolVersion })`, `createExternalDispatch({ dispatch, externalActions,
protocolVersion })`). The response envelope SHALL preserve the shared
contract `{ ok, protocolVersion, data?, error?, status?, retryable?,
needsReauth?, resetSeconds? }`. Every external message SHALL be
origin-pinned against the allowed SPA origins and action-checked against the
bridge's declared external-actions allowlist before its action handler is
invoked — for all actions, not only snapshot actions.

#### Scenario: Allowed origin and allowlisted action dispatches

- **WHEN** a sender with origin `https://app.kaiord.com` sends an external message whose action is in the bridge's external allowlist
- **THEN** the shared dispatch SHALL invoke the bridge's action handler and respond with the success envelope

#### Scenario: Disallowed origin is rejected identically across bridges

- **WHEN** any bridge receives an external message from an origin other than `https://*.kaiord.com` or `http://localhost:5173/5174`
- **THEN** it SHALL respond `{ ok: false, protocolVersion, error, retryable: false }` via the shared guard, without invoking the bridge's action handler

#### Scenario: Action outside the external allowlist is rejected

- **GIVEN** a bridge whose external-actions allowlist does not include `set-credentials`
- **WHEN** an allowed origin sends `{ action: "set-credentials" }` externally
- **THEN** the shared guard SHALL reject it with the error envelope, without invoking the bridge's action handler

### Requirement: Per-bridge literals preserved for mechanical probes

Each bridge's own `background.js` SHALL retain its `BRIDGE_MANIFEST` object
literal, including the `version:` string consumed by
`scripts/sync-extension-version.mjs` and the `capabilities: [...]` array
consumed by the SPA's `integration-registry-capability-parity.test.ts`.
These literals MUST NOT be hoisted into shared masters or the identity file.

#### Scenario: Version sync still finds the literal after adoption

- **WHEN** `scripts/sync-extension-version.mjs` runs against a bridge using the vendored core
- **THEN** it SHALL find and rewrite the `BRIDGE_MANIFEST version:` literal in that bridge's `background.js`

#### Scenario: Hoisting the capabilities literal fails the parity suite

- **WHEN** a bridge's `background.js` no longer contains a `capabilities: [...]` literal
- **THEN** `integration-registry-capability-parity.test.ts` SHALL fail for that bridge

### Requirement: Packaging compatibility

Vendored runtime files SHALL be top-level `*.js` (plus `popup.css`) inside
each bridge package so `scripts/package-extension.sh` includes them without
modification; vendored test masters live under `test/` and are never
packaged. The packaging script SHALL NOT need to resolve imports, workspace
dependencies, or perform any build step to produce a complete extension zip.

#### Scenario: Packaged zip is self-contained

- **WHEN** `scripts/package-extension.sh` packages a bridge that uses the vendored core
- **THEN** the zip contains every vendored runtime file at its root, no `test/` files, and the extension loads in Chrome with no missing-script errors

### Requirement: Guard and CI coverage across all bridges

The bridge privacy-surface guard SHALL cover every bridge package, with the
`content.js` allowlist section applying only to bridges that ship an
integration-site content script and the `manifest.prod.json` section
applying only to bridges that have one. The stale-threshold parity guard
SHALL verify the vendored popup snapshot module's
`STALE_SNAPSHOT_THRESHOLD_DAYS` literal against
`packages/core/src/protocol/profile-snapshot.ts` for every bridge that
vendors that module. Every bridge's vitest suite SHALL run in the CI test
matrix.

#### Scenario: Whoop popup outbound URL is caught

- **WHEN** an absolute `http(s)://` URL is introduced as a fetch argument in `packages/whoop-bridge/popup.js`
- **THEN** `check-bridge-privacy-surface.mjs` SHALL fail against the golden fixture

#### Scenario: Stale threshold divergence is caught in the snapshot module

- **GIVEN** `STALE_SNAPSHOT_THRESHOLD_DAYS` changes in `@kaiord/core`
- **WHEN** the stale-threshold parity guard runs before the snapshot-module master is updated and re-synced
- **THEN** it SHALL fail for every bridge that vendors the snapshot module

#### Scenario: A bridge suite regression is visible in CI

- **WHEN** a change breaks a test in any bridge package's vitest suite
- **THEN** the CI test matrix SHALL run that suite and fail the workflow
