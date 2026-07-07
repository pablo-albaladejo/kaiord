/**
 * saveLabReport — atomicity against a real (fake-indexeddb) Dexie instance.
 * A committed save writes the report and every value; a mid-write failure
 * rolls the whole thing back (no report without values, no values without a
 * report). Rollback is asserted ONLY here (a naive in-memory twin cannot
 * exercise a real IndexedDB abort).
 */
import "fake-indexeddb/auto";

import type { LabReport, LabValue } from "@kaiord/core";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { saveLabReport } from "./save-lab-report.use-case";

const dbName = () => `kaiord-test-savelab-${Date.now()}-${Math.random()}`;

const REPORT: LabReport = {
  id: "r1",
  profileId: "p1",
  date: "2026-03-05",
  provenance: { source: "manual" },
};

const value = (id: string, parameterKey: string): LabValue => ({
  id,
  profileId: "p1",
  reportId: "r1",
  parameterKey,
  date: "2026-03-05",
  valueRaw: 90,
  unitRaw: "mg/dL",
  valueCanonical: 90,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
});

const VALUES = [value("v1", "glucose"), value("v2", "ldl")];

describe("saveLabReport", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = dbName();
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  it("should persist the report and all its values in one commit", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await saveLabReport(persistence, REPORT, VALUES);

    // Assert
    expect(await persistence.labs.getReport("r1")).toBeDefined();
    expect(await persistence.labs.getValuesByReport("p1", "r1")).toHaveLength(
      2
    );
  });

  it("should preserve provenance manual on every persisted value", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);

    // Act
    await saveLabReport(persistence, REPORT, VALUES);
    const stored = await persistence.labs.getValuesByReport("p1", "r1");

    // Assert
    expect(stored.every((v) => v.provenance.source === "manual")).toBe(true);
  });

  it("should roll the report back when the values write fails mid-transaction", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const spy = vi
      .spyOn(db.table("labValues"), "bulkPut")
      .mockRejectedValueOnce(new Error("simulated values-write failure"));

    // Act
    await expect(saveLabReport(persistence, REPORT, VALUES)).rejects.toThrow();

    // Assert
    expect(await persistence.labs.getReport("r1")).toBeUndefined();
    expect(await persistence.labs.getValuesByReport("p1", "r1")).toHaveLength(
      0
    );

    // Cleanup
    spy.mockRestore();
  });
});
