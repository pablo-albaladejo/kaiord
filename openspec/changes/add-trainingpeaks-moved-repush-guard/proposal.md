## Why

TrainingPeaks is create-only for Kaiord. The bridge allowlists a single workout
route, `POST /fitness/v6/athletes/{id}/workouts`
(`packages/trainingpeaks-bridge/background.js:93`). It has no update route and
no delete route.

The export ledger re-pushes whenever the content hash changes. The constraint
path compares `existing.contentHash === contentHash` and pushes again when the
two differ (`record-export-constraint.ts:65`). The TrainingPeaks payload
carries `workoutDay: workout.date` (`use-trainingpeaks-push.ts:58`). So after
the athlete moves a workout, or edits one, sending it again creates a
**second** TrainingPeaks workout. The first copy stays on its old day, and the
ledger then tracks only the newest copy.

`add-coach-session-reschedule` makes moving sessions easy, which makes this
duplicate easy to hit. The guard lives in its own change because
`spa-trainingpeaks-extension` exists only in the deltas of the unarchived
`add-trainingpeaks-workout-push`.

## What Changes

- **Ledger field.** A confirmed TrainingPeaks export-ledger row records the
  pushed day as an optional `ExportLedgerEntry.destinationDate`, taken from
  the payload's `workoutDay`.
  - `buildCommitPatch` (`application/export/build-commit-patch.ts:22-38`) is
    the single writer.
  - It is used on both the created path (`record-export-post.ts:61`) and the
    updated path (`record-export-constraint.ts:80`), so the two paths cannot
    drift.
  - The date reaches it as an explicit `destinationDate` input. The use case
    reads it from `payload.workoutDay` for the TrainingPeaks route and gives
    `undefined` for any other destination.
- **Guard.** Before a TrainingPeaks push, the SPA **blocks** it whenever a
  confirmed row exists for the workout and its `contentHash` differs from the
  new payload's hash.
  - The reason is `moved` when the row's `destinationDate` is known and
    differs from the workout's `date`.
  - Otherwise the reason is `changed`.
  - An unchanged re-send stays the existing idempotent skip.
  - The guard runs after the read-only `checkSession` probe, not before it.
    The payload hash includes the `athleteId`, and only the probe provides
    it. So a blocked push still probes the session, but no workout write
    (`push-workout`) reaches the bridge.
  - A pending row and a row flagged `forceRepush` are not blocked. A
    forced re-push means the destination lost its copy, so sending again is
    the repair.
- **Override.** A blocked push offers "Send a copy anyway" behind a
  confirmation. The confirmation says that TrainingPeaks will then hold two
  copies, and that Kaiord forgets the first copy and tracks only the latest
  one.
- **Out of scope.** Moving or deleting the TrainingPeaks workout is the later
  change `add-trainingpeaks-workout-move`. It needs the DELETE route, an id
  ledger, the privacy golden and the CWS listing.

## Impact

- **Packages.** Only `@kaiord/workout-spa-editor` (private). No bridge change.
- **Layers.**
  - domain type: `ExportLedgerEntry.destinationDate`
  - application: `buildCommitPatch`, `recordExport`, and the pure
    `trainingPeaksRepushGuard`
  - UI: `TrainingPeaksPushButton`
- **Persistence.** One optional, unindexed field and no schema bump. The
  newest-`updatedAt` merge for non-Garmin rows carries it along.
- **Specs.** `spa-trainingpeaks-extension` (ADDED).

## Dependencies and sequencing

- **Archive after `add-trainingpeaks-workout-push`.** That change introduces
  the `spa-trainingpeaks-extension` capability.
- **Implement after or alongside `add-coach-session-reschedule` PR-1.** The
  guard works without it, but the duplicate becomes easy to hit once moves are
  easy.
