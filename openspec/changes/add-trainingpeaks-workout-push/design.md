## Context

The TrainingPeaks structured-workout API is undocumented. Everything below was
measured on 2026-09-07 against the athlete's own account: a browser capture of
the create request, then targeted probes to settle what the capture left open.
Two probe workouts and two library items were created and all four deleted; the
calendar was verified clean afterward.

```text
POST   /fitness/v6/athletes/{athleteId}/workouts               → 200 + created workout
GET    /fitness/v6/athletes/{athleteId}/workouts/{from}/{to}   → 200
DELETE /fitness/v6/athletes/{athleteId}/workouts/{workoutId}   → 200
```

It is `v6`. Every public source and every community tool describes `v3`, which
now answers 404.

## Goals / Non-Goals

- **Goal**: create a structured planned workout on the athlete's calendar from
  a KRD workout, through the existing bridge and the existing export gate.
- **Goal**: be honest about what TrainingPeaks cannot hold, per
  `spec/conversion-loss-honesty`.
- **Non-goal**: reading workouts back, the exercise library, the official
  partner API, and any store release.

## Decisions

### The `structure` field is a string on the way in

The request carries `structure` as a JSON-encoded string; the response returns
it as an object. Sending an object is rejected. The converter therefore
serialises last, and the bridge relays the payload verbatim — a bridge that
re-encoded the message body would silently break this.

### A block's `length.value` is a repeat count

`length: { value: N, unit: "repetition" }` on a block means N rounds — `1` for
a lone step, `4` for a four-times interval block. A step's own
`length: { value: S, unit: "second" }` is a duration. Same field name, two
meanings, told apart only by `unit`. `begin`/`end` are seconds from the start
and already account for the repeats, so
`end = begin + (sum of step lengths) × repeatCount`.

This maps almost one-to-one onto KRD's `steps: (WorkoutStep | RepetitionBlock)[]`,
which is why the converter is small.

### The polyline is reverse-engineered, so it is pinned to real output

TrainingPeaks computes the preview graph client-side and stores whatever it is
sent, so a wrong polyline yields a workout that executes correctly and _looks_
wrong — a defect no schema would catch. The rule: expand every block into its
rounds, then `y = step upper target / workout peak`, `x = elapsed / total`,
three decimals, one leading `[0, 0]` and a rise/run/fall triplet per step. The
converter's test asserts all 22 points of the captured workout, so a future
edit that "simplifies" this fails loudly.

A workout whose every target was dropped has a peak of zero. Rather than emit
`NaN` — which the schema rejects, turning a lossy conversion into a crash — the
scale falls back to 1 and the graph flattens.

### Absolute targets need thresholds, and the units differ

TrainingPeaks knows only percentages of a threshold. KRD carries watts, bpm,
m/s, zones and percentages. Percentage units pass through; zones collapse to a
named midpoint table and warn; absolutes divide by the athlete's threshold and
warn when there is none.

The subtle one: the profile stores `thresholdPace` as a **pace** in
`min_per_km` or `min_per_100m`, while KRD pace targets are a **speed** in m/s.
Dividing one by the other raises no error and produces plausible, wrong
percentages, so the conversion is a separate tested module. `lthr` is a lactate
threshold and is deliberately not reused as a maximum heart rate.

### The 402 is a subscription limit, and it is dated in the athlete's timezone

Measured by bisection with the account clock at `America/Denver 2026-09-07`:
yesterday, today and **+1 day** return 200; **+2 days** and everything beyond
return `402 Payment Required` with an empty body. A workout with
`structure: null` at +2 days is refused identically, so the gate is the date,
not the structure. `GET /users/v3/user` reports `isPremium: false`.

The cut-off is evaluated in the **account's** timezone, not the browser's. From
a UTC+2 browser early in the morning the account is still on the previous day,
which makes "tomorrow" fail and "today" pass — a discrepancy that reads as
nondeterminism until the account-local date is pinned. This cost a wrong
conclusion during the investigation and is why the bridge names the cause.

## Risks / Trade-offs

- **The API is undocumented and can change without notice.** Mitigated by
  pinning the converter to captured output and by keeping the allowlist narrow
  enough that a shape change fails visibly rather than sending data somewhere
  new.
