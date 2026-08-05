# Rebrand V2 · bridge popups

## Why

`unify-bridge-popup-shell` (2026-07-26) gave the five bridges one 340px dark
popup, and `rebrand-v2-foundation` (#1117) repainted its `--kd-*` palette onto
the new role tokens. Three gaps against the V2 screen survive both.

**1. Five provider hues are still in the file.** The unified shell kept one
deliberate per-bridge variable — `--accent` / `--accent-hover`, set in each
`popup.html` `<style>` block, tinting the header dot. Measured today: Garmin
`#007cc3`, Train2Go `#f74464`, WHOOP `#9333ea`, Tanita and TrainingPeaks both
`#0284c7` (the retired Kaiord blue). These are the last item of #1121's
inventory. A provider's own brand hue in the corner of a Kaiord popup is five
arbitrary colours competing with nothing, and two of the five are not even a
provider colour — they are a token this repo already deleted.

**2. No popup says since when it broke.** Principle 6 asks a failed state to
name what broke, from when, and what covers it. Every popup answers the first
and third and none answers the second. `add-connections-page` hit the same wall
and deferred it in as many words: _"stopped syncing N days ago" (no transition
timestamp exists anywhere)_. That is still true — nothing in any bridge records
the moment a probe went from working to failing.

**3. The checking skeleton is not at final height.** `renderSkeleton` fills
`chips-region` and `footer-region` only. The regions that resolve _outside_
those two — `consequence-region` and `paused-region` (WHOOP), `future-region`
(TrainingPeaks), the athlete card and the sync rollup (Garmin, Train2Go) — go
from zero to their real height when the probe settles, so the popup jumps. The
shell's own spec already promises this does not happen ("The checking state does
not reflow the popup"); the promise outran the renderer.

## What Changes

- **The header dot becomes a monogram chip.** A 22px rounded square carrying
  the source's initials (`G`, `T2`, `Wh`, `Ta`, `TP`), painted from the shared
  neutral roles. `--accent` / `--accent-hover` are deleted from all five
  `popup.html` files with no replacement, and the per-bridge visual variable
  becomes the monogram _glyph_ rather than a colour. No provider hue remains in
  any bridge package.

- **A broken state names its start date.** A new vendored
  `bridge-popup-health.js` records, in `chrome.storage.local`, the first probe
  at which a bridge was observed broken and clears it on the first probe that
  succeeds. The cause sentence renders `on 23 Jul` from that stamp. When no
  stamp exists — fresh install, or a bridge that has never once been observed
  working — the popup renders the dateless sentence rather than inventing a
  date. The stamp is written by the popup, which is what runs the probe, so no
  background action is added and the internal/external action allowlists are
  untouched.

- **The skeleton reserves every region.** `renderSkeleton` takes the region set
  the popup will actually fill, so the checking layout is the resolved layout's
  height in all five bridges.

- **The V2 type, spacing, radii and motion land on the shell.** Verdict 15px/600,
  cause 12.5px with `tabular-nums slashed-zero`, caption 12px/0.08em, chips
  12px, CTA radius 8px at weight 500, transitions on named properties at 120ms
  `cubic-bezier(0.2,0,0,1)`. A state that needs the user is an alert icon plus a
  sentence, not a coloured dot — success and warning are not colours this
  palette has.

- **One hue survives, earned.** Garmin's last-push card takes `--zone-4` on its
  left edge because it is naming a real training session. It arrives as a role
  via a new `--kd-zone-4` token pinned by the parity guard.

- **Every new string ships in both tables.** Each added key lands in the
  bridge's `KAIORD_POPUP_MESSAGES` fallback and its `_locales/en/messages.json`,
  which `check-bridge-popup-message-parity.test.mjs` enforces key-for-key.

Deliberately NOT shipped:

- **No `es` locale.** `check-bridge-locales-english-only.test.mjs`
  (R-BridgeLocalesEnglishOnly) makes `_locales/` English-only across every
  bridge, matching the `default_locale: "en"` in all ten manifests. Adding `es`
  is a policy reversal, not a rebrand task.
- **No web font.** The V2 screen is set in Inter; the popups stay on
  `system-ui`. Bundling a font into five unbundled extensions to style a 340px
  panel is disproportionate, and loading it from Google would put an outbound
  request into packages whose whole privacy argument is that they make none.
- **No light theme.** The V2 screen's `html.klight` block themes the handoff
  canvas, not the popup: no popup-specific light values are specified anywhere
  in it, and the token parity guard pins `--kd-*` to the `.dark` block by
  construction. The popups stay dark-only, as they have been since the shell
  landed.
- **No chip inventory changes.** The V2 screen draws WHOOP's chip list on the
  Garmin card and gives Train2Go a "Workout ↑ back to coach" chip for a
  push-back `train2go-bridge/background.js` does not implement. Chips stay
  derived from what each bridge actually moves, per the existing
  "Capability chips use the managed-data-type labels" scenario.

- **No danger-tinted chip.** The V2 screen paints "Strain · no data" in the
  danger ramp, distinguishing a type that is broken from one merely paused.
  That distinction is routing state — whether another source covers the type —
  which lives in the SPA's `MANAGED_DATA_REGISTRY` and multi-source policy, not
  in an extension that can see only its own session. Shipping the tint would
  mean choosing it by a rule the popup cannot evaluate, so no `--kd-danger-*`
  token and no `.chip--danger` rule are added. The shell's renderer docstring,
  which had advertised a `danger` modifier no stylesheet defined, is corrected
  to the four that exist.

## Capabilities

### Modified Capabilities

- `bridge-core`: the per-bridge visual variable changes from an accent colour to
  a monogram glyph; the status block gains a start-date obligation and an icon
  form for states needing the user; the no-reflow guarantee is restated in terms
  of every region a popup fills rather than two of them; and the vendored master
  set gains the health module.

## Impact

- **Packages**: `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`,
  `@kaiord/whoop-bridge`, `@kaiord/trainingpeaks-bridge`,
  `@kaiord/tanita-bridge`, and the `packages/_shared/bridge-core` masters. No
  SPA, domain, or adapter-package change; no dependency added.
- **New vendored master**: `bridge-popup-health.js`, consumer set = all five
  bridges, registered in `BRIDGE_CORE_MASTERS` so `pnpm bridge:sync` and the
  parity guard cover it without a hardcoded list.
- **Storage**: one new `chrome.storage.local` key per bridge
  (`bridgeHealth`), holding `{ lastOkAt, brokenSince }`. No migration — an
  absent key reads as "never observed", which is the dateless copy path.
- **Permissions**: none added. Every bridge already declares `storage`.
- **Guards**: `check-bridge-popup-tokens-parity.test.mjs` gains two
  `TOKEN_SOURCES` entries (`--kd-text-disabled`, `--kd-zone-4`). The
  privacy-surface, action-allowlist, core-parity, message-parity,
  locales-english-only and CI-coverage guards are unchanged and must stay green.
- **No** schema, Dexie version, public-API or changeset impact (all five bridge
  packages are private and outside the changeset-bot `PUBLISHABLE` set).
