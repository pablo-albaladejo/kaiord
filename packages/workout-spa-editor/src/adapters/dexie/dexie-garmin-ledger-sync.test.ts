/**
 * AC-15(f) — the Garmin-aware ledger merge runs through the T0c row-merge
 * hook on a real two-device cloud sync, for rows committed on the created
 * and on the updated path. Device A holds `Placed S2` with S1 retired;
 * device B, newer, still holds `Placed S1`. Both devices must converge on
 * `Placed S2` with S1 `retire` (the review-3 D repro), never on `S1`.
 * When A adopted S2 by `calendar-find` while B still holds the stale
 * `uncertain` with both ids `held`, both must settle on the adoption (H2) —
 * never flipping back, and with only S1 drainable.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recordExport } from "../../application/export/record-export.use-case";
import { syncWithCloud } from "../../application/sync/sync-with-cloud";
import { createInMemoryCloudSyncPort } from "../../test-utils/in-memory-cloud-sync-port";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  type GarminPlacement,
  parseGarminScheduleId,
  parseGarminWorkoutId,
} from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { KaiordDatabase } from "./dexie-database";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";
import { createDexieSnapshotPort } from "./dexie-snapshot-port";

const RECORD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const KEY = { kaiordRecordId: RECORD_ID, destinationBridgeId: "garmin-bridge" };
const WORKOUT_ID = parseGarminWorkoutId("1707805999")!;
const D1 = "2026-09-29";
const D2 = "2026-09-30";
const A_WRITES_AT = new Date("2026-09-28T08:00:00.000Z");
const B_WRITES_AT = new Date("2026-09-28T09:00:00.000Z");

const scheduled = (id: string, date: string): GarminPlacement => ({
  kind: "scheduled",
  workoutScheduleId: parseGarminScheduleId(id)!,
  workoutId: WORKOUT_ID,
  date,
});
const entry = (
  id: string,
  date: string,
  state: GarminRemovalEntry["state"]
): GarminRemovalEntry => ({
  workoutScheduleId: parseGarminScheduleId(id)!,
  workoutId: WORKOUT_ID,
  date,
  attempts: 0,
  abandoned: false,
  state,
});

const dbName = (device: string) =>
  `kaiord-test-garmin-ledger-sync-${device}-${Date.now()}-${Math.random()}`;

type Path = "created" | "updated";

/** Library-push the workout on `path`, then persist this device's placement. */
const pushAndPlace = async (
  db: KaiordDatabase,
  path: Path,
  garmin: Pick<ExportLedgerEntry, "placement" | "removalQueue">
) => {
  const ledgerRepo = createDexieExportLedgerRepository(db);
  const push = (workoutName: string) =>
    recordExport(
      { ledgerRepo },
      {
        kaiordRecordId: RECORD_ID,
        dataType: "workout",
        destinationBridgeId: "garmin-bridge",
        payload: { workoutName },
        postFn: async () => ({
          externalId: WORKOUT_ID,
          library: { kind: "confirmed", workoutId: WORKOUT_ID },
        }),
      }
    );
  if (path === "updated") await push("First version");
  const { outcome } = await push("Edited version");
  await ledgerRepo.mutateByKey(KEY, (row) => row && { ...row, ...garmin });
  return outcome;
};

describe("Garmin export-ledger cross-device sync", () => {
  let dbA: KaiordDatabase;
  let dbB: KaiordDatabase;

  beforeEach(async () => {
    // Fake only `Date`: Dexie and fake-indexeddb schedule on real timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    dbA = new KaiordDatabase(dbName("a"));
    dbB = new KaiordDatabase(dbName("b"));
    await Promise.all([dbA.open(), dbB.open()]);
  });

  afterEach(async () => {
    vi.useRealTimers();
    dbA.close();
    dbB.close();
    await Promise.all([Dexie.delete(dbA.name), Dexie.delete(dbB.name)]);
  });

  it.each<Path>(["created", "updated"])(
    "should converge on the live Placed for rows committed on the %s path",
    async (path) => {
      // Arrange
      vi.setSystemTime(A_WRITES_AT);
      const outcomeA = await pushAndPlace(dbA, path, {
        placement: scheduled("2", D2),
        removalQueue: [entry("1", D1, "retire"), entry("2", D2, "keep")],
      });
      vi.setSystemTime(B_WRITES_AT);
      const outcomeB = await pushAndPlace(dbB, path, {
        placement: scheduled("1", D1),
        removalQueue: [entry("1", D1, "keep")],
      });
      const cloud = createInMemoryCloudSyncPort({
        authenticated: true,
        snapshot: null,
        revision: null,
        pushCount: 0,
      });
      const sync = (db: KaiordDatabase, deviceId: string) =>
        syncWithCloud({
          cloud,
          snapshotPort: createDexieSnapshotPort(db),
          deviceId,
        });

      // Act
      await sync(dbA, "dev-a");
      await sync(dbB, "dev-b");
      await sync(dbA, "dev-a");

      // Assert
      expect([outcomeA, outcomeB]).toEqual([path, path]);
      const [rowA] = await dbA.table("exportLedger").toArray();
      const [rowB] = await dbB.table("exportLedger").toArray();
      expect(rowA).toStrictEqual(rowB);
      expect(rowA.placement).toEqual(scheduled("2", D2));
      expect(rowA.removalQueue).toEqual([
        entry("1", D1, "retire"),
        entry("2", D2, "keep"),
      ]);
    }
  );

  it.each<Path>(["created", "updated"])(
    "should keep an adoption against a newer stale uncertain, on the %s path",
    async (path) => {
      // Arrange
      vi.setSystemTime(A_WRITES_AT);
      await pushAndPlace(dbA, path, {
        placement: scheduled("2", D2),
        removalQueue: [entry("1", D1, "retire"), entry("2", D2, "keep")],
      });
      vi.setSystemTime(B_WRITES_AT);
      await pushAndPlace(dbB, path, {
        placement: { kind: "uncertain", workoutId: WORKOUT_ID, date: D2 },
        removalQueue: [entry("1", D1, "held"), entry("2", D2, "held")],
      });
      const cloud = createInMemoryCloudSyncPort({
        authenticated: true,
        snapshot: null,
        revision: null,
        pushCount: 0,
      });
      const sync = (db: KaiordDatabase, deviceId: string) =>
        syncWithCloud({
          cloud,
          snapshotPort: createDexieSnapshotPort(db),
          deviceId,
        });

      // Act
      for (const [db, deviceId] of SYNC_ORDER(dbA, dbB))
        await sync(db, deviceId);

      // Assert
      const [rowA] = await dbA.table("exportLedger").toArray();
      const [rowB] = await dbB.table("exportLedger").toArray();
      expect(rowA).toStrictEqual(rowB);
      expect(rowA.placement).toEqual(scheduled("2", D2));
      const drainable = (rowA.removalQueue as GarminRemovalEntry[])
        .filter((e) => e.state === "retire")
        .map((e) => e.workoutScheduleId);
      expect(drainable).toEqual(["1"]);
    }
  );
});

/** A → B → A, then one more full round: the rows must already be stable. */
const SYNC_ORDER = (a: KaiordDatabase, b: KaiordDatabase) =>
  [
    [a, "dev-a"],
    [b, "dev-b"],
    [a, "dev-a"],
    [b, "dev-b"],
    [a, "dev-a"],
  ] as const;
