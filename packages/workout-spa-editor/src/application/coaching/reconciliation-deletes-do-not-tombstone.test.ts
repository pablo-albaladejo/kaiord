/**
 * The rule this pins: the tombstone decorator covers deletes that express USER
 * INTENT; deletes that merely re-mirror an upstream source or repair local
 * state must NOT tombstone.
 *
 * All three paths below decide "this row is an orphan" from local state that
 * can legitimately differ on another device — a bridge week that came back
 * short, a canonical match that has not synced yet, an edit that has not
 * merged yet. A tombstone is permanent and cross-device, so getting this wrong
 * destroys real data in a way re-syncing cannot undo. That would be a worse
 * bug than the resurrection it fixes.
 */
import { describe, expect, it } from "vitest";

import { withTombstones } from "../../adapters/with-tombstones";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { SessionMatch } from "../../types/session-match";
import { healSessionMatchIdShape } from "./heal-session-match-id-shape";
import { removeUntouchedCoachingTemplates } from "./remove-untouched-coaching-templates";
import { persistSyncedWeek } from "./sync-week-persist";

const PROFILE_ID = "p-1";
const SOURCE = "train2go";

const activity = (sourceId: string): CoachingActivityRecord =>
  ({
    id: `${PROFILE_ID}:${SOURCE}:${sourceId}`,
    profileId: PROFILE_ID,
    source: SOURCE,
    sourceId,
    date: "2026-05-20",
    sport: "cycling",
    title: "Endurance",
    status: "pending",
    fetchedAt: "2026-05-19T00:00:00.000Z",
  }) as CoachingActivityRecord;

const match = (id: string, coachingActivityId: string): SessionMatch => ({
  id,
  profileId: PROFILE_ID,
  coachingActivityId,
  workoutId: `w-${id}`,
  date: "2026-05-20",
  createdAt: "2026-05-19T00:00:00.000Z",
  source: "manual",
  executedWorkoutIds: [],
});

describe("reconciliation deletes", () => {
  it("should not tombstone a coaching row the bridge stopped reporting", async () => {
    // Arrange
    // the local week holds an activity the next fetch omits, which
    // is exactly what an expired session or an unpublished week looks like.
    const port = withTombstones(createInMemoryPersistence());
    const orphan = activity("a-1");
    await port.coaching.upsertMany([orphan]);

    // Act
    const deleted = await persistSyncedWeek(
      { coaching: port.coaching, coachingSyncState: port.coachingSyncState },
      {
        profileId: PROFILE_ID,
        source: SOURCE,
        fetched: [],
        localSameSource: [orphan],
      }
    );

    // Assert
    expect(deleted).toBe(1);
    expect(await port.coaching.getById(orphan.id)).toBeUndefined();
    expect(await port.tombstones.list()).toEqual([]);
  });

  it("should tombstone a coaching row deleted through the decorated port", async () => {
    // Arrange
    // the counterpart: the decorator is still armed for this table,
    // so the exemption is the named method, not a hole in the decorator.
    const port = withTombstones(createInMemoryPersistence());
    const row = activity("a-2");
    await port.coaching.upsertMany([row]);

    // Act
    await port.coaching.delete(row.id);

    // Assert
    expect(
      await port.tombstones.get("coachingActivities", row.id)
    ).toBeDefined();
  });

  it("should not tombstone the duplicate session match dropped by the id-shape heal", async () => {
    // Arrange
    // a legacy SHORT-form row shadowed by a canonical COMPOSITE one.
    const port = withTombstones(createInMemoryPersistence());
    const canonicalActivity = activity("a-3");
    await port.coaching.upsertMany([canonicalActivity]);
    const legacy = match("m-legacy", `${SOURCE}:a-3`);
    const canonical = match("m-canonical", canonicalActivity.id);
    await port.sessionMatch.put(canonical);
    await port.sessionMatch.put(legacy);
    await port.workouts.put({
      id: legacy.workoutId,
      profileId: PROFILE_ID,
      date: "2026-05-20",
      source: SOURCE,
      // Workout `sourceId`s are profile-namespaced; the heal un-namespaces
      // this back to `a-3` to rebuild the canonical COMPOSITE activity id.
      sourceId: `${PROFILE_ID}:a-3`,
      state: "planned",
      updatedAt: "2026-05-19T00:00:00.000Z",
    } as never);

    // Act
    const outcome = await healSessionMatchIdShape(
      { match: legacy },
      {
        coaching: port.coaching,
        workouts: port.workouts,
        sessionMatches: port.sessionMatch,
      }
    );

    // Assert
    expect(outcome.kind).toBe("deleted-orphan");
    expect(await port.sessionMatch.getById(legacy.id)).toBeUndefined();
    expect(await port.tombstones.list()).toEqual([]);
  });

  it("should not tombstone an untouched coaching template dropped by junk cleanup", async () => {
    // Arrange
    // the junk verdict reads `modifiedAt` and `createdAt` ===
    // `updatedAt` on the LOCAL row. A device that has not merged the user's
    // edit yet still sees the pristine template, so a tombstone written here
    // would destroy the edited workout everywhere.
    const port = withTombstones(createInMemoryPersistence());
    const stamp = "2026-05-19T00:00:00.000Z";
    await port.workouts.put({
      id: "w-junk",
      profileId: PROFILE_ID,
      date: "2026-05-20",
      state: "structured",
      source: SOURCE,
      modifiedAt: null,
      createdAt: stamp,
      updatedAt: stamp,
      krd: {
        extensions: {
          structured_workout: {
            steps: [
              {
                name: "Warmup",
                intensity: "warmup",
                duration: { seconds: 600 },
                target: {
                  type: "heart_rate",
                  value: { unit: "zone", value: 1 },
                },
              },
            ],
          },
        },
      },
    } as never);

    // Act
    const result = await removeUntouchedCoachingTemplates(
      port.workouts,
      port.sessionMatch
    );

    // Assert
    expect(result.removed).toBe(1);
    expect(await port.workouts.getById("w-junk")).toBeUndefined();
    expect(await port.tombstones.list()).toEqual([]);
  });

  it("should tombstone a workout the user deletes through the decorated port", async () => {
    // Arrange
    // the counterpart: `workouts` stays decorated, so the exemption
    // is the named method, not a hole in the decorator.
    const port = withTombstones(createInMemoryPersistence());
    await port.workouts.put({
      id: "w-user",
      profileId: PROFILE_ID,
      date: "2026-05-20",
      state: "planned",
      updatedAt: "2026-05-19T00:00:00.000Z",
    } as never);

    // Act
    await port.workouts.delete("w-user");

    // Assert
    expect(await port.tombstones.get("workouts", "w-user")).toBeDefined();
  });

  it("should tombstone a session match the user unmatches", async () => {
    // Arrange
    const port = withTombstones(createInMemoryPersistence());
    const row = match("m-user", `${PROFILE_ID}:${SOURCE}:a-4`);
    await port.sessionMatch.put(row);

    // Act
    await port.sessionMatch.delete(row.id);

    // Assert
    expect(await port.tombstones.get("sessionMatches", row.id)).toBeDefined();
  });
});
