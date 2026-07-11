> Completed: 2026-07-11

## Why

Three Chrome extension bridges (`garmin-bridge`, `train2go-bridge`,
`whoop-bridge`) implement the same SPA↔extension protocol
(`spa-bridge-protocol`, `bridge-runtime-discovery`) with copy-adapted code,
and the copies are already drifting: the external-origin security check has
three different implementations (whoop inline regex vs `snapshotValidator`
delegation in garmin/train2go), `profile-snapshot.js` received a
`THRESHOLD_SPECS` refactor in garmin that train2go never got, and whoop's
popup is an older fork of the shell that garmin/train2go share byte-identical
CSS for. Every new bridge multiplies this surface, and jscpd cannot see it
(bridges have no `src/`).

The product decision is to keep **one extension per site** as the publishing
unit (permission surface, CWS review blast radius, independent release
cadence) and unify the **code** instead. The consumer side shows the same
informal pattern: the SPA has a de-facto generic bridge transport/lifecycle
layer, but no named per-data-type contracts and ad-hoc adapter placement
(`garmin-activities-transport.ts` inside `adapters/bridge/`, train2go in its
own directory, whoop nonexistent).

Exploration record: `.omc/research/2026-07-10-bridge-core-shared-exploration.md`.

## What Changes

**Workstream A — extension-side bridge-core (vendor + parity):**

