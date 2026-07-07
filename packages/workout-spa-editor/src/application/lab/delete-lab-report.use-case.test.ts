/**
 * deleteLabReport — removes a report and its values together against a real
 * (fake-indexeddb) Dexie instance; a missing report is a no-op.
 */
import "fake-indexeddb/auto";

import type { LabReport, LabValue } from "@kaiord/core";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { PersistencePort } from "../../ports/persistence-port";
import { deleteLabReport } from "./delete-lab-report.use-case";

const dbName = () => `kaiord-test-dellab-${Date.now()}-${Math.random()}`;

const report = (id: string, profileId: string): LabReport => ({
  id,
  profileId,
  date: "2026-03-05",
  provenance: { source: "manual" },
});

const value = (id: string, reportId: string, profileId: string): LabValue => ({
  id,
  profileId,
  reportId,
  parameterKey: "glucose",
  date: "2026-03-05",
  valueRaw: 90,
  unitRaw: "mg/dL",
  valueCanonical: 90,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
});

const seedTwoReports = async (persistence: PersistencePort): Promise<void> => {
  await persistence.labs.putReport(report("r1", "p1"));
  await persistence.labs.putReport(report("r2", "p1"));
  await persistence.labs.putValues([
    value("v1", "r1", "p1"),
    value("v2", "r2", "p1"),
  ]);
};

describe("deleteLabReport", () => {
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

  it("should delete the report and its values, leaving other reports intact", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await seedTwoReports(persistence);

    // Act
    await deleteLabReport(persistence, "r1");

    // Assert
    expect(await persistence.labs.getReport("r1")).toBeUndefined();
    expect(await persistence.labs.getValuesByReport("p1", "r1")).toHaveLength(
      0
    );
    expect(await persistence.labs.getReport("r2")).toBeDefined();
    expect(await persistence.labs.getValuesByReport("p1", "r2")).toHaveLength(
      1
    );
  });

  it("should no-op when the report does not exist", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await seedTwoReports(persistence);

    // Act
    await deleteLabReport(persistence, "missing");

    // Assert
    expect(await persistence.labs.getReport("r1")).toBeDefined();
    expect(await persistence.labs.getReport("r2")).toBeDefined();
  });
});
