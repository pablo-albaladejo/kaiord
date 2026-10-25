/**
 * A moved session against cloud sync (design §3.14, AC-9): both rows carry
 * the move's `updatedAt`, so a stale remote copy loses the merge and the
 * auto-push change token advances; a torn merge is healed onto the
 * workout's date.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { syncedChangeToken } from "../../hooks/use-sync-auto-push";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";
import type { Snapshot } from "../../types/snapshot";
import { healMatchDates } from "../coaching/heal-match-dates";
import { moveSession } from "../move-session";
import {
  coachActivity,
  coachWorkout,
  NOW,
  PROFILE,
  seedSession,
  sessionMatch,
  THU,
  TUE,
} from "../session-move.test-fixtures";
import { mergeSnapshots } from "./merge-snapshots";

const MOVED_AT = "2026-10-02T09:30:00.000Z";
const LATER = "2026-10-03T09:30:00.000Z";
const REMOTE_EDIT = "2026-10-02T00:00:00.000Z";

const snapshot = (
  exportedAt: string,
  workouts: WorkoutRecord[],
  matches: SessionMatch[]
): Snapshot => ({
  manifest: { schemaVersion: 40, deviceId: "d", exportedAt, encrypted: false },
  tables: { workouts, sessionMatches: matches },
  tombstones: [],
});

const movedRows = async () => {
  const persistence = await seedSession();
  await moveSession(
    { ...persistence, now: () => MOVED_AT },
    { workoutId: "w", targetDay: THU }
  );
  return {
    workout: (await persistence.workouts.getById("w"))!,
    match: (await persistence.sessionMatch.getById("m"))!,
  };
};

const db = sharedKaiordDatabase("session-move-sync");

const seedDexieSession = async () => {
  const persistence = createDexiePersistence(db);
  await persistence.coaching.upsertMany([coachActivity()]);
  await persistence.workouts.put(coachWorkout());
  await persistence.sessionMatch.put(sessionMatch());
  return persistence;
};

describe("a moved session and cloud sync", () => {
  it("should win the merge against a stale remote copy", async () => {
    // Arrange
    const { workout, match } = await movedRows();
    const local = snapshot(MOVED_AT, [workout], [match]);
    // Edited remotely after the seed but before the move: only the move's
    // own stamp makes the local rows newer.
    const remote = snapshot(
      LATER,
      [coachWorkout({ updatedAt: REMOTE_EDIT })],
      [sessionMatch({ updatedAt: REMOTE_EDIT })]
    );

    // Act
    const merged = mergeSnapshots(local, remote);

    // Assert
    expect(merged.tables.workouts).toEqual([workout]);
    expect(merged.tables.sessionMatches).toEqual([match]);
  });

  it("should advance the auto-push change token", async () => {
    // Arrange
    const persistence = await seedDexieSession();
    const before = await syncedChangeToken(db);

    // Act
    await moveSession(
      { ...persistence, now: () => MOVED_AT },
      { workoutId: "w", targetDay: THU }
    );

    // Assert
    expect(await syncedChangeToken(db)).not.toBe(before);
  });

  it("should heal a torn merge onto the workout's date", async () => {
    // Arrange
    const { workout } = await movedRows();
    const editedElsewhere = sessionMatch({ date: TUE, updatedAt: LATER });
    const merged = mergeSnapshots(
      snapshot(MOVED_AT, [workout], [sessionMatch({ date: THU })]),
      snapshot(LATER, [coachWorkout()], [editedElsewhere])
    );
    const persistence = await seedSession({ match: null });
    for (const row of merged.tables.workouts as WorkoutRecord[])
      await persistence.workouts.put(row);
    for (const row of merged.tables.sessionMatches as SessionMatch[])
      await persistence.sessionMatch.put(row);

    // Act
    const healed = await healMatchDates(
      { ...persistence, now: () => NOW },
      { profileId: PROFILE }
    );

    // Assert
    expect(healed).toBe(1);
    expect(await persistence.sessionMatch.getById("m")).toMatchObject({
      date: THU,
      updatedAt: NOW,
    });
  });
});