- Add `packages/_shared/bridge-core/` masters for the code every bridge
  duplicates: envelope builders + dispatch **factories** + external-origin
  guard (background), announce core (content script), popup utilities
  (i18n machinery, timeouts, relative time, status/retry rendering) plus a
  separate snapshot/athlete popup module vendored by garmin/train2go only,
  `profile-snapshot.js` validation (garmin's `THRESHOLD_SPECS` shape), and a
  superset `test/chrome-mock.js`.
- **Deliberate behavior change (the one exception to "refactor only"):**
  external dispatch is uniformly origin-pinned and action-allowlisted across
  all bridges (whoop's strict model). Today garmin/train2go origin-check only
  snapshot actions. Per-bridge external allowlists equal today's full
  external action surface, so no SPA flow loses access; their external-
  dispatch tests are updated accordingly (design D4).
- Per-bridge site identity moves to a tiny `bridge-identity.js` loaded before
  the shared core (manifest `content_scripts.js` order, `importScripts` order
  in the worker, `<script>` order in `popup.html`). Site logic (whoop OAuth,
  garmin session/CSRF, train2go parser, each `handleAction`) stays per-bridge.
- Extend the existing vendor idiom: `scripts/sync-bridge-core.mjs` byte-copies
  masters into each bridge as top-level flat files (packaging-compatible with
  `scripts/package-extension.sh`); `scripts/check-bridge-core-parity.test.mjs`
  fails lint on drift. `sync-popup-css.mjs` / `check-popup-css-parity.test.mjs`
  are absorbed into the new pair. Whoop adopts the shared popup utilities but
  keeps its own site CSS and OAuth/creds layout — that surface is scheduled
  for replacement by the WHOOP session-piggyback rewrite, so `popup.css` is
  vendored to garmin/train2go and whoop joins the target set with the rewrite.
- Guard coverage extends to whoop: `check-bridge-privacy-surface.mjs`
  (content.js and `manifest.prod.json` sections become optional for bridges
  without them, golden fixture regenerated) and the stale-threshold parity
  guard retargets at the vendored snapshot popup module (garmin/train2go —
  whoop does not vendor it). The parity guard also asserts master purity and
  `bridge-identity.js` ↔ `BRIDGE_MANIFEST` consistency per bridge.
- CI gap closed: `train2go-bridge` and `whoop-bridge` join the ci.yml test
  matrix (today only garmin-bridge's suite runs in CI), so the
  characterization safety net is enforced before the risky adoption steps.
- The `BRIDGE_MANIFEST` literal (`version:`, `capabilities: [...]`) stays in
  each bridge's own `background.js` so `scripts/sync-extension-version.mjs`
  and the SPA's `integration-registry-capability-parity.test.ts` keep working
  unchanged.

**Workstream B — SPA-side integration ports (formalize the de-facto port):**

- Name the port: per-data-type integration port contracts (function types) in
  `packages/workout-spa-editor/src/types/integration-ports.ts`, implemented by
  per-integration adapters over the existing shared transport
  (`sendBridgeMessage`, operation queue, discovery).
- Consolidate placement: integration-specific adapters live in
  `adapters/<integration>/` (move `garmin-activities-transport.ts` from
  `adapters/bridge/` to `adapters/garmin/`); `adapters/bridge/` keeps only
  integration-agnostic transport/lifecycle.
- Close the two pre-existing transport-encapsulation violations —
  `store/garmin-extension-transport.ts` and `store/train2go-send-message.ts`
  call `chrome.runtime.sendMessage` directly today — by routing them through
  `sendBridgeMessage`, then land a test-time assertion that `chrome.runtime`
  messaging is only reached through `adapters/bridge/` transport modules.

**Also:** fix the incorrect `CLAUDE.md` citation attributing an "unbundled
standalone files" requirement to `adapter-contracts/spec.md` (the constraint
is packaging-pipeline convention, now made explicit by the `bridge-core`
capability spec).

Out of scope: merging bridges into one extension (rejected), whoop-bridge
publication (CWS pipeline, `manifest.prod.json`, icons, version-sync
enrollment — deferred to its own change), a published `@kaiord/bridge-core`
npm package with a build step (the `_shared/README.md` "promote" case;
deliberately not taken now), and the whoop SPA data adapter (lands with the
whoop SPA integration itself).

## Capabilities

### New Capabilities

- `bridge-core`: Vendored shared runtime for bridge extensions — master file
  set, identity-before-core loading contract, single envelope/origin-guard
  implementation, per-bridge literal preservation for mechanical probes,
  sync + parity tooling, and packaging compatibility.
- `spa-integration-adapters`: SPA-side contract for integration data access —
  named per-data-type port types, per-integration adapter placement, and
  transport encapsulation over the shared bridge transport.

### Modified Capabilities

<!-- None. adapter-contracts, spa-bridge-protocol, bridge-runtime-discovery,
garmin-bridge, and train2go-bridge requirements are all preserved; this change
is a behavior-preserving refactor of how the code is shared, plus new
capability specs that make the sharing contract explicit. -->

## Impact

- **Packages**: `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`,
  `@kaiord/whoop-bridge` (vendored core adoption, manifest script-order
  changes), `@kaiord/internal-shared-assets` (`_shared/bridge-core/` masters —
  first runtime-code masters, still sync-by-copy, still unpublished),
  `@kaiord/workout-spa-editor` (adapters layer only: new port types module,
  adapter moves), repo `scripts/` (new sync/parity pair, guard updates).
- **Hexagonal layers**: no `@kaiord/core` domain/ports/application change.
  Bridges remain no-workspace-deps extension adapters (sharing is by byte-copy
  at sync time, not by import — `check-package-deps.mjs` stays satisfied).
  SPA changes are confined to `adapters/` and `types/`.
- **Behavior**: two intentional deltas, nothing else. (1) External dispatch
  tightening (design D4): every external message is origin-pinned and
  action-allowlisted in garmin/train2go, as it already is in whoop —
  allowlists equal today's full external surface, so legitimate SPA flows
  are unaffected. (2) Whoop's popup adopts the shared utilities; its
  OAuth/creds layout and site CSS stay as-is until the session-piggyback
  rewrite replaces them. Announce messages, ping
  manifests, capability tokens, response envelopes, permissions, and host
  surfaces are unchanged.
- **Release**: garmin/train2go ship as normal CWS updates (manifest
  `content_scripts`/`web_accessible` script-list changes trigger standard
  review); whoop is unpublished, so no CWS impact. Changesets required (all
  three bridges are in `.changeset/config.json` `linked`).
- **Tests**: existing per-bridge vitest suites stay green through the
  extraction (characterization), with one scoped exception — external-
  dispatch expectations are rewritten for the D4 tightening (empty-sender
  positives become allowed-origin positives plus rejection cases). New
  node:test coverage for `sync-bridge-core.mjs`; parity guard is itself a
  test; SPA moves covered by existing suites plus the new transport-
  encapsulation assertion. `train2go-bridge`/`whoop-bridge` join the CI test
  matrix. Coverage thresholds unchanged (60% bridges, 70% frontend);
  per-bridge `coverage.include` updated deliberately for vendored modules.
