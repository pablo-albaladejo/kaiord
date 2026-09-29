> Synced: 2026-07-11 (add-shared-bridge-core)

# Bridge Core

## Purpose

Vendored shared runtime for the bridge Chrome extensions: the master file
set under `packages/_shared/bridge-core/`, the byte-copy sync + parity
tooling, the identity-before-core loading contract, the single
envelope/origin-guard implementation, the per-bridge literals mechanical
probes depend on, and packaging/guard/CI compatibility.

## Requirements

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

The guard SHALL derive its bridge list from `packages/*-bridge` on disk
rather than from a hardcoded array, SHALL extract allowlist entries by
object literal so that `method` / `pattern` key order cannot change what is
extracted, and SHALL fail loudly on an entry it cannot read rather than
omitting it from the surface. The guard SHALL run its checks whenever it is
invoked, including through a path containing a symlink.

The golden SHALL record each bridge's `EXTERNAL_ACTIONS` set — the actions
the editor may invoke across origins — and every bridge's own suite SHALL
pin that set exactly, not merely assert one membership or one
non-membership.

The golden SHALL also record each bridge's CREDENTIAL-HANDSHAKE surface.
`allowed_paths` governs only the DATA-call surface: the paths a bridge will
fetch on the editor's behalf, gated by that bridge's `isAllowed`. A bridge's
own handshake bypasses that gate by construction — garmin's `sso/signin`,
`/oauth-service/oauth/preauthorized` and
`/oauth-service/oauth/exchange/user/2.0` go straight to `fetchImpl` in
`garmin-oauth.js`, and trainingpeaks' `exchangeToken` calls
`cookieSessionFetch` directly — and those endpoints are where the
credentials themselves travel.

Every bridge SHALL declare that surface as `const AUTH_ENDPOINTS = [...]`,
an array of absolute `https://host/path` string literals, in whichever root
`.js` file makes the calls. The guard SHALL read the declaration rather than
infer the surface from call sites: two of garmin's three URLs are built
inline from `CONNECTAPI` with no constant to key off, so an extractor that
scanned for URL-shaped constants would record one of three and report a
complete surface.

A bridge with no handshake SHALL declare `[]` explicitly; absence SHALL
fail. This differs from `EXTERNAL_ACTIONS`, where absence is honest, and the
difference is load-bearing: nothing tells the guard whether a bridge HAS a
handshake, so permitting silence would let a new `packages/<name>-bridge`
that mints tokens lock `auth_endpoints: []` and read in review as sending
credentials nowhere. Deriving the bridge list from disk does not help on its
own there — the new bridge is enumerated and still locks an empty surface.
A declaration the guard cannot read — a template literal, a bare path, a
wrapper, a rename, a spread, entries appended after the literal — SHALL
fail loudly rather than be recorded as an empty surface.

Because the guard can only verify that the DECLARATION has not moved, each
bridge with a handshake SHALL ALSO pin that declaration against the URLs its
handshake actually requests, in its own vitest suite, through the mocked
fetch. Both halves are required and neither is sufficient: repointing a call
while leaving the declaration untouched is invisible to the guard, and
dropping an entry from the declaration is answered by regenerating the
golden.

The internal action surface (popup → background) is deliberately NOT
recorded. The golden documents what a third party can reach; no origin
outside the extension can invoke an internal action, so pinning that set
would couple the guard to purely internal refactors and produce failures
that carry no privacy meaning. This is a decision, not an omission: if an
action ever becomes reachable from `externally_connectable`, it enters
`EXTERNAL_ACTIONS` and the golden records it there.

#### Scenario: A widened external-action surface is caught

- **GIVEN** a bridge's `EXTERNAL_ACTIONS` set, which bounds what kaiord.com may ask the installed extension to do
- **WHEN** an action is added to, removed from, or renamed in that set
- **THEN** `check-bridge-privacy-surface.mjs` SHALL fail against the golden fixture
- **AND** that bridge's own vitest suite SHALL fail on its exact-set pin
- **AND** a declaration the guard cannot read SHALL fail loudly rather than being recorded as an empty surface

#### Scenario: A widened allowlist written with reversed keys is caught

- **GIVEN** an `ALLOWED` entry written `{ pattern, method }` instead of `{ method, pattern }`
- **WHEN** a new read scope is added to a bridge's allowlist in that key order
- **THEN** `check-bridge-privacy-surface.mjs` SHALL fail against the golden fixture
- **AND** reversing the keys without changing any scope SHALL leave the extracted surface byte-identical

#### Scenario: An entry the guard cannot read fails loudly rather than vanishing

- **GIVEN** an allowlist whose elements are not all inline object literals — a spread (`[...BASE, {…}]`), a shared constant (`[SHARED, {…}]`), or entries appended after the literal (`[…].concat(EXTRA)`)
- **WHEN** `check-bridge-privacy-surface.mjs` extracts that allowlist
- **THEN** it SHALL fail naming the unreadable element, rather than recording only the inline entries as if they were the whole surface
- **AND** an entry field whose value is not a string or regex literal, or whose key is not `method` or `pattern`, SHALL fail the same way
- **AND** a nested object literal SHALL NOT be able to supply an entry's `method` or `pattern` in place of the entry's own
- **AND** a bridge that ships a service worker or content script but whose allowlist declaration cannot be located at all — wrapped in `Object.freeze(…)`, or renamed — SHALL fail, rather than be recorded with an empty read surface that reads as "this bridge reads nothing"

#### Scenario: A moved credential sink is caught

- **GIVEN** a bridge's `AUTH_ENDPOINTS` declaration, which records where its credential handshake sends the user's own session
- **WHEN** an endpoint is added to, removed from, or repointed in that declaration
- **THEN** `check-bridge-privacy-surface.mjs` SHALL fail against the golden fixture
- **AND** when instead the CALL is repointed while the declaration is left untouched — the guard cannot see this — that bridge's own vitest suite SHALL fail, because it compares the declaration against the URLs the handshake actually requests
- **AND** a bridge that gains an additional handshake request SHALL fail that same comparison

#### Scenario: An unreadable or absent handshake declaration fails loudly

- **GIVEN** a bridge whose `AUTH_ENDPOINTS` the guard cannot read — a template literal such as ``[`${TPAPI}${TOKEN_PATH}`]``, a bare path with no origin, an `Object.freeze(…)` wrapper, a rename, a spread, a second declaration in the same file, or entries appended with `.concat(…)`
- **WHEN** `check-bridge-privacy-surface.mjs` extracts that bridge's surface
- **THEN** it SHALL fail naming the defect, rather than recording `auth_endpoints: []` — which would read as "this bridge sends credentials nowhere"
- **AND** a bridge that declares nothing at all SHALL fail the same way, so that a bridge with no handshake states `[]` deliberately
- **AND** a bridge shipping no root `.js` file at all SHALL be recorded `[]` without a declaration, since it executes nothing

#### Scenario: A new bridge package cannot ship unlocked

- **WHEN** a new `packages/<name>-bridge` package is added
- **THEN** `check-bridge-privacy-surface.mjs` SHALL fail against the golden fixture until that bridge's manifest surface and read allowlist are recorded in it

#### Scenario: The guard checks something when invoked through a symlink

- **GIVEN** an invocation path containing a symlink, under which Node resolves the module URL to the real path but leaves `process.argv[1]` as typed
- **WHEN** `check-bridge-privacy-surface.mjs` is executed through that path
- **THEN** it SHALL run its checks and report the result, rather than exiting 0 having verified nothing

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
