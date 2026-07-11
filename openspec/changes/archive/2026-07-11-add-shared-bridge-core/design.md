## Context

The three bridges are flat, plain-JS Chrome extension packages with no build
step: `scripts/package-extension.sh:70-76` globs top-level `*.js`/`*.html`
into the CWS zip and resolves nothing. The repo's proven idiom for sharing
across them is **master file + `sync-*.mjs` byte-copy + `check-*-parity`
guard** (`packages/_shared/popup/popup.css` today; the
`STALE_SNAPSHOT_THRESHOLD_DAYS` literal as a value-level variant). Bridges
must keep zero workspace deps (`check-package-deps.mjs`,
`R-ArchPackageDeps`), and several mechanical probes regex per-bridge flat
files: `sync-extension-version.mjs` (the `BRIDGE_MANIFEST version:` literal in
`background.js`), the SPA's `integration-registry-capability-parity.test.ts`
(the `capabilities: [...]` literal in `background.js`), and
`check-bridge-privacy-surface.mjs` (manifests, `content.js` allowlist,
`popup.js` fetch args vs a golden fixture).

All three background workers are classic (non-module) MV3 service workers
already using the dual `importScripts`/`require` pattern for leaf modules
(`garmin-bridge/background.js:59`, `train2go-bridge/background.js:61`,
`whoop-bridge/background.js:37`), with the leaf exporting onto `globalThis`
for the worker and `module.exports` for vitest.

External dispatch is asymmetric today: whoop pins the sender origin and
restricts actions to an `EXTERNAL_ACTIONS` allowlist for every external
message (`whoop-bridge/background.js:187-210`), while garmin and train2go
run the origin check **only** for `SNAPSHOT_ACTIONS` and dispatch every other
external action with no runtime origin check, relying solely on the
manifest's `externally_connectable` (`garmin-bridge/background.js:354-371`,
`train2go-bridge/background.js:283-300`).

On the SPA side, `adapters/bridge/` holds the generic transport
(`bridge-transport.ts`), discovery/heartbeat (`bridge-discovery*.ts`), and the
per-bridge operation queue — plus one misplaced integration-specific module
(`garmin-activities-transport.ts`). Two additional `store/`-layer modules
call `chrome.runtime.sendMessage` directly, bypassing the shared transport:
`store/garmin-extension-transport.ts:25` and
`store/train2go-send-message.ts:23`. Train2go's data adapter lives in
`adapters/train2go/`. There is no named contract that these adapters
implement.

CI runs only the garmin-bridge vitest suite: the test matrix
(`.github/workflows/ci.yml:499-510`) includes neither `train2go-bridge` nor
`whoop-bridge`, so today "suites stay green" is locally enforceable only.

No spec forbids bundling or sharing; the "unbundled plain JS" line in
`CLAUDE.md:135-138` cites `adapter-contracts/spec.md`, which contains no such
requirement. The binding constraints are the packaging script, the guards,
and the no-workspace-deps rule — all compatible with vendoring.

## Goals / Non-Goals

**Goals:**

- One implementation of the shared bridge runtime (envelope/dispatch factory,
  external-origin guard, announce core, popup utilities, profile-snapshot
  validator, chrome-mock), vendored byte-identically into each bridge and
  locked by a parity guard.
- Uniform, origin-pinned external dispatch across all bridges (an intentional
  security tightening for garmin/train2go — see D4).
- Preserve every other protocol observable: announce shape, ping manifest,
  capability tokens, permissions, host surfaces.
- Keep all mechanical probes working; extend guard and CI coverage to all
  three bridges.
- Name the SPA-side integration port, consolidate adapter placement, and
  close the two pre-existing transport-encapsulation violations.

**Non-Goals:**

- A single multi-site extension (rejected on permission surface, CWS review
  blast radius, and release coupling grounds).
- A published `@kaiord/bridge-core` npm package or any per-bridge build step.
- Whoop-bridge publication (CWS enrollment, `manifest.prod.json`, icons).
- The whoop SPA data adapter (belongs to the whoop SPA integration change).
- Retrofitting jscpd over the bridges (vendored copies are intentional
  duplicates; the parity guard is the correct drift detector for them).

## Decisions

