/**
 * Mixed app versions on one Drive (design §3.14): a device on a build
 * without `SessionMatch.updatedAt` exports matches that lack it. They import
 * and read back, and the heal re-dates and stamps the stale one.
 */
import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { healMatchDates } from "../../application/coaching/heal-match-dates";
import {
  coachActivity,
  coachWorkout,
  NOW,
  PROFILE,
  sessionMatch,
  THU,
  TUE,
} from "../../application/session-move.test-fixtures";
import { importSnapshot } from "../../application/sync/import-snapshot";
import { sharedKaiordDatabase } from "../../test-utils/shared-kaiord-database";
import { createDexiePersistence } from "./dexie-persistence-adapter";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const db = sharedKaiordDatabase("match-mixed-version");

const oldDeviceSnapshot = () => ({
  manifest: {
    schemaVersion: db.verno,
    deviceId: "old",
    exportedAt: NOW,
    encrypted: false,
  },
  tables: {
    coachingActivities: [coachActivity()],
    // Moved to Thursday on the old build: its match stayed on Tuesday.
    workouts: [coachWorkout({ date: THU })],
    sessionMatches: [sessionMatch({ date: TUE })],
  },
  tombstones: [],
});

describe("importing matches without updatedAt", () => {
  it("should import them and heal the stale one", async () => {
    // Arrange
    await db.open();
    const port = createDexieSnapshotPort(db);
    const persistence = createDexiePersistence(db);
    await importSnapshot({ port, snapshot: oldDeviceSnapshot() });
    const imported = await persistence.sessionMatch.getById("m");

    // Act
    const healed = await healMatchDates(
      { ...persistence, now: () => NOW },
      { profileId: PROFILE }
    );

    // Assert
    expect(imported).toEqual(sessionMatch({ date: TUE }));
    expect(healed).toBe(1);
    expect(await persistence.sessionMatch.getById("m")).toEqual(
      sessionMatch({ date: THU, updatedAt: NOW })
    );
  });
});
