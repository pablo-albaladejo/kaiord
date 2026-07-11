> Tasks: 43 completed, 0 deferred

## 1. Sync + parity tooling (repo scripts)

- [x] 1.1 Write failing `scripts/sync-bridge-core.test.mjs` (node:test): given a fixture master set and bridge dirs, sync copies every master byte-for-byte to every target (top-level files; `test/` masters into each bridge's `test/`); targets missing from a bridge's file list are skipped; exit non-zero on missing master (RED)
- [x] 1.2 Implement `scripts/sync-bridge-core.mjs`: `MASTERS × BRIDGES` table (masters under `packages/_shared/bridge-core/`, incl. `popup.css`; per-master target lists — snapshot module targets garmin/train2go only), byte-copy, `pnpm bridge:sync` script in root `package.json` (GREEN)
- [x] 1.3 Write failing `scripts/check-bridge-core-parity` assertions: byte-drift detection, master purity (no per-bridge id/name/capability values inside masters), and identity↔manifest consistency (`bridge-identity.js` `id`/`name`/`capabilities` equal `BRIDGE_MANIFEST`'s in the same bridge's `background.js`) (RED)
- [x] 1.4 Implement `scripts/check-bridge-core-parity.test.mjs` covering the three assertion families; wire into `pnpm test:scripts` / lint like `check-popup-css-parity` today (GREEN)
- [x] 1.5 Delete `scripts/sync-popup-css.mjs` + `scripts/check-popup-css-parity.test.mjs`; repoint `pnpm popup:sync` consumers to `pnpm bridge:sync` (REFACTOR)

## 2. Bridge-core masters (extraction — no bridge consumes them until §3)

- [x] 2.1 Create `packages/_shared/bridge-core/bridge-envelope.js`: `sendResult`/`sendError` envelope builders (full field set incl. `needsReauth`/`resetSeconds`), shared SPA-origin regex, and factories `createDispatch({ handleAction, protocolVersion })` and `createExternalDispatch({ dispatch, externalActions, protocolVersion })` (origin-pins every external sender, rejects non-allowlisted actions before dispatch); dual `globalThis`/`module.exports` export idiom
- [x] 2.2 Create `packages/_shared/bridge-core/kaiord-announce.js` (identity-free core reading `globalThis.KAIORD_BRIDGE_IDENTITY`) — announce message shape unchanged per `bridge-runtime-discovery`
- [x] 2.3 Create `packages/_shared/bridge-core/bridge-popup-utils.js` (all three bridges): `msg`/`applySubs` over a per-bridge message table, `$`, `withTimeout`, `relativeAgo`/`formatRelative`, `setStatus`, `renderRetry`
- [x] 2.4 Create `packages/_shared/bridge-core/bridge-popup-snapshot.js` (garmin/train2go only): `isFresh` + `STALE_SNAPSHOT_THRESHOLD_DAYS` literal, snapshot field collection, athlete-card rendering
- [x] 2.5 Create `packages/_shared/bridge-core/profile-snapshot.js` from garmin's `THRESHOLD_SPECS` shape
- [x] 2.6 Create `packages/_shared/bridge-core/test/chrome-mock.js` superset (storage.local/session, identity, tabs, scripting, webRequest, runtime messaging) — union of the three existing mocks; synced into each bridge's `test/`, never packaged (packaging globs top-level only)
- [x] 2.7 Move `packages/_shared/popup/popup.css` to `packages/_shared/bridge-core/popup.css` (same content; sync table is the reference)

## 3. Adopt in garmin-bridge

- [x] 3.1 Add `bridge-identity.js`; `manifest.json` + `manifest.prod.json` announce entry loads `["bridge-identity.js", "kaiord-announce.js"]` (identity is NOT added to the `connect.garmin.com` `content.js` entry); delete identity constants from announce
- [x] 3.2 Write failing external-dispatch tests for the tightened behavior (D4): positive paths with allowed-origin senders for `ping`/`list`/`activities`/`push`/`open-garmin`/`profile-snapshot`/`profile-snapshot-clear`; rejection for foreign origin and for non-allowlisted action — replaces the empty-sender `{}` expectations at `test/background.test.js:157,166,424` (RED)
- [x] 3.3 `background.js`: `importScripts("bridge-envelope.js")`, wire `createDispatch`/`createExternalDispatch` with garmin's `EXTERNAL_ACTIONS` list, delete local envelope/dispatch/origin-guard, keep `BRIDGE_MANIFEST` literal (version + capabilities) and all site logic (session/CSRF, webRequest) (GREEN)
- [x] 3.4 `popup.html` loads `bridge-popup-utils.js` + `bridge-popup-snapshot.js` before `popup.js`; delete shell code from `popup.js`, keep garmin rendering + EN message table; update `vitest.config.js` `coverage.include` for the vendored modules deliberately
- [x] 3.5 Replace `profile-snapshot.js` and `test/chrome-mock.js` with vendored copies; run `pnpm bridge:sync`; full garmin-bridge suite green (only external-dispatch expectations changed, per D4)

## 4. Adopt in train2go-bridge

- [x] 4.1 Write failing external-dispatch tests for the tightened behavior, mirroring §3.2 with train2go's allowlist (`ping`/`read-week`/`read-day`/`read-details`/`open-train2go`/`profile-snapshot`/`profile-snapshot-clear`) (RED)
- [x] 4.2 Same conversion as §3 (identity file + announce entry, envelope factories, popup utils + snapshot module, vendored profile-snapshot — train2go converges onto garmin's `THRESHOLD_SPECS` shape, chrome-mock, coverage.include update); suite green (only external-dispatch expectations changed) (GREEN)

## 5. Adopt in whoop-bridge (shared utilities, NOT the snapshot shell)

- [x] 5.1 Identity file + announce core adoption; restructure `background.js` onto the vendored envelope factories (whoop's implementation seeded the master, but its tests restructure too — they currently reach same-file functions); `EXTERNAL_ACTIONS` unchanged (`ping`/`status`/`connect`/`whoop-fetch`); suite green
- [x] 5.2 Write failing tests for the shared popup utilities in the whoop suite (`msg` chrome.i18n-first + table fallback, `applySubs`, `relativeAgo` buckets) (RED)
- [x] 5.3 Rework whoop `popup.html`/`popup.js` to consume `bridge-popup-utils.js`, deleting whoop's duplicated utility code; the OAuth/creds structure AND whoop's own `popup.css` stay (surface scheduled for the session-piggyback rewrite); whoop does NOT vendor `bridge-popup-snapshot.js` or the shared `popup.css` (GREEN)
- [x] 5.4 Update whoop `vitest.config.js` `coverage.include` for the vendored modules (REFACTOR)

## 6. Guards + CI coverage

- [x] 6.1 Write failing update to `scripts/check-bridge-privacy-surface.test.mjs`: whoop included; `content.js` allowlist section applies only to bridges shipping a site content script; `manifest.prod.json` read is optional for bridges without one (whoop) (RED)
- [x] 6.2 Extend `check-bridge-privacy-surface.mjs` `BRIDGES` to all three with optional prod-manifest/content sections; regenerate `scripts/fixtures/bridge-privacy-surface.json`; assert popup fetch-args rule now covers whoop (GREEN)
- [x] 6.3 Retarget `scripts/check-bridge-stale-threshold-parity.test.mjs` at the vendored `bridge-popup-snapshot.js` for garmin + train2go (whoop does not vendor it; source of truth stays `packages/core/src/protocol/profile-snapshot.ts`)
- [x] 6.4 Add `train2go-bridge` and `whoop-bridge` to the `.github/workflows/ci.yml` test matrix and the coverage-threshold `case` (60%), closing the gap where 2/3 bridge suites never ran in CI
- [x] 6.5 Confirm `scripts/sync-extension-version.mjs` and `packages/workout-spa-editor/src/integrations/integration-registry-capability-parity.test.ts` pass unchanged (BRIDGE_MANIFEST literals untouched)

## 7. SPA integration ports (workstream B — starts only after §3–§6 are shippable)

- [x] 7.1 Create `packages/workout-spa-editor/src/application/integrations/integration-ports.ts` following the existing `CoachingTransport` port precedent: function types for the operations that port does not cover (`FetchActivities`, `PushWorkout`, `PushProfileSnapshot`) over existing DTOs — types only, no runtime code; coaching-plan/zones reads stay on `CoachingTransport`
- [x] 7.2 Write the transport-encapsulation assertion (`bridge-transport-encapsulation.test.ts`): `chrome.runtime.sendMessage`/`connect` must not appear under `src/` outside `adapters/bridge/` — starts RED against the two known violators, `store/garmin-extension-transport.ts:25` and `store/train2go-send-message.ts:23` (RED)
- [x] 7.3 Refactor `store/garmin-extension-transport.ts` to route through `sendBridgeMessage` (callers `hooks/garmin-bridge-operations.ts` / `hooks/use-garmin-bridge-action-helpers.ts` keep their APIs); suites green (GREEN)
- [x] 7.4 Refactor `store/train2go-send-message.ts` the same way (`store/train2go-extension-transport.ts` keeps its API); assertion goes green; suites green (GREEN)
- [x] 7.5 Move `adapters/bridge/garmin-activities-transport.ts` → `adapters/garmin/garmin-activities-transport.ts`, typed against its port; update imports; existing tests move with it and stay green
- [x] 7.6 Type the garmin push/list helpers and the profile-snapshot push helper against their ports (`PushWorkout`, `PushProfileSnapshot`); train2go reads stay typed by the existing `CoachingTransport` port (no behavior change; suites green) (REFACTOR)

## 8. Docs

- [x] 8.1 Fix `CLAUDE.md` bridge exception paragraph: cite the `bridge-core` capability spec (vendored flat files) instead of `adapter-contracts` for the packaging convention
- [x] 8.2 Update `packages/_shared/README.md` + `packages/AGENTS.md` (bridge-core masters; vendor idiom now covers runtime code via sync-by-copy, promotion line unchanged) and the three bridges' `AGENTS.md`
- [x] 8.3 Update `scripts/README.md` inventory (new pair, deleted popup-css pair)

## 9. Final validation

- [x] 9.1 pnpm -r test:coverage (thresholds: 80% core, 70% frontend, 60% bridges)
- [x] 9.2 pnpm -r build (zero warnings)
- [x] 9.3 pnpm lint (zero errors/warnings; includes lint:specs, lint:archive, lint:archive-index)
- [x] 9.4 /opsx:verify against all spec scenarios
- [x] 9.5 pnpm exec changeset (patch for the three linked bridge packages)
- [x] 9.6 Update affected domain specs in openspec/specs/ and run pnpm lint:specs
