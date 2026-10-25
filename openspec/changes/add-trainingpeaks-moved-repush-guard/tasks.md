## 0. OpenSpec change

- [x] 0.1 Write `proposal.md`, this task list and the
      `spa-trainingpeaks-extension` delta.
- [x] 0.2 `openspec validate add-trainingpeaks-moved-repush-guard --strict`
      passes.

## 1. Ledger date on both commit paths (PR-1)

- [x] 1.1 Make `ExportLedgerEntry.destinationDate` optional (`YYYY-MM-DD`)
      and add schema tests.
- [x] 1.2 Give `buildCommitPatch` an explicit `destinationDate` input. Set it
      when defined, and keep the row's value when it is not.
- [x] 1.3 Make `recordExport` derive `destinationDate` from
      `payload.workoutDay` for the TrainingPeaks route only, and pass it on
      both the created path (`record-export-post.ts`) and the updated path
      (`record-export-constraint.ts`).
- [x] 1.4 Add a symmetry test: a created push and an updated push of the same
      payload end with the same `destinationDate`. A Garmin row never gets
      one.

## 2. Guard and override (PR-1)

- [x] 2.1 Add `trainingPeaksRepushGuard(row, workout, payloadHash)` as a pure
      function. Cover the truth table first: no row, pending, same hash, a
      different hash with a known different date (`moved`), and a different
      hash otherwise (`changed`).
- [x] 2.2 Wire the guard into `useTrainingPeaksPush` /
      `TrainingPeaksPushButton`:

  - No workout write (`push-workout`) reaches the bridge on a blocked
    push. The read-only session probe still runs first.
  - "Send a copy anyway" sits behind a confirmation. Its copy says that
    Kaiord then tracks only the latest copy.
  - Add the en and es copy.

- [x] 2.3 Add a hook test: after the confirmation there is exactly 1 POST, and
      the row's `destinationDate` is the new day.
- [x] 2.4 Run `pnpm -r test && pnpm -r build && pnpm lint && pnpm test:scripts`.
