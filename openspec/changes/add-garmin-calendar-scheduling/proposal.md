## Why

The end-to-end story Kaiord is built for is: read a week of sessions from
Train2Go, structure them with AI, and have them on the watch on the right day.
TrainingPeaks cannot be the destination — a Basic account refuses any date past
tomorrow (see the archived `add-trainingpeaks-workout-push`). Garmin can, but
today Kaiord only creates the workout in the Garmin **library**. The athlete
still has to drag each one onto its day by hand, and nothing moves when the
coach reschedules a session.

Phase 0 (2026-09-27) captured the two calendar calls live: `POST
/workout-service/schedule/{workoutId}` with `{"date":"YYYY-MM-DD"}` answers a
numeric `workoutScheduleId`, and `DELETE /workout-service/schedule/{id}`
answers 204. It also showed the hazard that shapes the whole design: the POST
is **not idempotent**. Two identical POSTs make two calendar entries. A
transport failure after the POST left is therefore ambiguous, and a naive retry
duplicates the session.

## What Changes

- **Bridge (`@kaiord/garmin-bridge`)**: two allowlist entries and two actions
  for the calendar write (`schedule`, `unschedule`), a per-action hard deadline
  that covers the token mint (including a mint joined from another caller), and
  a `features` list in the ping (`calendar-write-v1`). Then, gated on a live
  capture (T0b), a read-only `calendar-find` that filters a month of the
  calendar down to one workout's entries inside the service worker
  (`calendar-find-v1`).
- **Export ledger (SPA)**: Garmin rows gain a `library` state, a `placement`
  (a tagged union with branded Garmin ids), a `removalQueue` and a
  `forceRepush` flag. A Dexie v36 upgrade and an import-time normalizer derive
  them from existing rows, and the `exportLedger` merge hook delivered by
  #1265 is replaced by a Garmin-aware one where a superseded entry can never
  win.
- **Placement pipeline (SPA)**: `pushWorkoutToGarminCalendar` runs the library
  push and then the placement inside one Web Lock per record. It persists
  intent before every POST, creates before it deletes, resolves ambiguity by
  reading Garmin, and returns a `PlacementResult`. Every Garmin push entry
  point goes through it.
- **Send week**: a calendar action that places every eligible workout of the
  visible week, continues past failures, and offers "Retry" (retryable failures, plus library-only items once an outdated bridge is updated).
- **Follow the coach**: a Train2Go sync that sees the coach moved a session
  moves the Kaiord workout's date, against a `coachDate` baseline every
  builder sets.
- **Disclosure**: the privacy policy and the Chrome Web Store documents
  disclose that the bridge writes to and deletes from the Garmin calendar, and
  (with `calendar-find`) reads it, filtering on the device.

## Impact

- **Affected packages**: `@kaiord/garmin-bridge` (minor),
  `@kaiord/workout-spa-editor` (private), `packages/docs` (privacy policy).
- **Guards touched**: `scripts/check-bridge-privacy-surface.mjs` and its golden
  (+3 allowlist entries, +3 external actions, nothing else).
  `check-bridge-core-parity` is unaffected: no vendored file, capability or
  `bridge-identity.js` change.
- **Specs**: `garmin-bridge`, `spa-garmin-extension`, `spa-calendar`,
  `spa-coaching-integration`, `spa-persistence-port`, `privacy-policy`.
- **Prerequisite, done**: PR #1265 fixed the cloud-sync ledger bug and
  delivered `mutateByKey`, `commitByKey`, `rollbackPending`, the per-table
  `ROW_MERGE_HOOKS` registry and the injected `LiveRowMerge`.
- **Destructive surface**: the bridge gains a `DELETE` against the athlete's
  real calendar. It only ever receives ids Garmin itself returned, and only
  once they are superseded.
- **Not in scope**: deleting library workouts, unscheduling on delete in
  Kaiord, following the coach for session-matched workouts, and any Chrome Web
  Store release.
