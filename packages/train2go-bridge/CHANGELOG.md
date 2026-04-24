# @kaiord/train2go-bridge

## 7.1.0

### Minor Changes

- b126d94: Replace build-time `VITE_*_EXTENSION_ID` env vars with runtime bridge
  discovery via content script announcements.

  **Why**: the old flow baked extension IDs into the SPA bundle at build
  time, which coupled each build to a specific install and required new
  developers to edit `.env.local` before extensions could be detected
  (Twelve-Factor III / V violation). The new flow is zero-config for
  users and developers — install the extension and it announces itself
  to the SPA on every navigation.

  **`@kaiord/garmin-bridge` & `@kaiord/train2go-bridge` (minor — user-visible
  discovery change requiring extension reload):**
  - New `kaiord-announce.js` content script injected at
    `document_start` on `https://*.kaiord.com/*` (and
    `http://localhost/*` in dev) posts `KAIORD_BRIDGE_ANNOUNCE` with
    `chrome.runtime.id`, version, and declared capabilities
  - Listens for `KAIORD_BRIDGE_DISCOVER` from the SPA and re-announces
    to handle the service-worker cold-start race
  - Manifest (`manifest.json` + `manifest.prod.json`) adds a second
    `content_scripts` entry for the announce-only script. Existing
    host-scoped scripts (`connect.garmin.com` / `app.train2go.com`)
    are unchanged

  **`@kaiord/workout-spa-editor` (minor — runtime discovery replaces env-var
  coupling):**
  - New `bridge-discovery` adapter listens for announcements on
    `window.message`, verifies each via a ping against the announced
    `extensionId` (manifest schema + `data.id` match + supported
    protocol version), and exposes `getExtensionId(bridgeId)` to the
    rest of the app. Rejects spoofed announcements
  - `useGarminBridgeActions` and the `train2go-store` actions no longer
    read `import.meta.env.VITE_*_EXTENSION_ID`; they call the
    discovery singleton at call time, so the ID updates reactively
    on announcement
  - `useStoreHydration` starts the discovery listener on app boot
  - `VITE_GARMIN_EXTENSION_ID` and `VITE_TRAIN2GO_EXTENSION_ID` are
    removed from `.env.example` — no extension ID env vars required
  - Privacy policy discloses the new announce-only content script
    (and its localhost-dev variant stripped from the production
    manifest); the `check-privacy-policy` lint now allows the
    announce match set and flags missing disclosure

  **Migration note**: users must reload/update both Chrome extensions
  after this release so the new `kaiord-announce.js` content script is
  picked up. After the reload, the SPA auto-detects the extension with
  no additional configuration.

## 0.1.1

### Patch Changes

- 0dc2721: Add Chrome Web Store listing assets and generalize CI publishing for multi-extension support
