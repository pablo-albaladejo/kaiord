> Completed: 2026-10-14

# Proposal: The calendar performance budget measures the cards

## Why

The CalendarPage performance spec asserted an absolute first contentful paint
(2400 ms in the test, 1500 ms in this requirement) on a 30-card week. It
guarded nothing about the cards:

- The seeded workouts carried no `profileId`. The calendar reads the active
  profile's workouts only, so the 10 solo workouts never rendered and the
  calendar counted no workouts at all.
- On the Vite dev server, FCP is the time to fetch and evaluate the module
  graph. The page shell paints before any IndexedDB read resolves, so FCP does
  not depend on the cards. A deliberate 1 ms slowdown per card render left it
  green 3 out of 3 times.
- It did depend on the runner: a 2× slower CI runner measured
  2864 / 5976 / 2788 ms with nothing regressed.

The requirement text had also drifted from the test: it named a 30 ms worst
`useMatchedSessions` measure, while the test asserts the fastest steady-state
re-fire against a 250 ms envelope scaled by a runner calibration.

## What Changes

- The seed gives every workout, plan and match the active profile's id, uses
  the persisted shapes (composite activity id, `executedWorkoutIds`), and the
  test proves each week shows exactly the seeded cards of each kind before
  measuring.
- The FCP assertion is replaced by a render-cost ratio: a 30-card week
  (10 / 10 / 10) against a 3-card week (1 / 1 / 1), both shown by an in-app
  route change from an empty week on the same page, under the same throttle,
  fastest of 5 interleaved samples each. The ratio SHALL stay ≤ 2. Both weeks
  take the same path and differ only in card count, so runner speed cancels
  out (1.12–1.46 at throttle 4×, 8× and 12×, absolute floors 100–1150 ms),
  while a per-card cost does not (1 ms extra per card render: 2.37–4.03).
- The `useMatchedSessions` wording states what the test enforces.

## Impact

- Test-only: `e2e/calendar-performance.spec.ts` and a new
  `e2e/helpers/calendar-perf-week.ts`. No production code changes.
