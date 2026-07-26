## 1. Shell masters (`packages/_shared/bridge-core/`)

- [x] 1.1 Rewrite `popup.css` as the unified 340px dark shell: `:root` block of `--kd-*` literals copied from the `.dark` block of `styles/brand-tokens.css`; header (dot/title/reserved refresh slot), `.popup-main`, `.status-block` (+ `--ok`/`--warn`/`--muted` tones), `.caption`, `.chips`/`.chip` (+ `--out`/`--muted`/`--dashed`), `.chips-box`, `.skeleton--{caption,chip,line,line-short,cta}` at final heights, `.week` + completion bar; keep `.athlete*`, `.notes*`, `.rollup*`, `.cta-{primary,secondary,retry}`. Keep px font sizes (Chrome-popup rendering context).
- [x] 1.2 Replace the stale header comment (`pnpm popup:sync`, `check-popup-css-parity.test.mjs` — neither exists) with `pnpm bridge:sync` + `check-bridge-core-parity.test.mjs`, and point at `styles/brand-tokens.css` as the palette source.
- [x] 1.3 Create `bridge-popup-shell.js` with `renderStatusBlock($, msg, {tone, verdictKey, verdictSubs, causeKey, causeSubs})`, `renderChips($, items, {caption, region})`, `renderSkeleton($)`, `renderCtas($, {primaryLabel, primaryHref, secondaryLabel, secondaryHref})`, exported through `module.exports`.
- [x] 1.4 Drop `setStatus` from `bridge-popup-utils.js` (superseded) and make `renderRetry` append to the footer instead of clearing it.
- [x] 1.5 Verify master purity: no bridge id, brand name, host, or capability token in either master.

## 2. Sync table and mechanical guards (`scripts/`)

- [x] 2.1 `sync-bridge-core.mjs`: `popup.css` → `ALL_BRIDGES`; add the `bridge-popup-shell.js` row → `ALL_BRIDGES`. Run `pnpm bridge:sync`.
- [x] 2.2 `sync-bridge-core.test.mjs`: add `it("vendors popup.css to every bridge")` asserting the CSS, shell and utils masters share one consumer set of five; leave the snapshot-only assertion intact.
- [x] 2.3 `check-bridge-stale-threshold-parity.test.mjs`: derive `BRIDGES` from the `bridge-popup-snapshot.js` entry of `BRIDGE_CORE_MASTERS` instead of hardcoding the pair.
- [x] 2.4 New `check-bridge-popup-message-parity.test.mjs`: parse each `globalThis.KAIORD_POPUP_MESSAGES` literal and assert its key set equals its `_locales/en/messages.json` keys minus `extName`/`extDescription`; also assert no duplicate keys and that both manifest-only keys exist.
- [x] 2.5b `check-bridge-popup-message-parity.test.mjs` parses the table with a brace-balanced scanner (string- and comment-aware) instead of an indentation rule, so a nested object cannot silently shrink coverage; fixture cases cover nesting, string-embedded braces/colons, and unbalanced literals.
- [x] 2.5 New `check-bridge-popup-tokens-parity.test.mjs`: parse the first `.dark { … }` block of `styles/brand-tokens.css` (anchored at a line start) and assert every `--kd-*` hex in the popup master equals its mapped source; fail on an unmapped token.
- [x] 2.6 Add both new guards to the `scripts/README.md` inventory table.

## 3. Per-bridge popup markup (×5)

- [x] 3.1 One shell markup per `popup.html`: header (accent dot, `Kaiord · <Brand>` title, refresh button), `<main class="popup-main">` with `#status` (`#status-text` + `#status-sub`), `#chips-region`, the bridge's own regions (garmin: `#athlete-region` + `#rollup-region`; train2go: those two + `#notes-region`; whoop: `#paused-region`), `#footer-region`.
- [x] 3.2 Add the missing `<title>` and `<meta viewport>` to garmin/train2go.
- [x] 3.3 Per-bridge `<style>:root{--accent;--accent-hover}`: garmin `#007cc3`, train2go `#f74464`, whoop `#9333ea` (was `#6366f1`), tanita `#0284c7` (was `#2563eb`), trainingpeaks `#0284c7` (was `#2563eb`).
- [x] 3.4 Script order everywhere: `bridge-popup-utils.js`, `bridge-popup-shell.js`, `bridge-popup-snapshot.js` (garmin/train2go only), `popup.js`.
- [x] 3.5 whoop/tanita/trainingpeaks stop owning a private `popup.css` — the file is overwritten by the vendored master.

