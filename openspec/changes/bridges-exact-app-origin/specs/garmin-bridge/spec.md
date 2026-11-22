## MODIFIED Requirements

### Requirement: Extension manifest

The extension SHALL target Chrome (Chromium-based browsers) only. Firefox is not supported due to lack of the `externally_connectable` API.

The extension SHALL use Manifest V3 and SHALL request `storage` as its ONLY `permissions` entry. It SHALL NOT request `webRequest` (nothing is intercepted) and SHALL NOT request `tabs` (nothing reads tab URLs; opening a tab needs no permission). Every additional permission is a Chrome Web Store review surface, so the set is deliberately minimal and any addition SHALL be justified in `privacy-justification.md`.

Host permissions SHALL be exactly `https://connect.garmin.com/*`, `https://connectapi.garmin.com/*` and `https://sso.garmin.com/*` — the sign-in origin the token is minted from, the API origin the reads and writes go to, and the dashboard the popup opens.

Content scripts SHALL be injected on SPA origins ONLY (`https://kaiord.com/*` and, in dev, `http://localhost:5173/*` and `http://localhost:5174/*`), loading `bridge-identity.js` before `kaiord-announce.js` at `document_start`. No content script SHALL be injected on any Garmin origin.

The `externally_connectable` field SHALL declare `http://localhost:5173/*`, `http://localhost:5174/*` and `https://kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48 and 128. The `action.default_icon` field SHALL reference sizes 48 and 128 (Chrome does not use 16px for the action icon).

A production variant (`manifest.prod.json`) SHALL exist that strips every localhost origin — from both the announce content-script matches and `externally_connectable` — and is used for Chrome Web Store packaging.

#### Scenario: Extension requests only storage

- **WHEN** the extension manifest is read
- **THEN** `permissions` SHALL be exactly `["storage"]`, containing neither `webRequest` nor `tabs`

#### Scenario: No content script runs on Garmin

- **WHEN** the manifest's `content_scripts` matches are read
- **THEN** every entry SHALL match a Kaiord SPA origin only, and none SHALL match a `garmin.com` origin

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48 and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128

### Requirement: Runtime extension ID announcement on SPA origins

The extension SHALL inject `bridge-identity.js` followed by `kaiord-announce.js` at `document_start` on SPA origins, and the announce script SHALL post a `KAIORD_BRIDGE_ANNOUNCE` message via `window.postMessage` to the page's own origin so the SPA can discover the extension's runtime ID without hardcoding it.

The announcement payload SHALL include `type: "KAIORD_BRIDGE_ANNOUNCE"`, `bridgeId: "garmin-bridge"`, `extensionId: chrome.runtime.id`, `name: "Garmin Connect"`, `version` (from the manifest), `protocolVersion: 1`, and `capabilities: ["write:workouts", "read:activities", "write:body"]`. The identity values SHALL match `BRIDGE_MANIFEST` in `background.js`, enforced by `scripts/check-bridge-core-parity.test.mjs`.

The script SHALL re-announce when it receives a `KAIORD_BRIDGE_DISCOVER` message from the page (`event.source === window`).

The production manifest SHALL declare only `https://kaiord.com/*` as the announce-script match.

Capability presence alone SHALL NOT drive SPA affordances; the SPA additionally requires an enabled `IntegrationPolicy` row (see `spa-bridge-protocol`, Requirement: Policy resolution).

#### Scenario: Garmin Bridge announces its three capabilities

- **WHEN** the extension is installed and announces via its content script
- **THEN** the announcement SHALL include `capabilities: ["write:workouts", "read:activities", "write:body"]`
- **AND** the SPA SHALL register the bridge as VERIFIED via the existing ping/verify flow

#### Scenario: SPA requests rediscovery

- **WHEN** the SPA dispatches `window.postMessage({ type: "KAIORD_BRIDGE_DISCOVER" }, window.location.origin)`
- **THEN** the announce script re-announces with the same payload