- **A Basic account cannot reach real coaching-plan dates.** The push works and
  is correct; it simply cannot land more than a day out without a paid tier.
  Since Train2Go plans are inherently future-dated, that bounds what this change
  delivers on a free account to today and tomorrow.
- **`workoutTypeValueId` is mapped from a small observed sample** (swim 1,
  bike 2, run 3, rowing 4, strength 9) with an explicit "other" fallback rather
  than a guess per sport.

## Why the work stops here

The forward-planning ceiling has no legitimate workaround, and this was checked
rather than assumed. A multi-source review with adversarial verification
(2026-09-07) ruled out every candidate:

- **Garmin → TrainingPeaks for planned workouts does not exist.** Every
  integration examined (Garmin Connect, Wahoo ELEMNT, Apple Watch, Zwift,
  TrainingPeaks Virtual) is one-directional for planned workouts: TrainingPeaks
  pushes OUT to the device — Garmin capped at 15 days ahead — while only
  completed activities and health metrics come back in.
- **No file route.** There is no FIT/TCX/ERG/ICS import for planned workouts.
  `.zwo` import exists but lands in the library, not on a calendar date.
- **The official partner API** does expose "push planned workouts to an
  athlete's calendar", but it is company-gated, is not accepting new partners,
  and TrainingPeaks states it is not available for personal use.
- **Independent corroboration**: `freekode/tp2intervals`, the one community tool
  that writes planned workouts into TrainingPeaks, documents the same
  today-and-tomorrow ceiling rather than a bypass.

TrainingPeaks' own help center says it plainly — "Planning features can only be
added one day ahead in basic accounts" — and marks "Can copy and move workouts
into the future?" as No for Free Basic.

### The exercise library, considered and declined

`POST /exerciselibrary/v1/libraries/{id}/items` was measured: it has no date
gate, accepts structured items on a Basic account, and preserves `repetition`
blocks intact. `krdToTrainingPeaksStructure` is exported separately so that route
would need only a payload builder, a bridge action, and SPA wiring.

It is not being built, for two reasons that only surfaced after measuring:

1. The help center documents a **5-saved-workout cap on Basic**, which is
   **untested against the API** — nobody has checked whether a sixth item is
   refused. A weekly plan is five to seven sessions, so the cap lands exactly on
   the use case.
2. It is an **undocumented, unsupported surface**. The official feature table
   lists "Build and use unlimited workout libraries" as Premium-only, yet the
   POST succeeds on Basic. The measurement is authoritative about what the
   endpoint does today, but not about what TrainingPeaks will keep allowing.

Placement would stay manual regardless: no endpoint applies a library item to a
date (`…/items/{id}/apply` 404s), so reaching the calendar is the same
`POST …/workouts` under the same ceiling.

### The limit is stated before sending (#1636)

The SPA cannot know the account type. The token exchange answers
`{ token, athleteId, userId, username }` and nothing about the tier;
`GET /users/v3/user` reports `settings.account.isPremium`, but it is a second
request that downloads the athlete's whole profile (email, coaches, FTPs), and
the session check must transfer no athlete data. So the limit is stated to
every athlete for a day after tomorrow, worded as a fact about Basic accounts
("TrainingPeaks may refuse this day"), never as a claim about theirs. The
send stays enabled: a paid account accepts the date. TrainingPeaks' own 402
is mapped to the same explanation.

### The notice assumes the account's time zone is the furthest behind (#1636)

The cut-off is the account's "tomorrow", and the App does not know the
account's time zone either. Deciding from the browser's date (the first
version) missed a day: from a browser ahead of the account, the browser's
tomorrow can already be "after tomorrow" for TrainingPeaks, so the athlete saw
no notice, got the 402, and was then told to schedule the workout for today
or tomorrow, which they had done.

UTC offsets in use span -12:00 to +14:00. At any instant the earliest date
anywhere is the UTC date of `now - 12 h`, and no account can be on an earlier
day, so the last day every account accepts is that date plus one. The notice
shows for every later day. The browser's own zone is not consulted: it only
decides which label the athlete reads for a date, not what TrainingPeaks
accepts. Consequences, accepted as the honest trade:

- The browser's tomorrow carries the notice until 12:00 UTC (13:00 in Madrid
  in winter), when UTC-12:00 reaches today. The notice says "may", so a day
  the athlete's own account accepts is not misdescribed.
- From UTC+12:00 or later early in the day, even the browser's today can carry
  it, because UTC-12:00 is still two dates behind.

