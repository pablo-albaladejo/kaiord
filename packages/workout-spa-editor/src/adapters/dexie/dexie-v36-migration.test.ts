/**
 * Forward migration to v36 — Garmin calendar placement. Seeding a real v35
 * database with ledger rows, then opening KaiordDatabase, runs ONLY the v36
 * upgrade: every Garmin workout row gains its explicit `library` state, and
 * rows of other destinations or data types stay byte-identical (AC-13).
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import { KaiordDatabase } from "./dexie-database";
import { SCHEMAS } from "./dexie-schemas";

const dbName = () => `kaiord-test-v36-${Date.now()}-${Math.random()}`;

const SEED_VERSION = 35;
const SCHEMA_HEAD = 36;

const row = (
  id: string,
  overrides: Partial<ExportLedgerEntry>
): ExportLedgerEntry => ({
  id,
  kaiordRecordId: id.replace(/^b/, "a"),
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: "1707805999",
  contentHash: "hash",
  exportedAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-01T08:00:00.000Z",
  ...overrides,
});

const CONFIRMED = row("b0000000-0000-4000-8000-000000000001", {});
const PENDING = row("b0000000-0000-4000-8000-000000000002", {
  destinationExternalId: "pending",
});
const SENTINEL = row("b0000000-0000-4000-8000-000000000003", {
  destinationExternalId: "garmin-unconfirmed",
});
const TRAININGPEAKS = row("b0000000-0000-4000-8000-000000000004", {
  destinationBridgeId: "trainingpeaks-bridge",
  destinationExternalId: "98765",
});
const TANITA = row("b0000000-0000-4000-8000-000000000005", {
  dataType: "body-composition",
  destinationExternalId: "garmin-body-composition",
});

/** A v35 row a buggy or older writer could have left behind. */
const MALFORMED = {
  ...row("b0000000-0000-4000-8000-000000000006", {}),
  library: "x",
  removalQueue: {},
  placement: { kind: "scheduled", workoutScheduleId: "stub", date: "soon" },
  forceRepush: "yes",
};

const seedV35 = async (name: string): Promise<void> => {
  const older = new Dexie(name);
  older.version(SEED_VERSION).stores(SCHEMAS.v35);
  await older.open();
  await older
    .table("exportLedger")
    .bulkAdd([CONFIRMED, PENDING, SENTINEL, TRAININGPEAKS, TANITA, MALFORMED]);
  older.close();
};

const upgrade = async (name: string) => {
  const db = new KaiordDatabase(name);
  await db.open();
  const rows = (await db
    .table("exportLedger")
    .toArray()) as ExportLedgerEntry[];
  const version = db.verno;
  db.close();
  return { version, byId: new Map(rows.map((r) => [r.id, r])) };
};

describe("Dexie Garmin ledger (v36) migration", () => {
  let name: string;

  beforeEach(() => {
    name = dbName();
  });

  afterEach(async () => {
    await Dexie.delete(name);
  });

  it("should confirm the library of a row whose external id is Garmin-shaped", async () => {
    // Arrange
    await seedV35(name);

    // Act
    const { version, byId } = await upgrade(name);

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
    expect(byId.get(CONFIRMED.id)).toEqual({
      ...CONFIRMED,
      library: { kind: "confirmed", workoutId: "1707805999" },
    });
  });

  it.each([
    ["pending", PENDING],
    ["garmin-unconfirmed", SENTINEL],
  ])(
    "should mark the library unconfirmed for a %s row",
    async (_label, seeded) => {
      // Arrange
      await seedV35(name);

      // Act
      const { byId } = await upgrade(name);

      // Assert
      expect(byId.get(seeded.id)?.library).toEqual({ kind: "unconfirmed" });
      expect(byId.get(seeded.id)?.updatedAt).toBe(seeded.updatedAt);
    }
  );

  it.each([
    ["TrainingPeaks workout", TRAININGPEAKS],
    ["Tanita body-composition", TANITA],
  ])("should leave a %s row untouched", async (_label, seeded) => {
    // Arrange
    await seedV35(name);

    // Act
    const { byId } = await upgrade(name);

    // Assert
    expect(byId.get(seeded.id)).toStrictEqual(seeded);
  });

  it("should open and clean a malformed Garmin row", async () => {
    // Arrange
    await seedV35(name);

    // Act
    const { version, byId } = await upgrade(name);

    // Assert
    expect(version).toBe(SCHEMA_HEAD);
    expect(byId.get(MALFORMED.id)).toStrictEqual({
      ...row(MALFORMED.id, {}),
      library: { kind: "confirmed", workoutId: "1707805999" },
    });
  });
});
