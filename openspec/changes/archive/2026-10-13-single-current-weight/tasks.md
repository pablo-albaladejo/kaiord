> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. `getCurrentWeightKg` and `loadLatestWeighIn` with a test matrix: weigh-in present, stale, absent, nothing known, later weigh-ins ignored.
- [x] 2. Energy: BMR gate and BMR use the current weight (red first: a weigh-in without a profile weight was gated, and BMR ignored the weigh-in).
- [x] 3. Goal maintenance and the goal's default start weight use the selector.
- [x] 4. Athlete page: "Current weight" shows the selector and records today's weigh-in; same-day re-edit updates it; the tagline uses it (red first).
- [x] 5. The profile modal no longer edits the weight; the extension snapshot sends the current weight.
- [x] 6. E2E: an edited weight, re-edited the same day, is one weigh-in on the Weight page.
