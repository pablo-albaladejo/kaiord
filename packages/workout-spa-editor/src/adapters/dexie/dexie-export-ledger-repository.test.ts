import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import { KaiordDatabase } from "./dexie-database";
import { createDexieExportLedgerRepository } from "./dexie-export-ledger-repository";

const T1 = new Date("2026-09-10T08:00:00.000Z");
const T2 = new Date("2026-09-10T09:00:00.000Z");
const KEY = {
  kaiordRecordId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  destinationBridgeId: "garmin-bridge",
};

const row = (): ExportLedgerEntry => ({
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  ...KEY,
  dataType: "workout",
  destinationExternalId: "garmin-1",
  contentHash: "hash-1",
  exportedAt: T1.toISOString(),
  updatedAt: T1.toISOString(),
});

describe("createDexieExportLedgerRepository — mutateByKey", () => {
  let db: KaiordDatabase;

  beforeEach(async () => {
    // Fake only `Date`: Dexie and fake-indexeddb schedule on real timers.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T2);
    db = new KaiordDatabase(`kaiord-test-ledger-repo-${Math.random()}`);
    await db.open();
  });

  afterEach(async () => {
    vi.useRealTimers();
    db.close();
    await Dexie.delete(db.name);
  });

  it("should leave the row byte-identical when fn changes nothing", async () => {
    // Arrange
    await db.table("exportLedger").add(row());
    const repo = createDexieExportLedgerRepository(db);

    // Act
    const after = await repo.mutateByKey(KEY, (current) =>
      current ? { ...current } : current
    );

    // Assert
    expect(after).toEqual(row());
    expect(await db.table("exportLedger").toArray()).toEqual([row()]);
  });

  it("should stamp updatedAt only when fn changed the row", async () => {
    // Arrange
    await db.table("exportLedger").add(row());
    const repo = createDexieExportLedgerRepository(db);

    // Act
    const after = await repo.mutateByKey(KEY, (current) =>
      current ? { ...current, destinationExternalId: "garmin-2" } : current
    );

    // Assert
    const expected = {
      ...row(),
      destinationExternalId: "garmin-2",
      updatedAt: T2.toISOString(),
    };
    expect(after).toEqual(expected);
    expect(await db.table("exportLedger").toArray()).toEqual([expected]);
  });

  it("should pass undefined for an absent row and insert what fn returns", async () => {
    // Arrange
    const repo = createDexieExportLedgerRepository(db);
    const seen: Array<ExportLedgerEntry | undefined> = [];

    // Act
    const after = await repo.mutateByKey(KEY, (current) => {
      seen.push(current);
      return row();
    });

    // Assert
    expect(seen).toEqual([undefined]);
    expect(after).toEqual({ ...row(), updatedAt: T2.toISOString() });
    expect(await db.table("exportLedger").count()).toBe(1);
  });

  it("should write nothing when fn returns undefined", async () => {
    // Arrange
    await db.table("exportLedger").add(row());
    const repo = createDexieExportLedgerRepository(db);

    // Act
    const present = await repo.mutateByKey(KEY, () => undefined);
    const absent = await repo.mutateByKey(
      { ...KEY, destinationBridgeId: "other-bridge" },
      () => undefined
    );

    // Assert
    expect(present).toEqual(row());
    expect(absent).toBeUndefined();
    expect(await db.table("exportLedger").toArray()).toEqual([row()]);
  });

  it("should replace the key's row when fn returns a new id", async () => {
    // Arrange
    await db.table("exportLedger").add(row());
    const repo = createDexieExportLedgerRepository(db);
    const newId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

    // Act
    const after = await repo.mutateByKey(KEY, (current) =>
      current ? { ...current, id: newId } : current
    );

    // Assert
    const rows = (await db
      .table("exportLedger")
      .toArray()) as Array<ExportLedgerEntry>;
    expect(rows.map((r) => r.id)).toEqual([newId]);
    expect(after?.id).toBe(newId);
    expect(await db.table("tombstones").count()).toBe(0);
  });
});

describe("createDexieExportLedgerRepository — rollbackPending", () => {
  let db: KaiordDatabase;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T2);
    db = new KaiordDatabase(`kaiord-test-ledger-rollback-${Math.random()}`);
    await db.open();
  });

  afterEach(async () => {
    vi.useRealTimers();
    db.close();
    await Dexie.delete(db.name);
  });

  it("should leave a committed row with the same id untouched", async () => {
    // Arrange
    await db.table("exportLedger").add(row());
    const repo = createDexieExportLedgerRepository(db);

    // Act
    await repo.rollbackPending(row().id);

    // Assert
    expect(await db.table("exportLedger").toArray()).toEqual([row()]);
    expect(await db.table("tombstones").count()).toBe(0);
  });

  it("should delete and tombstone a pending row", async () => {
    // Arrange
    const pending = { ...row(), destinationExternalId: "pending" };
    await db.table("exportLedger").add(pending);
    const repo = createDexieExportLedgerRepository(db);

    // Act
    await repo.rollbackPending(pending.id);

    // Assert
    expect(await db.table("exportLedger").count()).toBe(0);
    expect(await db.table("tombstones").toArray()).toEqual([
      { table: "exportLedger", id: pending.id, deletedAt: T2.toISOString() },
    ]);
  });

  it("should do nothing when the row is absent", async () => {
    // Arrange
    const repo = createDexieExportLedgerRepository(db);

    // Act
    await repo.rollbackPending(row().id);

    // Assert
    expect(await db.table("exportLedger").count()).toBe(0);
    expect(await db.table("tombstones").count()).toBe(0);
  });
});
