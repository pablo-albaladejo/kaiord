# Design — unify-bridge-popup-shell

## D1. Why a second popup master instead of growing the utils one

`bridge-popup-utils.js` is the i18n + DOM + timing layer; it closes over `$` and
`msg` as module-scope consts. The shell renderers need to be callable from a CJS
`require` in a bridge test suite, where those consts do not exist in the caller's
scope. Splitting them into `bridge-popup-shell.js` and passing `($, msg, …)`
explicitly buys three things at once: an injectable seam for unit tests, a file
that stays well under the repo's 100-line guidance, and a clean statement of what
"the shell" is versus "the plumbing".

At runtime the two files are indistinguishable from one file: classic `<script>`
tags share the page's global lexical scope, so `popup.js` sees both sets of
helpers. Load order in every `popup.html` is
`bridge-popup-utils.js` → `bridge-popup-shell.js` → (`bridge-popup-snapshot.js`)
→ `popup.js`.

## D2. `setStatus` is removed, not kept alongside `renderStatusBlock`

Keeping both would leave two status implementations painting the same `#status`
element with different class vocabularies (`status--no` vs
`status-block--warn`) — the exact drift this change exists to remove. The old
`status--{ok,no,checking}` pill markup is gone from all five `popup.html` files,
so nothing can call the old helper. The garmin/train2go popup tests were updated
where they asserted the old class names; every athlete-card, rollup, coach-notes
and retry assertion still holds unchanged.

## D3. `--kd-*` literals rather than an import

Chrome extensions ship flat, unbundled files: the popup cannot `@import`
`styles/brand-tokens.css`, and copying that whole file into five packages would
drag the light palette, the zone ramp and an `@font-face` pointing at a
landing-page path. So the shell re-declares only the dark values it uses, as
`--kd-*` literals, and
`scripts/check-bridge-popup-tokens-parity.test.mjs` pins each one to its
`--brand-*` source. The guard also fails on an _unmapped_ `--kd-*` token, so a
future token cannot quietly escape the pin.

Both files' header comments name the selector they parse (`.dark`, `:root`), so
the guard anchors its block search at a line start — an `indexOf(".dark {")`
would match the prose in the comment and silently read the wrong block.

## D4. Why the design's WHOOP consequence box ships without the arrows

The design shows "Sleep → Garmin, HRV → Garmin, Strain · no data". Those arrows
encode which source picks up each type when WHOOP is down — routing state that
lives in Dexie inside the SPA and that the extension has no channel to read. A
popup that guessed would be worse than one that does not claim to know, so the
box lists WHOOP's own paused types under "What Kaiord is missing" and stops
there. Wiring a routing snapshot (like the existing profile snapshot) is the
follow-up that unlocks the full copy.

The `.chip--danger` tone and its `--kd-semantic-danger*` tokens are deliberately
NOT shipped with this change: "Strain · no data" is the only state that needs
them, and that state is exactly the routing knowledge above. Shipping the
modifier now would mean an unexercised rule in a vendored master; the P2 wave adds
it alongside the data that makes it true.

## D5. Where the "since when" date actually lives

Only WHOOP's background exposes a timestamp, `capturedAt`, and it is written into
`chrome.storage.session` alongside `whoopToken` — so it exists precisely while the
session is alive and is gone whenever the popup would want to say "signed out on
23 Jul". Rendering a date in the broken state would have been unreachable code.
The timestamp is therefore surfaced where it is real — the connected cause
sentence, "Captured 3 hours ago" — and broken states name the cause without a
date. Tanita and TrainingPeaks expose no timestamp at all and get cause-only
copy, as does garmin/train2go.

## D6. Chips are per-bridge arrays, derived from real capabilities

Chip labels are `MANAGED_DATA_REGISTRY` display labels, but the _list_ is a
static array in each bridge's own `popup.js`: master purity forbids a capability
token or brand name inside a shared file, and a bridge cannot import from
`@kaiord/core` at runtime. Each list is read off that bridge's declared
capabilities rather than the design mock, so the popup never promises a type the
bridge does not move:

| Bridge        | Capabilities                                      | Chips                                                                         |
| ------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| garmin        | `read:activities`, `write:workouts`, `write:body` | Activity · Workout ↑ · Body Composition ↑                                     |
| train2go      | `read:training-plan`, `read:training-zones`       | Planned Session · Training Zones                                              |
| whoop         | `read:sleep`, `read:body`, `read:activities`      | Sleep · HRV · Strain · Vitals · +3 more (Stress, Heart Rate Series, Activity) |
| tanita        | `read:body`                                       | Weight · Body Composition                                                     |
| trainingpeaks | `read:body`, `write:body`                         | Weight · Weight ↑                                                             |

This is where the implementation deliberately parts from the design mock, which
shows Garmin feeding Sleep/HRV/Vitals (it does not) and Train2Go pushing workouts
back to the coach (it has no write capability). Only WHOOP's list needs the
"+N more" collapse; four chips is what 340px holds.

## D7. Retry now complements the CTAs instead of erasing them

`renderRetry` used to clear `#footer-region`, so garmin/train2go's broken state
showed a Retry button and nothing else — the user had no link to the thing that
would actually fix the session. It now appends, and the broken state renders
"Sign in to <source>" + "Open Kaiord editor" + Retry.

## D8. Skeleton sizing

`renderSkeleton` writes a caption-height bar plus three pills into
`#chips-region` and two text lines plus a 36px block into `#footer-region` —
the same boxes the resolved state occupies. The short second line carries BOTH
`skeleton--line` (height) and `skeleton--line-short` (width); the width modifier
alone renders a zero-height bar, which is how the first implementation was caught
by its own unit test.