### D1 — Vendor + parity, not a package import or build step

Masters live in `packages/_shared/bridge-core/`;
`scripts/sync-bridge-core.mjs` byte-copies them into each bridge as top-level
files (test masters into each bridge's `test/`, which the packaging glob
never touches); `scripts/check-bridge-core-parity.test.mjs` fails `pnpm lint`
on drift.

- **Why not `@kaiord/bridge-core` (workspace import):** bridges must stay
  no-workspace-deps (`R-ArchPackageDeps`), and `package-extension.sh` copies
  flat files without resolving imports. A runtime import would force the first
  bridge build step and a packager rewrite — high blast radius for zero
  user-visible gain. `_shared/README.md` reserves promotion to a published
  package for when something must be _imported at runtime_; vendoring keeps us
  on the near side of that line.
- **Why not codegen/templates:** a generator is a second thing to test and
  debug; the identity-file split (D2) achieves the same per-bridge
  parameterization with plain files a reviewer can read.
- Affected layer: extension adapters + repo tooling only.

### D2 — Identity file loaded before the shared announce core

Each bridge keeps a small `bridge-identity.js` defining one global
(`globalThis.KAIORD_BRIDGE_IDENTITY = { id, name, capabilities }`).
Shared masters read the global and contain no per-bridge values. The only
current consumer of the global is the announce core, so the ordering
requirement binds where consumption happens: the kaiord.com announce entry
loads `["bridge-identity.js", "kaiord-announce.js"]` (`content_scripts.js`
arrays execute in order). `bridge-identity.js` MUST NOT be added to the
site-origin `content.js` entry (garmin/train2go) — identity is not needed
there, and injecting it would widen the site-page surface for no reason.
If a future master consumes the global in the worker or popup, the same
identity-before-consumer ordering applies there (`importScripts` is
synchronous; popup `<script>` tags execute in document order).

- **Alternative — per-file string substitution at sync time:** breaks
  byte-identity (each copy differs), which would force a looser,
  pattern-based parity guard. Rejected; byte-for-byte comparison is the
  strongest and simplest invariant.
- **Identity/manifest consistency:** `bridge-identity.js` (announce) and
  `BRIDGE_MANIFEST` in `background.js` (ping) both carry `id`, `name`, and
  `capabilities`. This is a new, deliberate duplication — the parity guard
  gains a consistency check asserting the two agree per bridge, so the
  announce message and the ping manifest can never diverge.

### D3 — Canonical implementations chosen per module

