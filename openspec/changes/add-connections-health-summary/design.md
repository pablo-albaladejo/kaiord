# Design — Connections health summary

## D1. One attention predicate, shared by construction

Two surfaces now summarise the same page: the Settings shell's banner and this
section's own counter. The shell already learned this lesson once — it shipped
with its own `error || needsReauth` predicate, Wave 1 shipped `bridgeSourceStatus`,
and the two disagreed on a reachable case (a reachable probed source with no
session: the predicate said healthy, the card said amber). Git merged both
without complaint.

So the predicate is not re-derived here. `sourceNeedsAttention` moves into
`application/connections/connection-source.ts`, beside the type it tests, and
`connection-attention.ts` re-exports it under the name its own tests use. Both
surfaces now call one function over the list the cards are rendered from.
Disagreement is no longer possible without changing the cards too.

`calendarDay` moves for the same reason: the shell's banner and this one state
the same date about the same source.

## D2. "Detected", not "active"

The reference design's first counter is "Active sources · 2 of 5 linked". A
count of live sessions cannot reach 5. `tanita-bridge` has no session prober by
design — its `checkSession` action downloads the entire export CSV, so polling
it would re-fetch the user's whole body-composition history every pass — and it
is therefore permanently session-inactive. The counter would sit at 4 of 5 for a
user with everything installed and working, which reads as a bug report.

`add-settings-attention-model` hit this exact wall on the Settings index row and
answered it by counting `discovered`. The same answer is taken here, with the
same word: a page cannot enumerate installed extensions, only the ones that
announced themselves and answered this page-life, and "detected" is what that
is.

## D3. "Types covered", not "data flowing"

The design's second counter is "Data flowing · 9 of 13 types". The number is
derivable; the words are the problem, and so is the denominator.

Bridge capabilities are announced at runtime, and the union across all five
bridges is `read:activities`, `read:training-plan`, `read:training-zones`,
`read:body` and `read:sleep`. **No bridge announces `read:workouts`.** So
`workout` can never be delivered by an extension: counting only bridge routes
puts the ceiling at 12 of 13, which is D2's defect one counter over.

Manual entry closes it. `MANUAL_ENTRY_TYPES` records the nine types with a real
manual code path, `workout` among them, and the four it omits — planned-session,
strain, vitals, heart-rate-series — are all reachable from a bridge
(train2go for the first, WHOOP for the rest). With manual included, 13 of 13 is
genuinely reachable.

But manual entry is not data flowing. Nothing arrives because a manual path
exists; the reader has to type it. So the counter is labelled for what it
actually measures — a type having a source at all — and the design's wording is
not used. The floor for a reader with no extensions is 9, and that is honest:
they can enter nine kinds of thing by hand today.

"An enabled route" is the right gate for the bridge half because it is the gate
the product itself uses: every runner in `hooks/bridge-import/` passes
`policyRepo` to a use case that resolves import policies before it touches a
bridge. A switched-off route delivers nothing, whatever the extension is doing.

## D3b. Why `covered` and `paused` are not complements

`covered` counts manual entry; `paused` does not. A reader whose Tanita signed
out still has `weight` covered (they can type it) and still needs to be told
that their scale stopped feeding it. Deriving `paused` as `!covered` would
silently drop every manual-entry type from the banner — nine of the thirteen,
including every type Tanita and TrainingPeaks serve.

They answer different questions and are computed in one pass over the same
inputs, so they cannot drift.

`checking` counts as delivering in both. A probe is in flight for a few hundred
milliseconds on every five-minute poll; excluding it would make the headline
number twitch while nothing about the reader's setup changed.

## D4. What the banner refuses to say

The reference design asserts five things in one banner. Two are inventions and
one is unstatable.

**"WHOOP stopped syncing 3 days ago"** — there is no transition timestamp
anywhere in the product. The nearest candidate, `lastCheckedAt`, is when the SPA
last probed: after a reload it reads as seconds ago no matter how long a source
has been down, so "3 days" would be fiction on every fresh page. `lastSyncAt` is
persisted `coachingSyncState` and survives the reload, so "No new data since
<date>" is sayable and is what ships. It is attached only when exactly one
source is affected, so one source's date is never presented as a set's.

**"Sleep and HRV have quietly fallen back to Garmin"** — `union` is
`DEFAULT_DATA_TYPE_SOURCE_MODE`, and union returns every source's record for the
day with no ranked winner (`resolve-effective-source.use-case.ts` says so in its
own comment, and `pick-effective-health-record` resolves ties by write order).
Nothing ever "falls back", because nothing was ever in front. `usedFallback`
exists only in `priority` mode, is per-(type, day), and means "the preferred
source had no record that day" — not "the source broke". It covers 6 of 13
types. Naming a successor is not available at any confidence, so the banner
names what stopped and stops there. Per-row fallback for genuinely
priority-mode types is a Wave 2 question, not this one.

