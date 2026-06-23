# @kaiord/train2go-bridge

## 9.2.0

### Patch Changes

- 2009aa7: feat(train2go): preserve coach hyperlinks and surface day comment threads

  The Train2Go bridge now keeps hyperlinks from activity descriptions instead of stripping them: `<a href>` anchors are converted to markdown `[label](url)` in the parser (mirroring the existing `<strong>` → `**` handling). It also parses the day-scoped coach/athlete comment thread from the same daily sidebar HTML — no new endpoints or permissions — and returns it on the `read-day` response (additive; older SPAs ignore it).

  In the SPA, the coaching description renderer gains safe link support: markdown links and bare `https://` URLs render as `target="_blank" rel="noopener noreferrer"` anchors with the full href in the `title`, enforced through an https-only scheme allowlist at render time (no `dangerouslySetInnerHTML`). Day comments persist in a new profile-scoped `coachingDayNotes` Dexie store (v20, additive), are replaced wholesale on each `read-day`, cleared by the profile-delete cascade, and render in a read-only panel inside the coaching activity dialog.

## 9.1.0

### Patch Changes

- d1d759d: Harden HTML sanitization in the Train2Go parser: entity decoding is now
  single-pass (no double-unescaping of payloads like `&amp;lt;`) and tag,
  comment, and script/style stripping repeat until stable so interleaved
  markup cannot re-form a tag after one pass. Resolves the CodeQL
  `js/double-escaping` and `js/incomplete-multi-character-sanitization`
  findings.

## 7.2.1

### Patch Changes

- b3b5cf3: Fix coaching activity description leaking the opening tag of the next sibling block (`<div class="`) into the rendered text.

  `extractDescription` used a lookahead on the literal substring `activity-hint-ecos`, so the captured chunk reached the position just before that text — which is INSIDE the opening `<div class="..."` of the hint-ecos sibling. The strip-divs-with-content regex below only matches complete `<div>...</div>` blocks, so the partial opening tag survived and ended up in the description. Anchored the lookahead on the full `<div[^>]*activity-hint-ecos` opener instead.

## 7.2.0

### Minor Changes

- b9ca78e: Re-inject content scripts after extension reload (DX). Chrome MV3 terminates content scripts in existing tabs when the extension is reloaded but does NOT re-inject them automatically — `chrome.tabs.sendMessage` to those tabs fails with "Receiving end does not exist", silently breaking `train2goFetch` / `garminFetch` until the user closes and reopens every Train2Go / Garmin tab. Both bridges now run a re-inject pass on `chrome.runtime.onInstalled`, programmatically injecting their content script into matching open tabs whose URL is covered by `host_permissions`. Adds the `scripting` permission and goldens are updated accordingly.
- 07f9c7d: Wire the new SPA → Bridge protocol actions: both bridges now accept `profile-snapshot` (validated, persisted to `chrome.storage.local`) and `profile-snapshot-clear` (idempotent purge of `profileSnapshot` + `lastWeeklyRollup`). Each bridge ships a hand-rolled plain-JS structural validator that mirrors the Zod schema from `@kaiord/core` and rejects prototype-pollution payloads, oversized JSON (>8192 UTF-16 code units), unsupported schema versions, and unknown enum values; parity is enforced by a shared fixture set loaded from `@kaiord/core/test-utils`. The external-message listener gates the snapshot actions on `sender.origin` matching `externally_connectable.matches` (defense-in-depth). Train2Go's manifest gains the `storage` permission. A new `scripts/check-bridge-privacy-surface.mjs` mechanical guard locks the CWS-relevant surface (manifest permissions + host_permissions + content_scripts.matches + externally_connectable.matches + content-script ALLOWED arrays + popup.js fetch URLs) against drift via a checked-in golden snapshot.
- c2ccd5c: Redesign the Train2Go bridge popup as an identity card sharing the same structural CSS as Garmin (coral accent `#f74464`, primary "Open editor" CTA + secondary "Open Train2Go" link). Drops the `Read This Week` button; auto-fetches on open with bounded per-phase timeouts (snapshot 1 s, ping 3 s, rollup 8 s) and a 5-minute `lastWeeklyRollup` TTL cache so rapid popup re-opens don't burn the 200 KiB `read-week` parse. Renders a one-line weekly rollup ("<N> sessions planned · <M> done · workload <X>") that auto-loads when the cache is stale; rollup-only failures preserve the connected state with a "Rollup unavailable — try again" line instead of dumping to the disconnected card. The status pill carries the user's name plus an optional coach sub-line — `parsePingJson` now opportunistically extracts `coachName` from `data.user.coach.name` / `data.user.trainer.name` / `coach_name` / `trainer_name` shapes (no new endpoint, no allowlist change). Refresh-icon header button bypasses the rollup TTL on click.
- 352e9ed: Bridge popup trigger wiring + lastPushReceipt + dead-code sweep.

  SPA: `useProfileSnapshotPush` (mounted in `App`) now reads the discovered bridges from the in-memory `bridgeDiscovery` singleton (the actual source of truth) instead of an empty Dexie table that no other code wrote to. The hook drives a shared `OperationQueue` that enforces the 60/h-per-bridge cap from the SPA Bridge Protocol spec, and parks a `pendingClear` flag when the active profile is deleted while no bridges are reachable so `profile-snapshot-clear` still fires the next tick a bridge appears. The previously-unused `dexie-bridge-repository`, `bridge-registry`/`-helpers`/`-prune`, `push-active-profile`, and `snapshot-pusher` modules are removed; the in-memory singleton is the only registry.

  Bridges (Garmin + Train2Go): `persistSnapshot` now writes `lastPushReceipt: { at, name }` to `chrome.storage.local` atomically with the snapshot, and `clearSnapshot` removes it alongside `profileSnapshot` and `lastWeeklyRollup`. The Garmin popup's "Last push · N min ago — <name>" line now actually renders; before, the writer side was never wired and the popup silently fell back to omitting the line.

