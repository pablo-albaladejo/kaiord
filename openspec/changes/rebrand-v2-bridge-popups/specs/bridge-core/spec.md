## MODIFIED Requirements

### Requirement: One popup shell across all bridges

Every bridge popup SHALL be assembled from the vendored shell: the 340px dark
`popup.css` plus the `bridge-popup-shell.js` renderers
(`renderStatusBlock`, `renderChips`, `renderConsequence`, `renderSkeleton`,
`renderCtas`). The ONLY per-bridge visual variable SHALL be the header monogram
glyph, declared in that bridge's `popup.html`; no provider brand hue SHALL
appear in any bridge package. The shell's `--kd-*` custom properties SHALL carry
the values of their `styles/brand-tokens.css` `.dark` counterparts, and the
popups SHALL be dark-only — no light-theme block is specified for them. Every
string a renderer displays SHALL arrive as a message key resolved through that
bridge's own `KAIORD_POPUP_MESSAGES` table and `_locales/en/messages.json`, so
no brand name, host, or capability token enters a master.

#### Scenario: A per-bridge monogram is the only divergence

- **WHEN** comparing the popup stylesheets of any two bridges
- **THEN** the files SHALL be byte-identical, and their rendered difference SHALL be limited to the monogram glyph set by each `popup.html`

#### Scenario: No provider hue survives in a bridge package

- **WHEN** scanning any bridge's `popup.html` and `popup.css` for `#rrggbb` literals
- **THEN** the only hex literals present SHALL be the shared `--kd-*` declarations in the popup stylesheet, and no `--accent` custom property SHALL be declared anywhere

#### Scenario: Status names the state, its cause, and its fix

- **GIVEN** a bridge whose upstream session is not usable
- **WHEN** its popup resolves the session probe
- **THEN** the status block SHALL render a mark, a verdict, and one cause sentence, and the primary CTA SHALL be the sign-in link for that source with the Kaiord editor as the secondary link

#### Scenario: A state needing the user is an icon and a sentence

- **GIVEN** a bridge whose session has broken after having worked
- **WHEN** its popup renders that state
- **THEN** the status mark SHALL be an alert icon rather than a coloured dot, because the palette defines no success or warning hue

#### Scenario: A broken state dates its own start

- **GIVEN** a bridge whose stored health record carries a `brokenSince` stamp
- **WHEN** its popup renders the broken state
- **THEN** the cause sentence SHALL name the date that stamp holds, and SHALL claim only that nothing has reached Kaiord since it — not that the upstream session expired then

#### Scenario: An unobserved bridge invents no date

- **GIVEN** a bridge with no stored health record, because it has never once been observed working
- **WHEN** its popup renders the broken state
- **THEN** it SHALL render the dateless cause sentence rather than substituting the current time

#### Scenario: A repaired bridge forgets its old outage

- **GIVEN** a bridge whose health record carries a `brokenSince` stamp
- **WHEN** a later probe succeeds
- **THEN** the stamp SHALL be cleared, so a subsequent failure dates the new outage rather than the first one

#### Scenario: A healthy session promotes the editor

- **GIVEN** a bridge whose upstream session is usable
- **WHEN** its popup resolves the session probe
- **THEN** the primary CTA SHALL open the Kaiord editor and the secondary link SHALL open the upstream source

#### Scenario: Capability chips use the managed-data-type labels

- **WHEN** a popup renders its "Feeds Kaiord" chips
- **THEN** each chip label SHALL be a `MANAGED_DATA_REGISTRY` display label for a type that bridge actually moves, listed by a static array in that bridge's own `popup.js`

#### Scenario: The checking state does not reflow the popup

- **GIVEN** a popup that fills regions beyond its chips and footer
- **WHEN** it opens and before its session probe resolves
- **THEN** it SHALL render a skeleton placeholder in every region any of its resolved states fills, so resolving the probe SHALL NOT change the popup's height

### Requirement: Vendored shared masters with byte-for-byte parity

Shared bridge runtime code SHALL live as master files under
`packages/_shared/bridge-core/` and SHALL be vendored into each consuming
bridge package by `scripts/sync-bridge-core.mjs` (runtime masters as
top-level flat files, test masters into the bridge's `test/`). Every
vendored copy MUST be byte-identical to its master;
`scripts/check-bridge-core-parity.test.mjs` SHALL fail the lint job on any
drift. Each master declares its consumer set: the envelope, announce core,
popup utilities, popup shell renderers, popup health record, popup CSS, chrome
mock, and the envelope + popup-shell unit tests are vendored by all bridges; the
popup snapshot module and profile-snapshot validator are vendored only by
bridges with a profile-snapshot popup (garmin, train2go today).

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

#### Scenario: The health module reaches every bridge

- **WHEN** `pnpm bridge:sync` runs
- **THEN** all five bridge packages SHALL receive a byte-identical `bridge-popup-health.js`, loaded by each `popup.html` before that bridge's `popup.js`

## ADDED Requirements

### Requirement: Bridge health record

Each bridge SHALL persist, under the `bridgeHealth` key of
`chrome.storage.local`, the outcome boundary of its session probes:
`brokenSince` — the epoch stamp of the first probe observed to fail since the
last success — and `lastOkAt`, the stamp of the most recent success. The record
SHALL be written by the popup, which is what runs the probe, so that no
background message action is added to either the internal or the external
allowlist. An absent record SHALL be read as "never observed" rather than as an
error, so a fresh install needs no migration.

#### Scenario: The first observed failure is stamped

- **GIVEN** a bridge whose stored record has no `brokenSince`
- **WHEN** a session probe fails
- **THEN** `brokenSince` SHALL be set to that probe's time, and SHALL NOT be overwritten by subsequent failures

#### Scenario: A success clears the outage

- **WHEN** a session probe succeeds
- **THEN** `lastOkAt` SHALL be set to that probe's time and `brokenSince` SHALL be cleared

#### Scenario: No new message action is introduced

- **WHEN** the privacy-surface and action-allowlist guards run against every bridge
- **THEN** the internal and external action surfaces SHALL be unchanged by the health record, which the popup reads and writes directly

#### Scenario: Storage failure degrades to the dateless copy

- **GIVEN** `chrome.storage.local` rejects or is unavailable
- **WHEN** the popup renders a broken state
- **THEN** it SHALL render the dateless cause sentence rather than failing to render the popup
