/**
 * Characterisation (H18, step 0 of the scheduled-lifecycle change): what a
 * Kaiord-side workout delete does to the workout's Garmin ledger row.
 *
 * The rule: deleting in Kaiord never queues, sends or re-sends anything to
 * Garmin, and the ledger row stays as it is — a pending `retire` entry
 * included. The export-ledger cascade keys on `kaiordRecordId`, a field a
 * health record carries and a `WorkoutRecord` does not, so it never fires
 * for a workout; and the removal-queue drain only runs inside a push of a
 * record that still exists (`garmin-place-record.test.ts`).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPlacementHarness,
  D1,
  D2,
  RECORD_ID,
} from "../../test-utils/placement-harness";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { createAppPersistence } from "../create-app-persistence";
import { KaiordDatabase } from "./dexie-database";
import { installExportLedgerCascade } from "./dexie-export-ledger-cascade";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";

const T0 = new Date("2026-10-01T08:00:00.000Z");

const workout = (): WorkoutRecord => ({
  id: RECORD_ID,
  profileId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
  date: D2,
  sport: "running",
  source: "scratch",
  sourceId: null,
  planId: null,
  state: "pushed",
  raw: null,
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: "1700000",
  tags: [],
  previousState: null,
  createdAt: T0.toISOString(),
  modifiedAt: null,
  updatedAt: T0.toISOString(),
});

let db: KaiordDatabase;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db = new KaiordDatabase(`kaiord-test-ledger-delete-${Math.random()}`);
  installExportLedgerCascade(db);
  await db.open();
});
afterEach(async () => {
  vi.useRealTimers();
  db.close();
  await Dexie.delete(db.name);
});

/** Places D1, then moves to D2 with the DELETE of D1 failing once: the
    row holds a `Placed` on D2 and a pending `retire` entry for D1. */
const placeWithPendingRetire = async () => {
  const h = createPlacementHarness({
    ledgerRepo: createDexieExportLedgerRepository(db),
  });
  await h.push(D1);
  h.calendar.scripts.unschedule.push({ ok: false, status: 500 });
  await h.push(D2);
  return h;
};

describe("deleting a workout leaves its Garmin ledger row as it is", () => {
  it("should keep the row, its pending retire entry and Garmin untouched", async () => {
    // Arrange
    const h = await placeWithPendingRetire();
    const persistence = createAppPersistence(db);
    await persistence.workouts.put(workout());
    const before = await h.row();
    const calls = h.calendar.calls.length;

    // Act
    await persistence.workouts.delete(RECORD_ID);

    // Assert
    expect(before?.removalQueue).toContainEqual(
      expect.objectContaining({ date: D1, state: "retire", attempts: 1 })
    );
    expect(await persistence.workouts.getById(RECORD_ID)).toBeUndefined();
    expect(await h.row()).toEqual(before);
    expect(
      await db.table<ExportLedgerEntry>("exportLedger").toArray()
    ).toHaveLength(1);
    expect(h.calendar.calls).toHaveLength(calls);
    expect(h.calendar.items.map((i) => i.date).sort()).toEqual([D1, D2]);
    expect(await db.table("tombstones").toArray()).toEqual([
      expect.objectContaining({ table: "workouts", id: RECORD_ID }),
    ]);
  });
});
