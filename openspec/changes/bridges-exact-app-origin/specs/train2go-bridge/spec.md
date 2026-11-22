## MODIFIED Requirements

### Requirement: Extension manifest

The extension SHALL target Chrome (Chromium-based browsers) only using Manifest V3.

The extension SHALL require the following permission:

- `tabs` — query for Train2Go tabs

Host permissions SHALL include `https://app.train2go.com/*`.

The `externally_connectable` field SHALL declare SPA origins: `http://localhost:5173/*`, `http://localhost:5174/*`, and `https://kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48, and 128. The `action.default_icon` field SHALL reference sizes 48 and 128.

A production variant (`manifest.prod.json`) SHALL exist that excludes localhost origins from `externally_connectable`.

The extension SHALL NOT require `storage`, `webRequest`, or any permission beyond `tabs`.

#### Scenario: Extension loads with minimal permissions

- **WHEN** the extension is installed
- **THEN** it registers only the `tabs` permission and declares `https://app.train2go.com/*` as host permission

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48, and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128

### Requirement: Runtime extension ID announcement on SPA origins

The extension SHALL inject a content script (`kaiord-announce.js`) at `document_start` on SPA origins (`https://kaiord.com/*` and, in dev, `http://localhost/*`). The script SHALL post a `KAIORD_BRIDGE_ANNOUNCE` message via `window.postMessage` to the page's own origin so the SPA can discover the extension's runtime ID without hardcoding it.

The announcement payload SHALL include: `type: "KAIORD_BRIDGE_ANNOUNCE"`, `bridgeId: "train2go-bridge"`, `extensionId: chrome.runtime.id`, `name: "Train2Go"`, `version` (from manifest), `protocolVersion: 1`, and `capabilities: ["read:training-plan"]`.

The script SHALL re-announce when it receives a `KAIORD_BRIDGE_DISCOVER` message from the page (`event.source === window`).

The production manifest (`manifest.prod.json`) SHALL only declare `https://kaiord.com/*` as the announce-script match; localhost origins SHALL NOT be present in the production build.

#### Scenario: SPA loads on kaiord.com

- **WHEN** the SPA loads on `https://kaiord.com/*` and the extension is installed
- **THEN** the announce content script posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId: "train2go-bridge", extensionId, ... }` to the page so the SPA can register the bridge

#### Scenario: SPA requests rediscovery

- **WHEN** the SPA dispatches `window.postMessage({ type: "KAIORD_BRIDGE_DISCOVER" }, window.location.origin)`
- **THEN** the announce script re-announces with the same payload
