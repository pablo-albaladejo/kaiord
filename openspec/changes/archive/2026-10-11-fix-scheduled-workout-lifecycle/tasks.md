> Tasks: 8 completed, 0 deferred

# Tasks

## 0. Characterization

- [x] 0.1 Deleting a workout queues and sends no Garmin removal and leaves its
      ledger row untouched; Send week and placement skip ledgers whose
      workout no longer exists.

## 1. Save (F-29)

- [x] 1.1 `saveWorkoutEdits` use case (pushed → modified, transactional re-read).
- [x] 1.2 Save changes, unsaved marker, `beforeunload` guard, confirmed
      Discard/Back; the baseline resets on save.

## 2. Detail (F-30, F-31, F-42)

- [x] 2.1 More options: Move to another day (`rescheduleWorkout`) and Delete
      workout with a 10 s Undo (`restoreDeletedWorkout`).
- [x] 2.2 Calendar card → `#/workout/view/:id`; a disabled send says why.
- [x] 2.3 "Workout not found" on both routes for an unknown id.

## 3. Card (F-28)

- [x] 3.1 Title, localized origin chip and computed duration.

## 4. Verification

- [x] 4.1 e2e on the real path and the `verify:prod` `scheduled-lifecycle`
      check, including the keyboard move.
