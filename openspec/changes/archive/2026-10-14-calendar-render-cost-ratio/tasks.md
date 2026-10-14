> Tasks: 4 completed, 0 deferred

# Tasks

- [x] 1. Red first: assert the seeded week shows its 10 solo workouts; it showed 0 with the unowned seed.
- [x] 2. Seed every row with the active profile's id and the persisted record shapes; both weeks show exactly the seeded cards.
- [x] 3. Replace the absolute FCP assertion with the 30-card / 3-card render-cost ratio (≤ 2), sampled interleaved from an empty week.
- [x] 4. Prove it: a deliberate 1 ms per card render fails the ratio 3 out of 3 times while the old FCP spec passes 3 out of 3; healthy runs stay ≤ 1.46 at throttle 4×, 8× and 12×, ≤ 1.55 with three runs in parallel.
