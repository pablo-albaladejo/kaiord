## Why

The WHOOP popup can report a healthy, reading bridge while every read it stands
for fails.

`getSessionStatus` returns `connected: !!whoopToken`. That bearer lives in
`chrome.storage.session`, which survives the tab it was captured from being
closed. But every read runs _inside_ an `app.whoop.com` tab — `whoopFetch`
calls `findWhoopTab()` and throws `"No app.whoop.com tab open."` without one,
because the content script performs the fetch from that tab's own origin. So
after a user closes their WHOOP tab, the popup shows green "Connected · Reading
your WHOOP data through your open session" over a bridge that cannot read
anything. The `whoop-bridge` spec already required the tab; it just never said
that a surface owed the user that distinction.

The second gap is on the other side. `/settings/connections` names a source's
problem — "Session signed out" — and then offers nothing to do about it:
`grep -n "href|window.open|navigate"` across `organisms/Connections/*.tsx`
returns nothing. The card diagnoses and stops.

## What Changes

- **The popup distinguishes three states instead of two.** A new internal-only
  `tab-open` action answers whether an `app.whoop.com` tab exists; the popup
  asks for it alongside `status` and reports the bearer and the tab as separate
  preconditions. A probe that fails is read as "no tab", because the read it
  stands for would fail the same way.
- **Every state names its consequence**, in claims the code sustains: what
  stops arriving, that everything already imported is kept, and where the
  missing precondition is restored. A new `renderConsequence` block in the
  shared popup shell carries them, so the other four bridges can use it without
  a second implementation.
- **The Connections card links to the surface that fixes it**, in the
  `attention` state only, beside the sentence naming the problem — never
  instead of it.
- Spec sync: `whoop-bridge`'s tab-dependency requirement gains what surfaces
  owe the user, and its internal-action enumeration gains `tab-open`.

## What this deliberately does NOT change

- **No consequence box before a disconnect.** The brief asked for one, on the
  premise that the popup lets a user disconnect or clear the session. It does
  not: `handleAction` exposes `ping`, `status`, `capture-token`, `open-whoop`
  and `whoop-fetch`; a case-insensitive sweep for disconnect/clear/sign-out/
  revoke across all five bridges returns nothing in whoop-bridge; and the
  shared popup shell has no destructive-control primitive — `renderCtas` emits
  `<a target="_blank">` links only. A box guarding an action that cannot be
  taken is the defect this programme keeps catching in review, so the
  consequence copy is attached to the states the popup actually reaches.
- **No brand logos.** There are no third-party brand assets in the repo; every
  `packages/*-bridge/icons/*.png` is Kaiord's own mark from the icon pipeline.
  Shipping them would mean hand-authoring approximations of registered marks,
  two of which (Strava, Wahoo) belong to sources Kaiord cannot connect at all.
  The per-bridge popup accents were checked as a fallback and do not hold
  either: tanita and trainingpeaks both use `#0284c7`, a placeholder.

## Impact

- Affected specs: `whoop-bridge`, `spa-connections-page` (the latter is created
  by `retire-legacy-connection-surfaces`, PR #1089 — archive after it)
- Affected code: `packages/_shared/bridge-core/{popup.css,bridge-popup-shell.js}`
  and their vendored copies in all five bridges, `packages/whoop-bridge/`,
  `packages/workout-spa-editor/src/{application,components,i18n}`
- No manifest change, no new permission, and no widening of
  `EXTERNAL_ACTIONS`, so `privacy-justification.md` and the published privacy
  policy stay accurate.
- The privacy-surface golden is untouched — but that is **not** evidence for
  the sentence above, and must not be cited as such. The golden locks
  `manifest`, `manifest_prod` and `allowed_paths`; it does **not** cover the
  external action allowlist, and it would have stayed byte-identical even if
  `tab-open` HAD been added to `EXTERNAL_ACTIONS` (demonstrated by mutation).
  The only thing pinning that set is the assertion in
  `packages/whoop-bridge/test/background.test.js`.
