## ADDED Requirements

### Requirement: One popup shell across all bridges

Every bridge popup SHALL be assembled from the vendored shell: the 340px dark
`popup.css` plus the `bridge-popup-shell.js` renderers
(`renderStatusBlock`, `renderChips`, `renderSkeleton`, `renderCtas`). The ONLY
per-bridge visual variable SHALL be the header dot accent (`--accent`,
`--accent-hover`), declared in that bridge's `popup.html` `<style>` block. The
shell's `--kd-*` custom properties SHALL carry the values of their
`styles/brand-tokens.css` `.dark` counterparts. Every string a renderer displays
SHALL arrive as a message key resolved through that bridge's own
`KAIORD_POPUP_MESSAGES` table and `_locales/en/messages.json`, so no brand name,
host, or capability token enters a master.

#### Scenario: A per-bridge accent is the only divergence

- **WHEN** comparing the popup stylesheets of any two bridges
- **THEN** the files SHALL be byte-identical, and their rendered difference SHALL be limited to the header dot colour set by each `popup.html`

#### Scenario: Status names the state, its cause, and its fix

- **GIVEN** a bridge whose upstream session is not usable
- **WHEN** its popup resolves the session probe
- **THEN** the status block SHALL render a tone dot, a verdict, and one cause sentence, and the primary CTA SHALL be the sign-in link for that source with the Kaiord editor as the secondary link

#### Scenario: A healthy session promotes the editor

- **GIVEN** a bridge whose upstream session is usable
- **WHEN** its popup resolves the session probe
- **THEN** the primary CTA SHALL open the Kaiord editor and the secondary link SHALL open the upstream source

#### Scenario: Capability chips use the managed-data-type labels

- **WHEN** a popup renders its "Feeds Kaiord" chips
- **THEN** each chip label SHALL be a `MANAGED_DATA_REGISTRY` display label for a type that bridge actually moves, listed by a static array in that bridge's own `popup.js`

#### Scenario: The checking state does not reflow the popup

- **WHEN** a popup opens and before its session probe resolves
- **THEN** it SHALL render skeleton placeholders sized to the resolved layout, so resolving the probe SHALL NOT change the popup's height

## MODIFIED Requirements

### Requirement: Vendored shared masters with byte-for-byte parity

Shared bridge runtime code SHALL live as master files under
`packages/_shared/bridge-core/` and SHALL be vendored into each consuming
bridge package by `scripts/sync-bridge-core.mjs` (runtime masters as
top-level flat files, test masters into the bridge's `test/`). Every
vendored copy MUST be byte-identical to its master;
`scripts/check-bridge-core-parity.test.mjs` SHALL fail the lint job on any
drift. Each master declares its consumer set: the envelope, announce core,
popup utilities, popup shell renderers, popup CSS, chrome mock, and the
envelope + popup-shell unit tests are vendored by all bridges; the popup snapshot module and profile-snapshot validator are
vendored only by bridges with a profile-snapshot popup (garmin, train2go today).

#### Scenario: Sync propagates a master edit to every consumer

- **WHEN** a master file under `packages/_shared/bridge-core/` is edited and `pnpm bridge:sync` runs
- **THEN** every bridge in that master's consumer set receives a byte-identical copy, and bridges outside the set are untouched

#### Scenario: Drifted vendored copy fails lint

- **GIVEN** a bridge's vendored copy is edited directly instead of via its master
- **WHEN** `pnpm test:scripts` runs
- **THEN** the parity guard SHALL fail, naming the drifted file and its master

#### Scenario: The popup CSS reaches every bridge

- **WHEN** `pnpm bridge:sync` runs
- **THEN** all five bridge packages SHALL receive the same `popup.css` and `bridge-popup-shell.js`, and no bridge SHALL retain a private popup stylesheet

### Requirement: Guard and CI coverage across all bridges

The bridge privacy-surface guard SHALL cover every bridge package, with the
`content.js` allowlist section applying only to bridges that ship an
integration-site content script and the `manifest.prod.json` section
applying only to bridges that have one. The stale-threshold parity guard
SHALL verify the vendored popup snapshot module's
`STALE_SNAPSHOT_THRESHOLD_DAYS` literal against
`packages/core/src/protocol/profile-snapshot.ts` for every bridge that
vendors that module, deriving that bridge list from `BRIDGE_CORE_MASTERS`
rather than a hardcoded list. Each bridge's popup message table SHALL be
key-for-key identical to its `_locales/en/messages.json` (minus the
manifest-only `extName`/`extDescription` keys), and each `--kd-*` literal in the
popup shell SHALL equal its `styles/brand-tokens.css` `.dark` source; both
invariants SHALL be enforced mechanically. Every bridge's vitest suite SHALL run
in the CI test matrix and SHALL cover its popup.

#### Scenario: Whoop popup outbound URL is caught

- **WHEN** an absolute `http(s)://` URL is introduced as a fetch argument in `packages/whoop-bridge/popup.js`
- **THEN** `check-bridge-privacy-surface.mjs` SHALL fail against the golden fixture

#### Scenario: Stale threshold divergence is caught in the snapshot module

- **GIVEN** `STALE_SNAPSHOT_THRESHOLD_DAYS` changes in `@kaiord/core`
- **WHEN** the stale-threshold parity guard runs before the snapshot-module master is updated and re-synced
- **THEN** it SHALL fail for every bridge that vendors the snapshot module

#### Scenario: A popup string added to only one of the two tables fails lint

- **GIVEN** a message key added to a bridge's `_locales/en/messages.json` but not to its `KAIORD_POPUP_MESSAGES` fallback table
- **WHEN** `pnpm test:scripts` runs
- **THEN** `check-bridge-popup-message-parity.test.mjs` SHALL fail, naming the bridge and the missing key

#### Scenario: A repainted brand token leaves the popups stale

- **GIVEN** a colour changes in the `.dark` block of `styles/brand-tokens.css`
- **WHEN** `pnpm test:scripts` runs before the popup master is re-copied
- **THEN** `check-bridge-popup-tokens-parity.test.mjs` SHALL fail, naming the diverging `--kd-*` token and both values

#### Scenario: A bridge suite regression is visible in CI

- **WHEN** a change breaks a test in any bridge package's vitest suite
- **THEN** the CI test matrix SHALL run that suite and fail the workflow

### Requirement: Packaging compatibility

Vendored runtime files SHALL be top-level `*.js` (plus `popup.css`) inside
each bridge package so `scripts/package-extension.sh` includes them without
modification; vendored test masters live under `test/` and are never
packaged. The packaging script SHALL NOT need to resolve imports, workspace
dependencies, or perform any build step to produce a complete extension zip.
Because every bridge's `popup.html` now links the vendored `popup.css`, the
packaging script SHALL verify each zip contains it.

#### Scenario: Packaged zip is self-contained

- **WHEN** `scripts/package-extension.sh` packages a bridge that uses the vendored core
- **THEN** the zip contains every vendored runtime file at its root, no `test/` files, and the extension loads in Chrome with no missing-script errors

#### Scenario: A zip without the popup stylesheet fails packaging

- **WHEN** `scripts/package-extension.sh` produces a zip whose listing has no `popup.css`
- **THEN** it SHALL exit non-zero rather than publish an unstyled popup
