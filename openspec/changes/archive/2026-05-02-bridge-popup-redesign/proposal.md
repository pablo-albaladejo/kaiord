> Completed: 2026-05-02

## Why

Both browser-extension bridges (`@kaiord/garmin-bridge` and `@kaiord/train2go-bridge`) ship the **identical icon** (dark navy hex, blue inner mark) and a near-identical popup that surfaces a single low-value action button (`List Workouts`, `Read This Week`). With both extensions pinned to the toolbar at the same time, users cannot tell them apart at a glance, and clicking either popup yields information that is neither glanceable nor athlete-relevant. The popup is a debug tool, not an identity card.

The redesign turns the popup into a quick "who am I, is the connection alive, and what is its scope" readout — the data the user actually wants when they reach for the toolbar.

## What Changes

- Recolor extension icons from a single SVG master so the two bridges are visually unambiguous in the toolbar:
  - Garmin Bridge → blue accent (`#007cc3`, Garmin brand-aligned).
  - Train2Go Bridge → coral accent (`#f74464`, matches the existing popup brand color).
- **BREAKING (UI)** Remove the `List Workouts` button from the Garmin popup and the `Read This Week` button from the Train2Go popup. The previous flows are not advertised public actions; popup behavior is internal UX.
- Replace both popups with an identity-card layout:
  - Connection state (auto-fetched on popup open).
  - Athlete summary (FTP, threshold pace, LTHR, max HR, active sport) sourced from the SPA, not from the upstream.
  - Per-bridge rollup: T2G shows week summary (sessions planned/done, week training load); Garmin shows last-push receipt + workout-library count.
  - Deep links: "Open Garmin Connect" / "Open Train2Go" / "Open editor".
- Introduce a new SPA→Bridge action `profile-snapshot` over `externally_connectable`. The SPA writes the active profile (name, body weight, active sport, per-sport thresholds and zone summaries) into the bridge's `chrome.storage.local`. The popup reads it. Bridges remain dumb pipes — they cache and surface the snapshot, they do not own profile logic.
- Introduce a complementary `profile-snapshot-clear` action so the popup cache is purged when the user deletes the active profile (right-to-be-forgotten path).
- Auto-fetch on popup open with a 3-second per-phase wall-clock timeout: `Check Session` is no longer an always-visible action. It re-appears as `Retry` only after a failed fetch. A small refresh-icon affordance in the popup header provides a power-user manual re-fetch on the success path.
- Coach name (T2G) sourced from the existing `parsePingJson` if the upstream payload exposes it; if not present, the field is hidden — no new allowlist entries.
- Garmin display name: only surfaced if obtainable from data already returned by the existing `/workout-service/workouts` envelope. Otherwise omitted; **no allowlist expansion** in this change.
- Train2Go's manifest gains the `storage` permission (the Garmin manifest already has it). This is the only CWS-metadata change in this proposal — no `host_permissions`, content-script allowlists, fetched URLs, or `externally_connectable.matches` change.

## Capabilities

### New Capabilities

_None._ The work extends existing bridge capabilities and the SPA bridge protocol.

### Modified Capabilities

- `garmin-bridge`: popup UI requirements are added (today the spec is silent on popup contents); accepts new `profile-snapshot` and `profile-snapshot-clear` external messages; icon asset requirement is added; prototype-pollution rejection requirement on the snapshot validator.
- `train2go-bridge`: existing "Popup UI" requirement is rewritten — drops the `Read This Week` button, adds athlete-summary rendering, makes `Check Session` a retry-only affordance; the existing "Extension manifest" requirement is rewritten to add the `storage` permission (required for the snapshot cache); accepts the new `profile-snapshot` and `profile-snapshot-clear` actions; icon asset requirement is added; prototype-pollution rejection requirement on the snapshot validator.
- `spa-bridge-protocol`: defines the new `profile-snapshot` and `profile-snapshot-clear` action shapes (request payloads, ack envelope, snapshot expiry, de-duplication, concurrent-push semantics, over-quota response) and the contract that the SPA SHALL push a snapshot after profile mutations and after extension reconnect.
- `extension-store-publish`: existing "Production extension icons" requirement is rewritten to allow per-bridge accent variants (Garmin blue, Train2Go coral) while preserving the shared Kaiord silhouette and brand-compliance.

## Impact

