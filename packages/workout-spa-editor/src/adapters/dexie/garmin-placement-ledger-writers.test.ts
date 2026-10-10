import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExportLedgerRepository } from "../../application/export/export-ledger-repository.port";
import {
  createPlacementHarness,
  D1,
  D2,
  LEDGER_KEY,
  preparePath,
  type PushPath,
} from "../../test-utils/placement-harness";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { KaiordDatabase } from "./dexie-database";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const SECOND_MS = 1000;
const PATHS: PushPath[] = ["C", "U", "S"];
const FOREIGN_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER_ENTRY = "9000";

let db: KaiordDatabase;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db = new KaiordDatabase(`kaiord-test-placement-${Math.random()}`);
  await db.open();
});
afterEach(async () => {
  vi.useRealTimers();
  db.close();
  await Dexie.delete(db.name);
});

const ledger = () => db.table<ExportLedgerEntry>("exportLedger");
const current = async () => (await ledger().toArray())[0];

/** A repository whose writes can be followed by another writer's. */
const interfering = (
  onWrite: (after: ExportLedgerEntry | undefined) => Promise<void>
) => {
  const repo = createDexieExportLedgerRepository(db);
  const wrapped: ExportLedgerRepository = {
    ...repo,
    mutateByKey: async (key, fn) => {
      const after = await repo.mutateByKey(key, fn);
      await onWrite(after);
      return after;
    },
  };
  return wrapped;
};

/** Another device's row for the record, as a cloud import replaces it. */
const importForeignRow = async () => {
  const row = await current();
  if (!row) return;
  await ledger().delete(row.id);
  await ledger().put({
    ...row,
    id: FOREIGN_ID,
    placement: {
      kind: "scheduled",
      workoutScheduleId: OTHER_ENTRY as never,
      workoutId: row.placement!.workoutId,
      date: "2026-10-20",
    },
    removalQueue: [
      {
        workoutScheduleId: OTHER_ENTRY as never,
        workoutId: row.placement!.workoutId,
        date: "2026-10-20",
        attempts: 0,
        abandoned: false,
        state: "keep",
      },
    ],
    updatedAt: new Date(Date.now() + SECOND_MS).toISOString(),
  });
};

describe("other ledger writers during a run (AC-31)", () => {
  it.each(PATHS)(
    "should merge a successful POST into a replaced row, queuing the loser (AC-31a) [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness({
        ledgerRepo: createDexieExportLedgerRepository(db),
      });
      const { date, content } = await preparePath(h, path);
      h.calendar.state.beforeAnswer = importForeignRow;

      // Act
      await h.push(date, content);

      // Assert
      const row = await current();
      const states = Object.fromEntries(
        (row?.removalQueue ?? []).map((e) => [e.workoutScheduleId, e.state])
      );
      expect(row?.id).toBe(FOREIGN_ID);
      expect(row?.placement?.kind).toBe("scheduled");
      expect(Object.values(states).filter((s) => s === "keep")).toHaveLength(1);
      expect(Object.values(states)).toContain("retire");
    }
  );

  it.each(PATHS)(
    "should write nothing on a failed POST into a replaced row (AC-31a) [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness({
        ledgerRepo: createDexieExportLedgerRepository(db),
      });
      const { date, content } = await preparePath(h, path);
      h.calendar.scripts.schedule.push({ answer: { ok: false, status: 400 } });
      let imported: ExportLedgerEntry | undefined;
      h.calendar.state.beforeAnswer = async () => {
        await importForeignRow();
        imported = await current();
      };

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toEqual({
        kind: "failed",
        reason: "guard-failed",
        retryable: true,
      });
      expect(await current()).toStrictEqual(imported);
    }
  );

  it.each(PATHS)(
    "should commit and drain a row that carries a foreign ledger id (AC-31b) [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness({
        ledgerRepo: createDexieExportLedgerRepository(db),
      });
      const { date, content } = await preparePath(h, path);
      const row = await current();
      if (row) {
        await ledger().delete(row.id);
        await ledger().put({ ...row, id: FOREIGN_ID });
      }

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result.kind).toBe(path === "C" ? "scheduled" : "moved");
      expect(h.calendar.items).toHaveLength(1);
    }
  );

  it.each(PATHS)(
    "should refuse with busy and 0 schedules when the row changes before the POST (AC-31c) [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness({
        ledgerRepo: interfering(async (after) => {
          if (after?.placement?.kind !== "attempting" || after.placement.posted)
            return;
          await ledger().update(after.id, {
            placement: { ...after.placement, at: new Date(0).toISOString() },
          });
        }),
      });
      const { date, content } = await preparePath(h, path);
      const schedules = h.calendar.count("schedule");

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toEqual({
        kind: "failed",
        reason: "busy",
        retryable: true,
      });
      expect(h.calendar.count("schedule")).toBe(schedules);
    }
  );

  it("should keep a queue entry imported during the drain (AC-31d)", async () => {
    // Arrange
    const h = createPlacementHarness({
      ledgerRepo: createDexieExportLedgerRepository(db),
    });
    await h.push(D1);
    const unschedule = h.calendar.port.unschedule;
    h.calendar.port.unschedule = async (id) => {
      const row = await current();
      await ledger().update(row!.id, {
        removalQueue: [
          ...(row!.removalQueue ?? []),
          {
            workoutScheduleId: OTHER_ENTRY as never,
            workoutId: "1700000" as never,
            date: "2026-10-20",
            attempts: 0,
            abandoned: false,
            state: "held",
          },
        ],
      });
      return unschedule(id);
    };

    // Act
    await h.push(D2);

    // Assert
    const states = (await current())?.removalQueue?.map((e) => [
      e.workoutScheduleId,
      e.state,
    ]);
    expect(states).toContainEqual([OTHER_ENTRY, "held"]);
    expect(states?.filter(([, s]) => s === "gone")).toHaveLength(1);
  });

  it.each([
    ["ok", {}],
    [
      "ambiguous",
      { answer: { ok: false as const, status: 503 }, create: true },
    ],
  ] as const)(
    "should not recreate a row deleted mid-run (AC-31e) [%s]",
    async (_name, script) => {
      // Arrange
      const h = createPlacementHarness({
        ledgerRepo: createDexieExportLedgerRepository(db),
      });
      await h.push(D1);
      h.calendar.scripts.schedule.push(script);
      h.calendar.state.beforeAnswer = () =>
        ledger()
          .where("kaiordRecordId")
          .equals(LEDGER_KEY.kaiordRecordId)
          .delete()
          .then(() => undefined);
      const unschedules = h.calendar.count("unschedule");

      // Act
      const result = await h.push(D2);

      // Assert
      expect(result).toEqual({
        kind: "failed",
        reason: "record-deleted",
        retryable: false,
        date: D2,
      });
      expect(await ledger().count()).toBe(0);
      expect(h.calendar.count("unschedule")).toBe(unschedules);
    }
  );

  it("should send 0 unschedule when the Placed changes before the drain (AC-31g)", async () => {
    // Arrange
    let armed = false;
    const h = createPlacementHarness({
      ledgerRepo: interfering(async (after) => {
        if (
          !armed ||
          after?.placement?.kind !== "scheduled" ||
          after.placement.date !== D2
        )
          return;
        armed = false;
        await ledger().update(after.id, {
          placement: { ...after.placement, workoutScheduleId: OTHER_ENTRY },
        });
      }),
    });
    await h.push(D1);
    armed = true;

    // Act
    const result = await h.push(D2);

    // Assert
    expect(h.calendar.count("unschedule")).toBe(0);
    expect(result).toMatchObject({ kind: "duplicate-left" });
  });
});
