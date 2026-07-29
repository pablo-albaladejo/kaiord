# Design — Settings attention model

## D0. Integration: one derivation, not two (added when Wave 1 merged)

This change was written while the Connections section did not exist, so it
carried its own predicate over the raw bridge rows: `error || needsReauth`.
Wave 1 then shipped `bridgeSourceStatus`, which answers the same question for
each card and answers it better — it knows which bridges have a prober at all,
which have not answered yet, and which the user unlinked.

Keeping both would have produced a banner that can contradict the cards it
summarises. The shell now counts `status === "attention"` over the same
`useConnectionSources` list the section renders. Two divergences were resolved
in the process, both in Wave 1's favour:

- **A reachable, probed source with no session is attention.** My predicate
  said no (no error), the card says yes. The card is right: it is a source the
  user can fix by signing in, and that is exactly what the banner should
  announce. D1's tanita reasoning survives intact — it is preserved by
  `hasProbe`, not by the error field.
- **The generic fallback line is "Session signed out", not "The last check
  failed".** Once the fallback set is "reachable extension without a usable
  session", a failed-check line is simply false, and Wave 1's spec already
  fixes the vocabulary ("A source whose session is not usable SHALL be
  described as signed out"). The `attention.lastCheckFailed` key is gone.

Wave 1's `discovered: result.reachable` also removes the hazard the old
predicate had: an uninstalled-but-remembered extension keeps returning an error
forever, which would have pinned the banner open. It now reads as absent, and
absent is not attention.

## D1. "Needs attention" is a failure, not an absent session

The obvious predicate is `discovered && !sessionActive`: the extension is here
but it is not signed in. It is wrong, and measurably so.

`bridge-session-probes.ts` registers four probers — garmin, train2go, whoop,
trainingpeaks. `tanita-bridge` is deliberately absent, because its
`checkSession` action is implemented as a full export-CSV download, so polling
it would re-fetch the user's entire body-composition history every pass.
`refreshBridge` therefore takes the no-prober branch for Tanita and writes
`{ discovered: true, sessionActive: false, error: null, needsReauth: false,
outdated: false, lastCheckedAt: null }` — permanently, for as long as the
extension is installed. A session-shaped predicate would report a perfectly healthy Tanita
as broken forever, and no user action could ever clear it.

This change first answered that with `error !== null || needsReauth`, which
Tanita never trips. Since Wave 1 merged, the same exclusion is reached through
a better fact — `hasSessionProbe(bridgeId)`, injected into `bridgeSourceStatus`
— so the shell delegates rather than duplicating the rule (D0). The finding
that forced it is unchanged and still load-bearing: **whatever decides
attention may not be shaped like "present but no session"**, because the one
bridge that can never have a session would live in that shape forever.

## D2. The counter counts something that can reach its denominator

The design's stats row reads "N of 5 syncing". With the probe set above, a
`sessionActive` count has a hard ceiling of 4 — Tanita cannot ever be the
fifth. Shipping a counter that structurally never completes trains the user to
read a healthy system as a broken one.

The row counts `discovered` instead: "3 of 5 detected". Five of five is
reachable.

**"Detected", not "installed".** A page cannot enumerate installed extensions.
`discovered` means "announced itself on `window` and its last probe reached
it". "Installed" would be a claim about the browser; "detected" is a claim
about what answered, which is the one the SPA can actually make.

That second half is newer than the word: `bridge-discovery` still only ever
calls `ids.set`, so discovery alone never forgets an extension, but Wave 1's
probe writes `discovered: result.reachable`, so a probed bridge that stops
answering does drop out of the count. `tanita-bridge` is the exception that
keeps the caveat alive — it is never probed, so nothing can learn it was
removed, and its card says so in as many words.

`use-connections-value.ts` passes `null` as the profile id on purpose: the
count reads `discovered` only, and `useBridgeConnections(null)` skips the
per-profile `coachingSyncState` read entirely, so the index does not pay for
timestamps it does not render.

## D2b. Nothing is claimed before the first pass answers

`createSnapshotReader` synthesises an `undiscoveredEntry` for every id it does
not hold, over a `bridgeIds` list fixed at five. So five rows exist from the
first render, all reading undiscovered — and "undiscovered" at that moment
means "not asked yet", not "not there". Rendering the count immediately told a
fully equipped user **"0 of 5"** for as long as discovery takes (a broadcast
delay plus a verify ping, seconds), on the primary Settings screen.

`connections.length === 0` does not guard that: it is a state production never
reaches. The store's own `lastRefreshAt` is the fact that distinguishes the
two, so it is exposed as `hasRefreshed()` and read through
`useBridgeConnectionsRefreshed()`.

One subtlety made that insufficient on its own: a pass notifies only through
rows that observably changed, and the first pass in a browser with no
extensions changes nothing. The store therefore notifies once when the first
pass completes, regardless. Without it the store would answer "yes, I have
asked" while no consumer had been woken to ask again.

`lastCheckedAt !== null` is NOT a usable proxy for the same fact: tanita's
no-prober branch leaves it null forever.

## D3. The consequence line, ranked by what the reader can act on

The banner's second line is where invention is cheapest, so it is restricted
to state that survives a reload or to the connection's own reported cause:

| Wanted copy                   | Backing state               | Shipped |
| ----------------------------- | --------------------------- | ------- |
| "Session signed out"          | `needsReauth`, or fallback  | yes     |
| "An extension is out of date" | `outdated`                  | yes     |
| "No new data since <date>"    | `lastSyncAt`                | yes     |
| "The last check failed"       | nothing says a check FAILED | no      |
| "Down for three days"         | none                        | no      |
| "Sleep fell back to Garmin"   | none (union has no head)    | no      |
| "WHOOP token expired"         | none                        | no      |

The table is also the ranking, and the ranking is the point. The two
actionable causes outrank the date because they routinely coexist with it: you
only get a re-auth demand for an account you were already syncing, so
TrainingPeaks as the single affected bridge has BOTH `needsReauth` and a
`lastSyncAt`. Ranking the date first showed that user "No new data since …"
and never told them to sign in — the one thing they could have done.

`lastCheckedAt` looks like a "broken since" timestamp and is not one: it
records when the SPA last probed, so after a page reload it is seconds old no
matter how long the source has been down. `lastSyncAt` is read from the
persisted `coachingSyncState`, so it is the one durable fact — hence "no new
data since <date>", which is true after a reload and after a fresh install. It
is rendered as the reader's **local** calendar day: `toISOString()` would show
a 02:00Z sync as the wrong day to anyone west of UTC, and the sentence is
about their day, not the server's.

"Session signed out" rather than "expired" is forced by the probers:
`needsReauth` is set only by `probeTrainingPeaksSession`, from an error that
carries the flag. `probeWhoopSession` returns `inactive(messageOf(err))` and
leaves it false, so for WHOOP the SPA cannot distinguish an expired token from
never having signed in. The popups already say "Session signed out"; the SPA
now says the same thing.

The date branch is taken only when exactly one connection is affected.
"No new data since 2026-07-20" alongside a count of three would attach one
source's date to a set.

## D3b. "Outdated" is a diagnosis, so it needed its own field

`probeByPing` answers an unsupported `protocolVersion` with
`"Update your Kaiord … Bridge extension"` — the probe SUCCEEDED and produced
the exact fix. In `SessionProbeResult` that was indistinguishable from an
unreachable bridge: both set `error`. So after any protocol bump, every user
on a stale extension would get an amber banner reading "The last check
failed", which is not merely vague — it is false — while the SPA held the
answer.

Three ways to fix it were available. Rendering `entry.error` directly is out:
it is untranslated English produced by the extension, and it names the bridge,
which the banner must not. Matching the message string in the SPA is out: it
couples copy in two repos through a substring. So the probe result carries the
cause: `outdated: boolean`, with an `outdatedExtension()` constructor beside
`active()` and `inactive()`, threaded into `BridgeConnectionRuntime` and its
change signature.

That is a shared-model change in the middle of a two-lane program, and it is
worth being explicit about its blast radius: consumers of
`BridgeConnectionState` are unaffected, and only code that CONSTRUCTS a probe
result or a runtime entry — test fixtures, in practice — needs the new field.
`needsAttention` is unchanged, because `outdated` sets `error` too.

## D4. No CTA, because no surface fixes a bridge

`SettingsAttentionModel.action` stays unfed. The only status surface today is
`ExtensionsTab`, which lists Garmin, Train2Go and Tanita — not WHOOP, not
TrainingPeaks — and offers "Refresh Status", not a fix. Sending a user whose
WHOOP session died to a page that does not mention WHOOP is worse than
sending them nowhere. Wave 1's Connections page is where the CTA becomes real,
and the prop is already there for it.

## D5. One surface at a time

Both slots take the same model, so feeding both unconditionally would state
the same consequence twice on one desktop screen. The index renders the
banner; an open section renders the chip on the rail. The rail is
`hidden md:block`, so a section on a phone shows no attention surface — the
banner is one tap away on the index, and the section the user deliberately
opened is not the place to repeat it.

## D5b. The surface appears, so it announces itself

Both slots render seconds after their page does — the first probe pass has to
answer first — and can appear again on any later poll or visibility refresh.
A plain `<div>` inserted at that moment is silent: a reader who is not looking
at the top of the page is never told anything happened (WCAG 2.2 AA 4.1.3).
Each surface is therefore `role="status"` + `aria-live="polite"`, matching
`ErrorMessage` and `StepNotesEditor`, which are likewise conditionally
mounted. Polite, not assertive: a stale source is not worth interrupting what
the reader is doing.

The spec's "an absent model renders nothing at all" is preserved — no empty
region is parked in the DOM to hold announcements — and each truncated line
carries its own `title`, because the chip is narrow and the line most likely
to be cut is the one carrying the instruction.

## D6. Two subscriptions, not one shared read

`useSettingsAttention` (shell) and `useConnectionsValue` (row registry) both
read the connection store. Hoisting one call into `SettingsPage` and drilling
the result down would save a subscription, at the cost of routing a value
around the row registry that `settings-group-types.ts` is built to resolve by
key. The registry pattern wins: the row names `valueKey: "connections"` like
every other row.

The count deliberately does NOT go through `useConnectionSources`: it needs
`discovered` and nothing else, so `useBridgeConnections(null)` skips both the
per-profile sync-timestamp read and the connection-record read that the card
list requires. The attention model pays for those because its verdict depends
on them — an unlinked source is not attention.

## D7. The bootstrap moves into store hydration, not into the page

`useBridgeConnectionsBootstrap` could be mounted by `SettingsPage`, which is
the only consumer. It is mounted by `use-store-hydration` instead: a store
that starts and stops with a page would re-probe every bridge on every visit
to Settings, and the 30-second positive cache is per-entry state that a
restarted store keeps but a remounted page re-triggers. One start per boot is
what the lifecycle's interval, discovery subscription and visibility floor were
written for.

The cost is real and was the reason the mount was deferred: four bridges
messaged every five minutes for the whole session. It buys two rendered
surfaces, which is the bar the deferral set.
