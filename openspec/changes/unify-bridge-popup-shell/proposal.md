## Why

The five bridge extensions ship two unrelated popups. Garmin and Train2Go share
a 340px **light** shell with an athlete card and sync rollups; WHOOP, Tanita and
TrainingPeaks each own a private 320px **dark** stylesheet (byte-identical apart
from one `--accent` value) rendering a single status line. Three consequences:

- **Three copies of one stylesheet drift silently.** `popup.css` is a vendored
  bridge-core master for garmin/train2go only, so the other three sit outside the
  parity guard entirely.
- **The popups do not explain themselves.** "No WHOOP session" names a state but
  not its cause, its consequence, or its fix — and the primary button was "Open
  editor" in every state, including the states where opening the editor changes
  nothing.
- **The popups and the web app describe different models.** The popup never says
  which data types a bridge moves, so a user cannot map "WHOOP is broken" to
  "Sleep and HRV stopped arriving".

Design reference: `Bridge Popups.dc.html` in the "Reorganizar conexiones
responsive" design project (snapshot under
`.omc/research/connections-redesign/`).

## What Changes

- **One shell for all five bridges.** `popup.css` becomes a 340px dark shell
  vendored by every bridge; the per-bridge variable is the header dot accent
  (`--accent` / `--accent-hover`, still set in each `popup.html` `<style>`
  block). Its `--kd-*` custom properties are copied from the `.dark` block of
  `styles/brand-tokens.css`, so the popups and the SPA share one palette.
- **A new `bridge-popup-shell.js` master** carries the four renderers every
  popup is assembled from: `renderStatusBlock`, `renderChips`, `renderSkeleton`,
  `renderCtas`. It supersedes `setStatus` in `bridge-popup-utils.js`. `$` and
  `msg` are passed in as arguments so each renderer is unit-testable through a
  CJS `require`.
- **Status answers what → why → what next.** Every state renders a tone dot, a
  verdict, and one plain cause sentence.
- **The CTA is the fix.** A broken session makes "Sign in to <source>" the
  primary link and the editor the secondary one; a healthy session inverts them.
  Retry (garmin/train2go) is now appended to the CTA pair instead of replacing
  it.
- **"Feeds Kaiord" chips** name the managed data types each bridge moves, using
  the same display labels as `MANAGED_DATA_REGISTRY` in `@kaiord/core`. The list
  is a static per-bridge array in that bridge's `popup.js` (never a master —
  master purity). Broken states mute the chips; WHOOP additionally boxes them
  under "What Kaiord is missing".
- **The checking state is a fixed-height skeleton**, sized to the resolved
  layout so nothing reflows when the probe settles.
- **Two new mechanical guards.**
  `check-bridge-popup-message-parity.test.mjs` pins each bridge's
  `KAIORD_POPUP_MESSAGES` fallback table to its `_locales/en/messages.json`;
  `check-bridge-popup-tokens-parity.test.mjs` pins the shell's `--kd-*` literals
  to their brand-token sources. `check-bridge-stale-threshold-parity` now derives
  its bridge list from `BRIDGE_CORE_MASTERS` instead of hardcoding a pair.

Out of scope for this change (deliberate cuts, not oversights):

- **No cross-source consequence detail.** The design's "Sleep → Garmin, Strain ·
  no data" arrows need routing knowledge the extension does not have; WHOOP's
  broken state lists its own paused types only. A routing-snapshot push from the
  SPA is a later wave.
- **No "since when" date for broken states.** Only WHOOP's background exposes a
  timestamp (`capturedAt`), and it exists only _while_ the session is live — so
  it is surfaced in the connected cause sentence, and broken states name the
  cause without a date.
- **No backfill copy.** "Signing back in backfills the last 30 days" is unverified
  against real sync behaviour and is not shipped.

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing bridge-core capability. -->

### Modified Capabilities

- `bridge-core`: the vendored-masters requirement now lists `popup.css` and the
  new `bridge-popup-shell.js` among the all-bridge masters, and adds the popup
  shell contract (one shell, per-bridge accent only, brand-token-derived palette,
  per-bridge string tables) plus the two new guards to the guard-coverage
  requirement.

## Impact

- **Packages**: `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`,
  `@kaiord/whoop-bridge`, `@kaiord/tanita-bridge`,
  `@kaiord/trainingpeaks-bridge` (all private extensions) plus the
  `packages/_shared/bridge-core/` masters. No SPA, core, or adapter change.
- **New files**: `packages/_shared/bridge-core/bridge-popup-shell.js` (+ five
  vendored copies), `scripts/check-bridge-popup-{message,tokens}-parity.test.mjs`,
  `packages/{whoop,tanita,trainingpeaks}-bridge/test/popup.test.js`,
  `packages/whoop-bridge/test/bridge-popup-shell.test.js`.
- **Removed**: `setStatus` from `bridge-popup-utils.js`; the three private dark
  stylesheets (now overwritten by the vendored master).
- **No** new dependencies, permissions, host permissions, or outbound URLs — the
  privacy-surface golden is unchanged.
- **Tests**: every bridge's vitest suite covers its popup (connected, broken and
  checking states, chips, CTA order); the shell renderers are unit-tested
  directly. `pnpm test:scripts` covers the two new guards.
- **Changeset**: none in this change — the bridge extensions version through the
  release flow, and the popup redesign carries no public-API surface.