Options weighed and discarded: the browser's tomorrow (misses refused days);
the browser's offset minus a guess at the account's (no data to guess from);
reading `GET /users/v3/user` for the account's zone (downloads the profile,
which the session check must not do). The refusal now names the consequence
(the workout was not sent) and the rule, counted in the TrainingPeaks
account's time zone, and gives no instruction to pick a day.

### A re-send reads the copy it made (#1636)

TrainingPeaks is create-only for Kaiord (no `PUT`/`DELETE` in the allowlist),
so the export ledger row is the record of what Kaiord created there, keyed by
workout, the same shape Garmin uses. Before this change a re-send never read
TrainingPeaks: an unchanged workout was skipped even when the athlete had
deleted the copy (the App said "On TrainingPeaks" while TrainingPeaks held
nothing), and a changed one was blocked over a copy that might be gone. Now
the SPA reads that one workout by its recorded id first
(`GET …/workouts/{workoutId}`, answer reduced to id and day in the service
worker). Only a 404 marks the row `forceRepush`, as Garmin does for a lost
copy; any other answer keeps the old decision, so a read failure never turns
into a second copy. A by-id read was chosen over the measured range read
(`GET …/workouts/{from}/{to}`) because it moves one workout Kaiord created
instead of a day of the athlete's planned and completed workouts.

Not covered here: a push whose answer never arrived (the 20 s timeout fired
after the extension got the message). Settled on 2026-11-23, below.

### Status

The code in this change is complete and verified. The manual end-to-end
validation in `tasks.md` §5 and the library route are deliberately left
unexecuted — a decision taken on 2026-09-07 to stop investing in this
destination, not an oversight.

## The copy check shares Garmin's safe-write decision

The live read before a send (`checkTrainingPeaksCopy`) was a hook that
imported the adapter and named its states `present | gone | unknown`. It is
now an application use case (`application/trainingpeaks/check-trainingpeaks-copy.ts`)
behind `TrainingPeaksCopyPort`, over `readLiveState`
(`application/safe-writes/live-state.ts`), the decision Garmin's placement
uses: read live, only a confirmed absence counts (here TrainingPeaks' own
404; Garmin also settles two reads apart), then a guarded record update.
The vocabulary is one, `present | absent | unknown`. Behaviour is unchanged.

## After a send that got no answer, read the day and ask (2026-11-23)

The owner decided on 2026-11-23 (#1636) how to close the case above. A send
whose answer never arrived (`delivered: false`, "Extension did not respond":
the App's timer fired after the extension had the message) may have landed,
and TrainingPeaks is create-only for Kaiord.

- **Record.** The failed send is kept on the ledger row as `unansweredSend`
  (its day and title): on a recorded copy as a field, on a first send as the
  pending row the rollback had removed.
- **Read.** The next send of that Workout reads that day first, before every
  other check: `GET /fitness/v6/athletes/{id}/workouts/{day}/{day}`, the range
  read measured on 2026-09-07, added to the closed list pinned to one day
  (start and end the same date, a backreference). No existing path could do
  it: the by-id read needs the id the lost answer carried. The Connector
  keeps only the titles of that day's workouts. The previous protocol has no
  such action, so there the read fails.
- **Decide** (`application/trainingpeaks/unanswered-send.ts`, over
  `readLiveState`): a workout of the same title (trimmed) on that day stops
  the send, nothing is written, and the athlete reads that it may already be
  on TrainingPeaks; a read that fails stops it too and says Kaiord could not
  check; none lets it through and forgets the unanswered send. One choice in
  both: "Send anyway", which sends without reading and forgets it. The
  workout found is never changed or deleted (the closed list has no such
  path).
- **Wording** (GLOSSARY: the consequence, one choice, no unverified cause; the
  missing answer is a fact, a cause for it is not named): "This workout may
  already be on TrainingPeaks on {date}: your last send got no answer, and
  that day holds a workout with this title. Sending it again can add a
  second copy." / "Kaiord could not check whether this workout is already on
  TrainingPeaks on {date}, where your last send got no answer. Sending it
  again can add a second copy." In Spanish in the dictionaries.

Rejected: adopting the found workout's id into the record (it may be the
athlete's own of the same title); resending when the read fails (a second
copy the athlete did not choose); a match on title and time (TrainingPeaks'
day carries no time of creation).
