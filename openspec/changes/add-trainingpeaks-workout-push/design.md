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

### Status

The code in this change is complete and verified. The manual end-to-end
validation in `tasks.md` §5 and the library route are deliberately left
unexecuted — a decision taken on 2026-09-07 to stop investing in this
destination, not an oversight.
