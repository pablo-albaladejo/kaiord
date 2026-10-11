> Completed: 2026-10-11

# Proposal: Manual use is the main path, and the editor speaks the athlete's units

## Why

The 2026-10-10 journeys audit found that an athlete who connects nothing was
treated as a second-class user, and that the step editor spoke the storage
format instead of the athlete:

- The first run listed a source, an AI key and the extension as things that
  "have to be true"; working by hand was a footnote (F-01). Empty weeks
  assumed a coach (F-32).
- The setup checklist counted steps only an integration can tick, so it could
  never reach 100% by hand (F-33). The readiness card offered only Garmin
  (F-04). A manually scheduled session did not count as a planned-session
  source (F-40). Internal design notes leaked into the UI (F-26).
- The step editor took duration in seconds and pace in m/s (F-11), had no
  intensity selector (F-12), opened workout metadata in edit mode (F-10),
  warned about FTP for workouts that do not use it (F-14) and was partly in
  English (F-13).
- The threshold dialog opened on Cycling whatever sport was active (F-24). In
  running it asked for FTP first, showed a heart-rate method that was not the
  one applied, saved silently and named zones in English (F-25).
- A library card said "0 TSS" for a session that has no target to load
  against (F-18).

## What Changes

- First run: create, import and log wellness lead; integrations are optional
  and the copy assumes no coach.
- The setup checklist is create a workout, set thresholds, log wellness and
  save to the library. Each is reachable by hand.
- The readiness card offers manual HRV and sleep entry when it has no data.
- `planned-session` has a manual source: scheduling by hand counts.
- Duration is typed as `m:ss`, and pace as `m:ss` per km, mile, 100 m or
  100 yd according to the workout's sport and the units preference. Storage
  stays seconds and m/s (rounded to the millimetre per second).
- The step editor has an intensity selector; a new workout's first step is a
  warm-up. Metadata starts read-only. The FTP line shows only when a target
  depends on FTP. The step editor and step card are localized.
- The threshold dialog opens on the active sport. Pace sports lead with pace
  and LTHR and mark FTP optional. A blank heart-rate table takes Karvonen
  5-zone (the athlete page's model) once LTHR is set, a table the athlete or
  a coach wrote is never recalculated, and the method select names what is
  applied. Edits say "Saved". Preset zone and method names are localized.
- A library card omits TSS when the session has no load to report.

## Impact

- `@kaiord/workout-spa-editor` only. No schema or Dexie change.
- `verify:prod --only manual-first` asserts every finding above against a
  build; the e2e `manual-pace-round-trip.spec.ts` types 4 × 3:00 at 4:30/km,
  exports FIT, reimports it and compares the targets.
