## Context

Once the AI has built the Workout for a Coaching Activity, the athlete could
not steer it, rebuild it, delete it from the dialog or keep it apart from the
activity. The coach's text is the coach's and comes back on every sync; a
deleted Workout left its Match behind; and the dialog's auto-heal re-paired a
Split by finding the Workout through the activity's source id.

## Decisions

### D1. The Athlete note lives in its own store

- **A.** A field on `CoachingActivityRecord`.
- **B.** An `athleteNotes` store (Dexie v41), one row per activity keyed by
  its composite id.

B is chosen. A coach re-sync rewrites the activity row, so a field on it
would be lost or would need every sync path to carry it. Its own store
follows the Workout's rules: Drive snapshot merged per row by `updatedAt`,
backup, profile-delete cascade, auto-profile re-key. Clearing keeps the row
with empty text, stamped newer, so the clearing syncs.

### D2. The note goes after the coach's text, labelled

The coach's text is never edited. The prompt holds it first, then the note
labelled as the athlete's own words, so the AI can tell who asked for what.
The note goes only to the AI Provider that already receives the coach's text,
never to Train2Go.

### D3. Regenerate replaces in place, through the same builder

- **A.** Delete the Workout and build a new one.
- **B.** Rebuild and write the new KRD into the same row.

B is chosen: the Workout keeps its id, Day and Match, so links and the
calendar do not move. It goes through `chooseCoachingBuilder`, so a steps
table with no note is read again without the AI. A Workout on the watch goes
back to Ready and the earlier version stays in Garmin's library (Kaiord does
not delete from it); hand edits are replaced, so both ask first. A failed or
cancelled build writes nothing.

### D4. Delete removes the Workout and its Match together

Both go through the tombstoning port in one transaction, from the dialog and
from the detail page, and Undo writes both back newer than their tombstones.
A Match left pointing at a deleted Workout made `ensureSessionMatch` skip the
next one; the build also drops such a Match before writing its own.

### D5. Split detaches the Workout built from the activity

- **A.** Remember the Split in a separate "do not pair" list.
- **B.** Clear the Workout's `sourceId` when it was built from that activity.

B is chosen: the auto-heal finds the Workout only through that source id, so
without it nothing pairs them again, and no new store or rule is needed. A
Workout matched by hand keeps its own `sourceId`.

## Risks / Trade-offs

- A detached Workout no longer dedupes against its activity: a later
  `[AI process]` on the activity builds a new Workout. That is what the
  athlete asked for by splitting.