- **Affected packages**: `@kaiord/core` (hosts the cross-cutting protocol contract — gains four new public exports: `profileSnapshotSchema` + `ProfileSnapshot` type + `STALE_SNAPSHOT_THRESHOLD_DAYS = 7` constant + `fingerprintSnapshot(snapshot)` pure function; AND a new fixture export `snapshotFixtures` from `@kaiord/core/test-utils`, which requires verifying the package's `exports` field exposes `./test-utils` as a sub-path), `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`, `@kaiord/workout-spa-editor` (consumes the schema, derives + pushes the snapshot).
- **Affected code**:
  - `packages/{garmin,train2go}-bridge/popup.{html,js}` rewritten.
  - `packages/{garmin,train2go}-bridge/background.js` gains a `profile-snapshot` action handler and a popup data-loader that aggregates `ping` + cached snapshot + per-bridge rollup.
  - `packages/{garmin,train2go}-bridge/icons/` regenerated from a new shared SVG master under `packages/{...}-bridge/icons/master.svg` (or a shared root-level master); a `pnpm icons:build` script bakes both color variants × three sizes.
  - SPA editor: a small effect that, on profile change AND on bridge connect, pushes a `profile-snapshot` to each connected extension via the existing bridge registry.
- **Hexagonal layering**:
  - The `ProfileSnapshot` DTO + Zod schema lives in `@kaiord/core` (cross-cutting contract owned by the SPA Bridge Protocol capability). The SPA derives snapshots from its domain `Profile`. **At runtime the bridges have NO dependency on `@kaiord/core`** — each bridge ships a hand-rolled plain-JS structural validator parity-tested against the Zod schema (see design D3). The dependency on `@kaiord/core/test-utils` is exclusively a `devDependencies` for the parity test; each bridge's `package.json` MUST keep `@kaiord/core` out of `dependencies`.
  - SPA owns the profile (domain). The push is pure outbound I/O via the existing bridge port — confirmed compatible without a port-surface change because `sendBridgeMessage(extensionId, message: unknown)` in `packages/workout-spa-editor/src/adapters/bridge/bridge-transport.ts` already accepts arbitrary action payloads.
  - Bridges remain infrastructure. They cache the snapshot in `chrome.storage.local`; the bridge-side validator is an input adapter guard at the boundary, not domain logic.
  - No new ports introduced — the existing `BridgePort` already supports arbitrary actions through the registered manifest.
- **Specs touched**: `openspec/specs/garmin-bridge/`, `openspec/specs/train2go-bridge/`, `openspec/specs/spa-bridge-protocol/`, `openspec/specs/extension-store-publish/`. Each receives a delta in `openspec/changes/bridge-popup-redesign/specs/<capability>/spec.md`.
- **CWS / privacy**:
  - **No** change to `host_permissions`, content-script `ALLOWED` lists, fetched URLs, or `externally_connectable.matches`. A mechanical guard (`scripts/check-bridge-privacy-surface.mjs`) locks these surfaces against drift via a checked-in golden snapshot.
  - **One** CWS metadata edit: the Train2Go bridge gains the `storage` permission so the popup snapshot cache is writable. A one-line privacy-justification addition is required on the Train2Go store listing ("Stores the active Kaiord profile snapshot locally so the popup can render athlete data without a network call"). The Garmin bridge already declares `storage`; no edit needed there.
  - The `parsePingJson` extractor for an opportunistic `coachName` field does not change the network call, but does change the response shape passed back to the SPA. The SPA's `parseManifestFromPing` strips unknown fields via Zod, so the registry path is unaffected; non-registry consumers MUST NOT log raw `response.data`.
  - Per-bridge `chrome.storage.local` holds athlete PII (name, body weight, FTP, HR data) unencrypted on disk. Acceptable for the data class (PII, not credentials); documented in `design.md` Risks. The privacy policy mentions extension-local caching as a permitted storage mechanism — no policy text change.
  - If a future change adds Garmin user-profile pulls, that is out of scope here and tracked separately.
- **Breaking changes**: none to the SPA↔Bridge protocol (only additive — a new action). The popup UI changes are user-visible but internal; no published API surface is affected.
- **Build / CI**: a new `pnpm icons:build` script with a co-located `*.test.mjs` (per `scripts/` convention). The husky `pre-commit` hook and `pnpm test:scripts` lint job pick it up automatically. No package additions, so `.changeset/config.json` and the release workflows are unaffected.
- **Changeset**: minor bumps for both bridge packages (new `profile-snapshot` action + popup redesign) and a patch for the SPA editor (adds the snapshot-push effect).
