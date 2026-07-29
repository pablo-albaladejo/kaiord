# Design — surface-whoop-read-preconditions

## D1 — Why `tab-open` is a separate internal action, not a field on `status`

`status` is externally reachable. Its payload is enumerated in
`privacy-justification.md` and the published privacy policy as
`{ connected, userId, capturedAt }`, and `whoop-bridge`'s spec repeats that
enumeration. Adding a field would mean the SPA — and anything else on an
allowed origin — learns whether the user has a WHOOP tab open, which is a new
disclosure about browsing state, for a fact the SPA has no use for.

So `tab-open` is a distinct action, deliberately absent from
`EXTERNAL_ACTIONS`. It uses `chrome.tabs.query` via the existing
`findWhoopTab`, so it adds no permission.

**What holds that line is one test, not the privacy guard.** The
privacy-surface golden is byte-identical here, and that fact proves nothing
about the action set: the golden locks `manifest`, `manifest_prod` and
`allowed_paths` only, and mutating `tab-open` INTO `EXTERNAL_ACTIONS` leaves
both `check-bridge-privacy-surface.mjs` and the whole of `pnpm test:scripts`
green. The single gate that fails is the assertion in
`packages/whoop-bridge/test/background.test.js` that the external set is
exactly `["ping", "status", "whoop-fetch"]`.

Anyone extending this bridge should read that as: "`test:scripts` is green" is
not evidence an action stayed internal. Widening the golden to cover each
bridge's external allowlist is a worthwhile separate change.

## D2 — A failed probe reports the unreadable state

`tabRes.ok && tabRes.data?.open === true` — anything else is "no tab". This is
not defensive padding: the probe and the read fail through the same channel, so
a probe that could not answer stands for a read that would not have worked
either. Reporting the healthy state on a failed probe would put the popup back
in exactly the position this change exists to fix, only harder to notice.

## D3 — The bearer is named before the tab

With neither signal good, the popup reports the signed-out session. Opening a
tab does not restore a bearer, so naming the tab there would send the user to
do something that cannot help.

This ordering is only observable when **both** signals are bad — with a tab
open, the two orderings render identically. The first version of the test used
`tabOpen: true` and **survived** the swapped-branch mutant; it now uses the
discriminating state. Signing out of WHOOP and closing the tab is the ordinary
way to leave the site, so this is a state users reach constantly.

## D4 — Consequence lines are prose in the shared shell, not chips

A chip names a thing that flows; these lines name an outcome, and three of them
in chip form would read as three more data types. `renderConsequence` lands in
the bridge-core master so the remaining four bridges inherit the block rather
than growing four private implementations, and the region is optional — a popup
that declares no `consequence-region` is left untouched — so the renderer could
ship ahead of the copy that fills it.

The box is neutral-bordered rather than warning-tinted: it states facts in the
healthy state too, and a tint there would cry wolf on a working bridge.

## D5 — Which claims the copy is allowed to make

Each line was checked against the code before it was written:

| Claim                                                      | Evidence                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| "Everything already imported stays in Kaiord."             | `src/application/whoop/**` contains no `.delete(`, `.remove(` or `.clear(` call; the importers only add. |
| "Kaiord reads WHOOP from inside an app.whoop.com tab."     | `whoopFetch` → `findWhoopTab()`; `content.js` performs the fetch from that tab's origin.                 |
| "Sign in at app.whoop.com and leave the tab open."         | The bearer is captured on that origin only, by all three disclosed paths.                                |
| "Open app.whoop.com and Kaiord reads from that tab again." | States the mechanism, not a promise.                                                                     |

Deliberately **not** claimed: that reopening the tab needs no fresh sign-in.
The extension never validates the held bearer — a stale token still reads as
`connected` — so whether reads actually resume is not something this code
knows.

## D7 — The popup and the Connections card now answer different questions

This change knowingly opens a divergence, and it must not be closed by
widening the bridge.

With a bearer held and no `app.whoop.com` tab, the popup reports "No WHOOP tab
open" while the Connections card still reports "Connected". Before this change
both surfaces were wrong together; now the popup is right and the card is
**incomplete, not false**: `ConnectionStatusLine` renders the bare word
"Connected" plus a factual freshness line, and makes no present-tense claim
about reading. That is the difference from the bug this change fixes, where the
copy asserted "through your open session" — the concrete fact that was false.

**The popup is authoritative on readability; the card is authoritative on
linkage.** Reconciling them would mean putting the tab fact into the externally
reachable `status` payload, which would tell the SPA whether the user has a
whoop.com tab open. That is browsing state, and keeping `tab-open` internal is
exactly what avoids disclosing it. Privacy is not traded for cosmetic
consistency.

If a future change wants the two surfaces to agree, the supported direction is
to soften the card's claim — never to widen the bridge.

## D6 — The fix link is offered in one state only

`attention` is the only status whose fix is on the provider's site.
`available` splits into two causes with different fixes — an explicit
disconnect (the card's own Reconnect) and a missing extension (which the
provider's site does not hand out) — and sending either to a sign-in page
would look like a fix while being none. `installed`, `checking`, `connected`,
`manual` and `unsupported` have nothing to fix.

The destination table holds `whoop-bridge` alone. The other four bridges each
ship a comparable URL in their own popups, and adding them is a one-line change
each — but each is a claim about where a user resolves that source's problem,
and the brief scoped this to WHOOP. An unlisted source renders no link, which
a test pins by putting Garmin in `attention` and asserting nothing is
substituted.