**"Its access token expired"** — no bridge can tell an expired credential from
one that was never issued; `probeWhoopSession` leaves `needsReauth` false in
both cases, and only `trainingpeaks-bridge` ever sets it. The wording is the one
the cards and the extension popups already settled on: signed out.

**"Reconnecting backfills the last 30 days"** — `CYCLES_WINDOW_DAYS` is 30 but
`HR_WINDOW_DAYS` and `STRESS_WINDOW_DAYS` are both 7. One number would be false
for two of the types WHOOP carries, and a per-type breakdown is not a banner
sentence. No backfill promise ships.

**The design contradicts itself** — its banner says Daily Wellness "fell back"
while its WHOOP card calls the same thing "paused". Resolved as paused, applied
only to types that genuinely lost every delivering source.

## D4b. Why the banner declares no action

The design's CTA is "Reconnect WHOOP". The fix for a signed-out bridge is a
sign-in on the provider's own site; this page cannot perform it, and the card
that explains it sits immediately below the banner. A button that only scrolled
the reader four hundred pixels is a control that does not fix the thing it
names. `add-settings-attention-model` declined a CTA on the same reasoning, and
"Refresh all" — which does act, on the one thing this page can act on — is
already in the header.

## D5. The cold-load window, again

`add-settings-attention-model` shipped "0 of 5" on every cold load. Its guard
was `connections.length === 0`, which never fires: `createSnapshotReader`
synthesises a row per known bridge from the first render, so the list is never
empty and the counter rendered zeros until the probes answered.

The reachable bad state is not "no rows", it is "rows that have not been asked
yet". `useBridgeConnectionsRefreshed()` is the discriminator, and it is what
gates the counters here. The placeholder is a distinct value, not a zero, so
"we have not asked" and "the answer is none" no longer look the same.

The banner is deliberately NOT gated. Before the first pass every bridge is
undiscovered, which makes every source `available` rather than `attention`, so
the banner is silent for exactly the same reason a healthy browser leaves it
silent. There is no window in which it can raise a false alarm.

## D6. The refresh cooldown, and why 60 seconds

`refresh({ force: true })` is already correct: `refreshConnections` fans out over
`KNOWN_BRIDGE_IDS` with `Promise.allSettled`, so one unreachable extension
cannot abort the pass, and it genuinely replaces the old control that only
re-detected garmin and train2go.

What it lacks is a floor. `force` bypasses the 30-second positive cache by
definition, and the 60-second visibility floor lives in `createLifecycle`'s
visibility handler rather than in the store — so nothing at all limits a manual
call. Probes also run outside `BRIDGE_QUEUE` (deliberately: a status probe must
not queue behind a 30-second read, and must not eat the 60-per-hour budget), so
there is no downstream backpressure either. A held button messages four
extensions as fast as they answer.

The window matches the visibility floor rather than the positive cache, because
both trigger the same forced whole-bridge pass: pressing the button can never be
more aggressive than switching tabs already is. It also equals
`IMPORT_COOLDOWN_MS`, so the section has one number rather than two.

The guard is module-scoped, mirroring `import-cooldown`: it protects
extensions, so it must outlive the component that renders the button, and
reading the in-flight flag synchronously settles the two-clicks-in-one-tick case
that a captured `status` cannot. A refused press says so — a control that
silently does nothing reads as broken.

## D7. Tanita is not a spinner

A bridge with no prober is written as `discovered: true` and returns before
`probeBridge`, so `checking` is never set and `lastCheckedAt` stays null;
`bridgeSourceStatus` reads `hasProbe` and answers `installed`. Both halves are
already pinned by Wave 1 — `bridge-connection-store.test.ts` asserts the whole
runtime row including `checking: false` and that the probe was never called, and
`connection-source-status.test.ts` asserts the `installed` verdict. `force`
does not reach either path. No test is added here; a third assertion of the same
two facts would be the decorative-test failure this repo's test-minimality spec
exists to prevent.

## D8. File placement

The three derivations are pure and live in `application/connections/` beside
`build-connection-sources`, so their copy and their arithmetic are asserted
without rendering. `connection-coverage` imports the `DataFlowsByType` view type
from the components tree, which `application/data-hub/source-policy-rows.ts`
already does — a type-only import, no adapter reached, and the boundaries
allowlist is untouched.

The tiles' copy is a separate data module rather than JSX, which keeps both the
80-line file cap and the 60-line component cap satisfied without splitting the
row into four near-identical components, and makes the cold-load placeholder one
branch instead of four.
