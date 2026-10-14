> Tasks: 6 completed, 0 deferred

# Tasks

- [x] 1. Red first: in union, a WHOOP or FIT row beats a legacy manual row's calories, and genuine manual steps still win, in every row order.
- [x] 2. Red first: under a priority order that lists `manual`, a legacy manual row does not take manual's slot; alone it is still read.
- [x] 3. Red first: the energy balance reads a WHOOP row's calories over a legacy manual row's.
- [x] 4. `mergeDailyWellnessDay` ranks a legacy manual row after every other row.
- [x] 5. Red first: a legacy row's typed steps win over a WHOOP or FIT row's steps in union and in manual's priority slot, lose when the order leaves `manual` out, and a steps save on that day changes the energy balance's reading.
- [x] 6. `mergeDailyWellnessDay` picks the day's typed steps among manual rows (pure first, then legacy) and ranks them in manual's slot.