- 308003f: Train2Go bridge parser now extracts full Z1-Z5 zone bands per block (HR, power, pace) from `/user/details`, alongside the existing `z4Upper` / `z5Lower` convenience scalars (preserved for backwards compatibility). New emitted fields:
  - `payload.hrZones.generic.{z1..z5: {lower, upper}}` (Karvonen-derived; new — was absent before)
  - `payload.hrZones.{cycling, running, swimming}.{z1..z5: {lower, upper}, z4Upper}` (full bands; swimming is new — only cycling and running were emitted before)
  - `payload.paces.cycling.{z1..z5: {lower, upper}, z4Upper, z5Lower}` (watts integers; full bands)
  - `payload.paces.{running, swimming}.{z1..z5: {lower:{min,sec}, upper:{min,sec}}, z4Upper}` (min:sec pairs; full bands)
  - `payload.physiological.bpmRest` (allowlisted; previously dropped — flows through but no SPA consumer in this change)

  Privacy surface widens within the already-allowlisted `/user/details` path. No new endpoints, no new Chrome permissions, no new `externally_connectable` matches. The redaction key-walk test enforces the post-change forbidden set: `gender, birthday, fat, smoker, imc, user_notes, email, records, tests` (top-level) plus `coach.email, coach.name` (nested). The DOM-level snake_case `bpm_rest` is still forbidden; only the camelCased emit form is permitted. Store-listing copy enumerates the new fields explicitly.

  Backwards-compat: existing FieldKey-level writes for `cycling.thresholds.ftp`, `cycling.thresholds.lthr`, `running.thresholds.lthr`, `running.thresholds.thresholdPaceSecPerKm`, `swimming.thresholds.cssPaceSecPer100m`, `bodyWeight`, and `heartRate.max` keep working byte-identically — the parser emits both the new band shape AND the legacy z4Upper convenience field.

- 1a20a25: Add `read-details` bridge action and `read:training-zones` capability. The action fetches the server-rendered `/user/details` page and parses the inline DOM into a stable `ZonesPayload` (raw shape: `physiological.{weight, bpmMax}`, `paces.{cycling.{z4Upper, z5Lower}, running.{z4Upper}, swimming.{z4Upper}}`, `hrZones.{cycling.{z4Upper}, running.{z4Upper}}`). Mapping to Kaiord-domain semantic names (`cycling.thresholds.ftp`, etc.) happens in the SPA — the bridge stays platform-shaped.

  Defense-in-depth: `parseDetailsHtml` emits an explicit field allowlist; sensitive fields present on the page (gender, birthday, fat, smoker, IMC, bpm_rest, user_notes, coach.email, coach.name, email, records, tests) are dropped at parse time. A redaction unit test walks the parsed object recursively and asserts no forbidden key appears at any nesting depth.

  Content script `handleFetch` now dispatches by `Content-Type`: `text/html` responses are read via `r.text()`, JSON responses via `r.json()`. ALLOWED list expands by one entry (`/user/details`) and the privacy-surface golden fixture is updated to its full canonical 5-entry shape (Boy-Scout-Rule fix of pre-existing 2-entry drift). New script-level test asserts `bridge-privacy-surface.json.allowed_paths.length === content.js ALLOWED.length` mechanically.