- **Envelope + dispatch + origin guard** (`bridge-envelope.js`): whoop's is
  the most complete (`needsReauth`/`resetSeconds` passthrough, explicit
  external allowlist) and becomes the master — as **factories**, because the
  dispatch path calls _back into_ per-bridge code, unlike the existing leaf
  modules (parser, profile-snapshot) that background only calls _into_.
  Exported contract (globalThis + module.exports dual export, same idiom as
  today's leaves):
  - `createDispatch({ handleAction, protocolVersion })` → `(message,
sendResponse) => true`
  - `createExternalDispatch({ dispatch, externalActions, protocolVersion })`
    → origin-pins every external sender against the shared SPA-origin regex
    and rejects actions outside `externalActions` before invoking `dispatch`.
  - `sendResult` / `sendError` envelope builders preserving `{ ok,
protocolVersion, data?, error?, status?, retryable?, needsReauth?,
resetSeconds? }`.
    Each bridge's `background.js` keeps `handleAction` and its
    `EXTERNAL_ACTIONS` list and wires the factories. Test impact: all three
    suites restructure their imports (including whoop's — its tests currently
    reach same-file functions), which is why no adoption task claims
    "unchanged test expectations" for external dispatch.
- **Popup, split in two masters** (per whoop's real shape — its popup is
  OAuth/credentials-centric, not snapshot/athlete-centric):
  - `bridge-popup-utils.js` (all three bridges): i18n machinery (`msg`/
    `applySubs` over a per-bridge message table), `$`, `withTimeout`,
    `relativeAgo`/`formatRelative`, `setStatus`, `renderRetry`.
  - `bridge-popup-snapshot.js` (garmin/train2go only): `isFresh` +
    `STALE_SNAPSHOT_THRESHOLD_DAYS` literal, snapshot field collection and
    athlete-card rendering.
    Whoop **reuses the shared utilities**; it does not adopt the snapshot
    module, the athlete-card layout, or the shared popup CSS. Its popup keeps
    the creds/OAuth regions and its own site CSS — that whole surface is
    scheduled for replacement by the WHOOP session-piggyback rewrite (decided
    2026-07-10), so only the duplicated utility code is replaced now and the
    rewrite inherits the vendored core. `popup.css` is therefore vendored to
    garmin/train2go; whoop joins that target set with the rewrite.
- **`profile-snapshot.js`**: garmin's `THRESHOLD_SPECS` Map shape becomes the
  master; train2go converges (whoop has no snapshot).
- **`test/chrome-mock.js`**: superset master (storage.local + storage.session
  - identity + tabs + scripting + webRequest + runtime messaging). Each suite
    uses the slice it needs. Rejected alternative — parameterized mock builder:
    more machinery than three suites justify, and it would break byte-identity.
    Accepted trade-off: a suite could exercise a mocked API its manifest does
    not grant; the privacy-surface guard locks the real permission surface.

### D4 — External dispatch is uniformly origin-pinned (intentional tightening)

Garmin and train2go currently origin-check only snapshot actions; every
other external action is dispatched unchecked. Unifying on the strict guard
**changes their external behavior on purpose**: every external message is
origin-pinned and action-allowlisted. This is defense-in-depth consistent
with `adapter-contracts` and removes the exact three-way drift that
motivated this change.

- **Per-bridge external allowlists (exhaustive, = today's full external
  action surface, so no SPA flow loses access):**
  - garmin: `ping`, `list`, `activities`, `push`, `open-garmin`,
    `profile-snapshot`, `profile-snapshot-clear`
  - train2go: `ping`, `read-week`, `read-day`, `read-details`,
    `open-train2go`, `profile-snapshot`, `profile-snapshot-clear`
  - whoop: `ping`, `status`, `connect`, `whoop-fetch` (unchanged;
    `set-credentials`/`disconnect` stay popup-only)
- **Production impact:** none expected — the SPA always calls from origins
  already pinned in `externally_connectable` (`*.kaiord.com`,
  `localhost:5173/5174`), which the shared origin regex allows. Foreign
  origins that Chrome would admit via `externally_connectable` wildcards
  cannot occur here (the match list is exact), so the runtime pin is a
  second layer, not a functional gate for legitimate callers.
- **Test impact (accepted, planned):** garmin/train2go characterization
  tests that send external messages with an empty sender (`{}`) — e.g.
  `garmin-bridge/test/background.test.js:157,166,424` — assert the OLD loose
  behavior and will be updated: allowed-origin senders for the positive
  paths, plus new rejection tests for foreign origins and non-allowlisted
  actions. The proposal's "behavior-preserving" claim is explicitly scoped
  to exclude this path.
- **Alternative — parameterize the guard to preserve garmin/train2go's loose
  gating:** keeps tests untouched but ships three behavioral variants of a
  security check inside one "shared" module, defeating the dedup's purpose.
  Rejected.

### D5 — Per-bridge literals that must NOT move

`BRIDGE_MANIFEST` (with `version:` and `capabilities: [...]`) stays in each
bridge's own `background.js`. This keeps `sync-extension-version.mjs` and the
SPA's `integration-registry-capability-parity.test.ts` untouched, and keeps
each bridge's identity reviewable in one place. The new `bridge-core` spec
states this as a requirement so a future cleanup does not "helpfully" hoist
them. The identity↔manifest consistency check (D2) guards the duplication
this creates.

### D6 — One sync script, one parity guard

`sync-bridge-core.mjs` absorbs `sync-popup-css.mjs` (popup.css is just
another master, vendored to garmin/train2go). `check-bridge-core-parity.test.mjs`
absorbs `check-popup-css-parity.test.mjs` and adds two non-byte checks:
master purity (no per-bridge identity values inside masters) and
identity↔manifest consistency (D2). Both old files are deleted; `pnpm
popup:sync` becomes `pnpm bridge:sync`. A `MASTERS × BRIDGES` table in one
place, instead of one script pair per shared file.

### D7 — SPA workstream in the same change, ports before adapters

Both workstreams attack the same root cause (informal sharing → drift) and
the SPA capability-parity test constrains workstream A, so they are proposed
together — but tasks are sequenced so workstream A is fully shippable before
workstream B starts. Per config rules, the port module lands before any
adapter move.

The SPA already has the pattern half-built: `CoachingTransport`
(`application/coaching/coaching-transport-port.ts`) is a proper
application-layer port implemented by
`adapters/train2go/train2go-coaching-transport.ts` — coaching-plan reads and
zones are ALREADY port-typed. The formalization therefore follows that
precedent instead of inventing a parallel one: the uncovered operations
(garmin activities fetch, workout push, profile-snapshot push) get plain
function types in `application/integrations/integration-ports.ts`, each over
the DTOs already in use. Adapters in `adapters/<integration>/` export
implementations built on `sendBridgeMessage` + the shared operation queue.
Resolvers and policy gating (`spa-bridge-protocol`) are unchanged — ports
type the _implementations_, policies still decide _whether_ to call them.

### D8 — Transport encapsulation: close the two known violations, then assert

`store/garmin-extension-transport.ts` and `store/train2go-send-message.ts`
call `chrome.runtime.sendMessage` directly and are refactored to route
through `sendBridgeMessage` (their callers —
`hooks/garmin-bridge-operations.ts`, `hooks/use-garmin-bridge-action-helpers.ts`,
`store/train2go-extension-transport.ts` — keep their APIs). Only then does
the assertion land: a test that walks `packages/workout-spa-editor/src` and
fails if `chrome.runtime.sendMessage`/`connect` appears outside
`adapters/bridge/`. The assertion is written first and starts genuinely RED
against the two violators. Mirrors the repo's existing grep-style guards
(R-PIIInterpolation et al.) rather than a new ESLint plugin.

## Risks / Trade-offs

- **External-dispatch tightening (D4) regresses an unanticipated caller** —
  mitigated by allowlists equal to today's full external surface, plus
  origin pinning that only excludes origins the manifest already excludes.
  Residual risk is a non-SPA caller on an allowed origin using an
  undocumented action; none exists in the repo.
- **2/3 bridge suites are not in CI today** — this change enrolls
  `train2go-bridge` and `whoop-bridge` in the ci.yml test matrix (and the
  coverage-threshold case) so the characterization safety net is real before
  the risky adoption steps run. Without this, the train2go external-dispatch
  change would ship CI-unchecked.
- **CWS review on manifest changes (garmin/train2go)** — adding
  `bridge-identity.js` to the announce `content_scripts` entry triggers
  standard review. No new permissions or hosts; the privacy-surface golden
  fixture updates in the same PR make the delta auditable. Ship workstream A
  as one release per bridge, nothing staged.
- **Whoop popup utility adoption** — minimal by design: shared utilities
  only; the creds/OAuth layout and whoop's site CSS stay untouched pending
  the session-piggyback rewrite. Shared-utility tests are written first
  (task 5.2).
- **Vendored files inflate per-bridge diff noise** — every master edit fans
  out as N identical diffs. Accepted: this is exactly what the parity guard
  makes safe, and CWS reviewers see self-contained code, which is a plus.
- **Byte-identity is strict** (line endings, prettier) — the sync script is
  the only writer of vendored copies; vendored paths are either
  prettier-formatted at the master and copied verbatim, or listed in
  `.prettierignore` (settled at implementation against the parity guard).
- **Coverage denominators move** — extracting code from `background.js`/
  `popup.js` into vendored modules changes what each bridge's
  `coverage.include` measures; each vitest config is updated deliberately so
  the 60% threshold keeps meaning something.

## Migration Plan

Behavior-preserving except the deliberate external-dispatch tightening (D4)
and the whoop popup visual convergence — no data, schema, or public-API
migration. Rollback per bridge = revert its adoption commit (vendored files
are self-contained). Workstream B rollback = revert the adapter moves and
delete the port module; no persisted state involved.

## Open Questions

- None blocking. The exact vendored filename prefix (`bridge-*.js` vs a
  `core.*.js` namespace) and prettier handling of vendored copies are
  implementation details settled against the parity guard.