## 4. Per-bridge popup behaviour (×5)

- [x] 4.1 All five: skeleton + muted "Checking your session…" on load; a state-driven CTA pair where the primary link is the fix; a static per-bridge chip list using `MANAGED_DATA_REGISTRY` display labels (see design D6); a working header refresh button.
- [x] 4.2 garmin: `Session signed out` / `Bridge not responding` verdicts, muted chips when broken, Retry appended to the CTA pair; athlete card and sync rollup unchanged.
- [x] 4.3 train2go: `Connected as <name>` verdict with the coach line as the cause; weekly rollup keeps its exact summary sentence and gains the `.week__bar` completion bar; coach notes unchanged.
- [x] 4.4 whoop: connected cause carries `capturedAt` as a relative phrase; signed-out state boxes its paused chips under "What Kaiord is missing" (`.chips-box`) and clears `#chips-region`.
- [x] 4.5 tanita / trainingpeaks: `Not signed in` verdict with a cause naming how to fix it; dashed "Will feed Kaiord" chips before connecting.
- [x] 4.7 trainingpeaks connected state splits its chips: "Feeds Kaiord" carries only the wired import (Weight), and the `push-weight` capability that no Kaiord export route drives yet sits in a second dashed "Will feed Kaiord" row — never as a `chip--out` that would read as flowing today.
- [x] 4.8 `renderRetry` claims focus only when nothing else holds it, so repeated cycles cannot yank focus away from the header refresh button.
- [x] 4.6 Grow each `KAIORD_POPUP_MESSAGES` and the matching `_locales/en/messages.json` (named placeholders + descriptions) so the 2.4 guard passes.

## 5. Tests

- [x] 5.1 New `packages/{whoop,tanita,trainingpeaks}-bridge/test/popup.test.js` cloning the garmin/train2go jsdom harness exactly (`runScripts: "outside-only"`, all popup scripts in ONE `dom.window.eval`, callback-shaped chrome mock, mocked `Date.now`): connected, broken, checking-skeleton, and background-error states.
- [x] 5.2 Extend the garmin/train2go popup tests for the CTA swap, the chips and the skeleton; keep every existing athlete/rollup/notes/retry assertion passing.
- [x] 5.3 New `packages/_shared/bridge-core/test/bridge-popup-shell.test.js` MASTER unit-testing all four renderers through a CJS `require` under a jsdom environment, vendored to all five bridges so each runs the suite against its own copy.
- [x] 5.4 Pin the no-accumulation invariant in the garmin/train2go popup tests: fail, click Retry, fail again → exactly one `#retry-btn` and one CTA set; plus a garmin case proving a header-initiated refresh keeps its own focus.

## 6. Docs and quality gates

- [x] 6.1 `packages/_shared/bridge-core/AGENTS.md`: shell paragraph, `bridge-popup-shell.js` row, `popup.css` consumers → all bridges, load order, per-bridge string rule.
- [x] 6.2 The five bridge `AGENTS.md` files: add `popup.css` (whoop/tanita/trainingpeaks) and `bridge-popup-shell.js` (all) to the vendored lists; refresh the popup one-liners (no longer "status-only").
- [x] 6.3 `pnpm bridge:sync` clean; `pnpm test:scripts` green including the two new guards; every bridge vitest suite 100%; `bash scripts/package-extension.sh <bridge>` green for all five; Prettier clean on every touched file; `npx openspec validate unify-bridge-popup-shell` passes.
- [x] 6.4 No changeset: the popup redesign carries no public-API surface and the bridge extensions version through the release flow.
