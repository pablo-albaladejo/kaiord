# @kaiord/garmin-bridge

## 10.0.0

### Minor Changes

- d21424e: Adopt the vendored bridge-core masters (`packages/_shared/bridge-core/`): shared response envelope/dispatch factories, announce content script (driven by a per-bridge `bridge-identity.js`), popup utilities, snapshot popup module + shared CSS (garmin/train2go), profile-snapshot validator, and test mocks — synced byte-identically via `pnpm bridge:sync` and locked by a parity guard. External dispatch is now uniformly origin-pinned and action-allowlisted in every bridge (previously only snapshot actions were origin-checked in garmin/train2go); allowlists equal each bridge's full external action surface, so SPA flows are unaffected. The train2go announce message now matches its ping manifest (name + `read:training-zones`), fixing a pre-existing announce/ping divergence.

## 7.2.0

### Minor Changes

- b9ca78e: Re-inject content scripts after extension reload (DX). Chrome MV3 terminates content scripts in existing tabs when the extension is reloaded but does NOT re-inject them automatically — `chrome.tabs.sendMessage` to those tabs fails with "Receiving end does not exist", silently breaking `train2goFetch` / `garminFetch` until the user closes and reopens every Train2Go / Garmin tab. Both bridges now run a re-inject pass on `chrome.runtime.onInstalled`, programmatically injecting their content script into matching open tabs whose URL is covered by `host_permissions`. Adds the `scripting` permission and goldens are updated accordingly.
- 07f9c7d: Wire the new SPA → Bridge protocol actions: both bridges now accept `profile-snapshot` (validated, persisted to `chrome.storage.local`) and `profile-snapshot-clear` (idempotent purge of `profileSnapshot` + `lastWeeklyRollup`). Each bridge ships a hand-rolled plain-JS structural validator that mirrors the Zod schema from `@kaiord/core` and rejects prototype-pollution payloads, oversized JSON (>8192 UTF-16 code units), unsupported schema versions, and unknown enum values; parity is enforced by a shared fixture set loaded from `@kaiord/core/test-utils`. The external-message listener gates the snapshot actions on `sender.origin` matching `externally_connectable.matches` (defense-in-depth). Train2Go's manifest gains the `storage` permission. A new `scripts/check-bridge-privacy-surface.mjs` mechanical guard locks the CWS-relevant surface (manifest permissions + host_permissions + content_scripts.matches + externally_connectable.matches + content-script ALLOWED arrays + popup.js fetch URLs) against drift via a checked-in golden snapshot.
- fcdd6c9: Redesign the Garmin bridge popup as an identity card. Drops the `Check Session` and `List Workouts` buttons; auto-fetches on open with bounded per-phase timeouts (snapshot 1 s, ping 3 s); the Retry affordance only appears on user-resolvable failures. Renders the athlete card from the cached `profileSnapshot` (FTP, threshold pace, LTHR, max HR, weight, active sport) with a `prefers-reduced-motion`-aware loading skeleton, "Updated <relative time>" line, distinct stale/empty/no-snapshot placeholders, and a 0/1/≥2 field-count rendering rule. The header is a 3-column grid with a reserved 16×16 slot for a refresh-icon button — `visibility: hidden` during loading and on the failure path so the title row never reflows. CTA hierarchy enforces a single primary "Open editor" button + a secondary "Open Garmin Connect" link.

  Shared structural CSS lives at `packages/_shared/popup/popup.css`; `pnpm popup:sync` copies it byte-for-byte into the bridge, and `scripts/check-popup-css-parity.test.mjs` fails the lint job if either copy drifts.

- 352e9ed: Bridge popup trigger wiring + lastPushReceipt + dead-code sweep.

  SPA: `useProfileSnapshotPush` (mounted in `App`) now reads the discovered bridges from the in-memory `bridgeDiscovery` singleton (the actual source of truth) instead of an empty Dexie table that no other code wrote to. The hook drives a shared `OperationQueue` that enforces the 60/h-per-bridge cap from the SPA Bridge Protocol spec, and parks a `pendingClear` flag when the active profile is deleted while no bridges are reachable so `profile-snapshot-clear` still fires the next tick a bridge appears. The previously-unused `dexie-bridge-repository`, `bridge-registry`/`-helpers`/`-prune`, `push-active-profile`, and `snapshot-pusher` modules are removed; the in-memory singleton is the only registry.

  Bridges (Garmin + Train2Go): `persistSnapshot` now writes `lastPushReceipt: { at, name }` to `chrome.storage.local` atomically with the snapshot, and `clearSnapshot` removes it alongside `profileSnapshot` and `lastWeeklyRollup`. The Garmin popup's "Last push · N min ago — <name>" line now actually renders; before, the writer side was never wired and the popup silently fell back to omitting the line.

### Patch Changes

- b9ca78e: Make `kaiord-announce.js` resilient to "Extension context invalidated". When the bridge is reloaded, Chrome terminates the script's runtime context but does not remove its `window.message` listener (the listener is bound to the page, not the extension). The next `KAIORD_BRIDGE_DISCOVER` would otherwise call `chrome.runtime.id` / `chrome.runtime.getManifest()` and throw an uncaught error in the page console. The listener now detects the invalidated context, bails, and removes itself so future discover requests are silent — the new content script (re-injected on `onInstalled` for tabs covered by `host_permissions`, or via the next page load otherwise) takes over cleanly.
- b9ca78e: Fix the "Open editor" link in both bridge popups to point at `https://kaiord.com/editor/` instead of the non-existent `https://app.kaiord.com/`.
- 08a8195: Regenerate extension icons from a single shared SVG master at `packages/_shared/extension-icon/master.svg`. Both bridges now use a Kaiord hex silhouette with a per-bridge accent: Garmin → blue (`#007cc3`), Train2Go → coral (`#f74464`) — visually distinguishable in the browser toolbar at every size. Adds `pnpm icons:build` and `pnpm lint:icons-distinct` to the repo, with a mechanical guard that fails the lint job if the icons drift below the inter-bridge mean-color-delta or accent-mass thresholds.
- 19537b1: Garmin popup now renders the "Last push · X ago — <name>" line in the disconnected state too. Previously the rollup region was only painted on the happy path (ping ok AND `gcApi.ok`), so users with an expired Garmin Connect session never saw their SPA→bridge sync timestamp even though the data was already in `chrome.storage.local`. The receipt is independent of the upstream Garmin session — it tells the user when the SPA last updated their profile.

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

## 0.2.0

### Minor Changes

- 44de03e: Prepare Chrome Web Store publishing: production icons, dual manifests, packaging script, privacy policy, and store listing
- 20b6fe2: Automate Chrome Web Store publishing via GitHub Actions with version sync and git-tag-based release detection

### Patch Changes

- bd2a385: fix: include bridge manifest in ping response so SPA can register the bridge