- b9ca78e: Add a collapsible "Coach notes" box to the Train2Go popup. Surfaces the trainer's free-text notes about the trainee (`data.user.user_notes`) returned by the existing `/api/v2/profile/ping` endpoint — no new network call, no new permissions. Notes are HTML-stripped to plain text in the parser before they reach the popup, and the body element uses `textContent` (never `innerHTML`) so the popup XSS surface stays at zero. The box is collapsed by default and capped at 200px scrollable height so long notes don't blow up the popup. Empty / missing notes render nothing.

### Patch Changes

- b9ca78e: Make `kaiord-announce.js` resilient to "Extension context invalidated". When the bridge is reloaded, Chrome terminates the script's runtime context but does not remove its `window.message` listener (the listener is bound to the page, not the extension). The next `KAIORD_BRIDGE_DISCOVER` would otherwise call `chrome.runtime.id` / `chrome.runtime.getManifest()` and throw an uncaught error in the page console. The listener now detects the invalidated context, bails, and removes itself so future discover requests are silent — the new content script (re-injected on `onInstalled` for tabs covered by `host_permissions`, or via the next page load otherwise) takes over cleanly.
- b9ca78e: Fix the "Open editor" link in both bridge popups to point at `https://kaiord.com/editor/` instead of the non-existent `https://app.kaiord.com/`.
- 08a8195: Regenerate extension icons from a single shared SVG master at `packages/_shared/extension-icon/master.svg`. Both bridges now use a Kaiord hex silhouette with a per-bridge accent: Garmin → blue (`#007cc3`), Train2Go → coral (`#f74464`) — visually distinguishable in the browser toolbar at every size. Adds `pnpm icons:build` and `pnpm lint:icons-distinct` to the repo, with a mechanical guard that fails the lint job if the icons drift below the inter-bridge mean-color-delta or accent-mass thresholds.
- 4e07a9c: Fix `read-day` clobbering activity dates with `""`. The daily HTML fragment from `/api/v2/workplan/daily/{date}` contains no date anchor (the weekly endpoint uses the CSS class `workplan-table-date-YYYY-MM-DD`, absent in the daily endpoint), so `parseDailyHtml` left every activity with `date: ""`. The bridge transport now backfills the date from the request param before returning, restoring the SPA's per-day calendar bucketing.

  Visible symptom this resolves: when the user clicked a Train2Go coaching activity card to open its detail dialog, the dialog's lazy description-fetch (`expandDay`) upserted the activity with `date: ""`, dropping it out of every calendar day bucket. The card vanished from the calendar the moment the dialog opened, even after the dialog was dismissed.

- f842ec7: Fix `parseDailyHtml` returning empty descriptions for non-default-intensity activities. T2G's daily HTML labels each activity wrapper with `activity activity-{level}` where `{level}` mirrors the workload intensity (`default` | `low` | `medium` | `high`). The split-on-activity-boundary regex was anchored on `activity-default` only, so any other intensity left `extractDescription` running on an empty slice and persisting `description: ""`.

  Visible symptom: clicking a coaching card with non-default intensity opened a dialog whose description never populated (the upsert ran with `description: ""`, so subsequent renders showed neither the loading state nor the actual content). After this fix all four documented intensity levels split correctly and the description body is extracted.

- 550a035: Fix Generic HR block extraction in production T2G HTML. The `heart-rate-zone-generic` wrapper is rendered as a sibling under `<section class="pupil-details">` — outside the per-user `<div id="hrzones-{id}">` container that holds the sport-specific blocks. The parser used to slice `id="hrzones-{id}"` → first `</section>` and scan for all four zone wrappers in that slice, so on real T2G HTML it never reached generic and emitted only the cycling Specific block. The SPA mapper's Specific → Generic → skip fallback (D-FB1) consequently never fired for running and swimming, leaving those HR tables at 0-0 after sync.

  Now the parser parses Generic from the full HTML (with comments stripped first so prose mentions of `heart-rate-zone-generic` in fixture headers can't anchor the wrapper regex). The lazy match in `extractHrFullBands` stays self-anchored on the literal class name and stops at the next `heart-rate-zone-X` or `</section>`, so the wider scope cannot bleed into sport-specific blocks. Sport-specific extraction continues to operate on the narrower slice for safety.

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
