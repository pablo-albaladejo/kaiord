/**
 * Dexie lab repository — exercised against a real (fake-indexeddb) Dexie
 * instance at head schema (v31). Covers the report+values round-trip, the four
 * indexed read patterns (series, report, report-listing, latest prefix-scan),
 * and the two-table `deleteByProfile` cascade.
 */
import "fake-indexeddb/auto";

import type { LabReport, LabValue } from "@kaiord/core";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KaiordDatabase } from "./dexie-database";
import { createDexieLabRepository } from "./dexie-lab-repository";

const dbName = () => `kaiord-test-lab-${Date.now()}-${Math.random()}`;

const report = (id: string, profileId: string, date: string): LabReport => ({
  id,
  profileId,
  date,
  provenance: { source: "manual" },
});

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id" | "profileId">
): LabValue => ({
  reportId: "r1",
  parameterKey: "glucose",
  date: "2026-01-01",
  valueRaw: 90,
  unitRaw: "mg/dL",
  valueCanonical: 90,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
  ...overrides,
});

describe("createDexieLabRepository", () => {
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

  it("should round-trip a report and its values", async () => {
    // Arrange
    const repo = createDexieLabRepository(db);
    await repo.putReport(report("r1", "p1", "2026-03-05"));
    await repo.putValues([
      value({ id: "v1", profileId: "p1", reportId: "r1" }),
      value({ id: "v2", profileId: "p1", reportId: "r1", parameterKey: "ldl" }),
    ]);

    // Act
    const stored = await repo.getReport("r1");
    const values = await repo.getValuesByReport("p1", "r1");

    // Assert
    expect(stored?.date).toBe("2026-03-05");
    expect(values.map((v) => v.id).sort()).toEqual(["v1", "v2"]);
  });

  it("should serve the per-parameter series by index for one parameter only", async () => {
    // Arrange
    const repo = createDexieLabRepository(db);
    await repo.putValues([
      value({
        id: "v1",
        profileId: "p1",
        parameterKey: "glucose",
        date: "2026-01-01",
      }),
      value({
        id: "v2",
        profileId: "p1",
        parameterKey: "glucose",
        date: "2026-02-01",
      }),
      value({
        id: "v3",
        profileId: "p1",
        parameterKey: "ldl",
        date: "2026-01-01",
      }),
      value({
        id: "v4",
        profileId: "p2",
        parameterKey: "glucose",
        date: "2026-01-01",
      }),
    ]);

    // Act
    const series = await repo.getValueSeries("p1", "glucose");

    // Assert
    expect(series.map((v) => v.id).sort()).toEqual(["v1", "v2"]);
  });

  it("should list a profile's reports by date and exclude other profiles", async () => {
    // Arrange
    const repo = createDexieLabRepository(db);
    await repo.putReport(report("r1", "p1", "2026-01-01"));
    await repo.putReport(report("r2", "p1", "2026-02-01"));
    await repo.putReport(report("r3", "p2", "2026-01-01"));

    // Act
    const reports = await repo.listReports("p1");

    // Assert
    expect(reports.map((r) => r.id).sort()).toEqual(["r1", "r2"]);
  });

  it("should read only the values of the requested report", async () => {
    // Arrange
    const repo = createDexieLabRepository(db);
    await repo.putValues([
      value({ id: "v1", profileId: "p1", reportId: "r1" }),
      value({ id: "v2", profileId: "p1", reportId: "r2" }),
    ]);

    // Act
    const values = await repo.getValuesByReport("p1", "r1");

    // Assert
    expect(values.map((v) => v.id)).toEqual(["v1"]);
  });

  it("should return every value for a profile via the latest prefix-scan", async () => {
    // Arrange
    const repo = createDexieLabRepository(db);
    await repo.putValues([
      value({ id: "v1", profileId: "p1", parameterKey: "glucose" }),
      value({ id: "v2", profileId: "p1", parameterKey: "ldl" }),
      value({ id: "v3", profileId: "p2", parameterKey: "glucose" }),
    ]);

    // Act
    const values = await repo.getValuesByProfile("p1");

    // Assert
    expect(values.map((v) => v.id).sort()).toEqual(["v1", "v2"]);
  });

  it("should delete both lab tables for the target profile only", async () => {
    // Arrange
    const repo = createDexieLabRepository(db);
    await repo.putReport(report("r1", "p1", "2026-01-01"));
    await repo.putReport(report("r2", "p2", "2026-01-01"));
    await repo.putValues([
      value({ id: "v1", profileId: "p1", reportId: "r1" }),
      value({ id: "v2", profileId: "p2", reportId: "r2" }),
    ]);

    // Act
    await repo.deleteByProfile("p1");

    // Assert
    expect(await repo.listReports("p1")).toHaveLength(0);
    expect(await repo.getValuesByProfile("p1")).toHaveLength(0);
    expect(await repo.listReports("p2")).toHaveLength(1);
    expect(await repo.getValuesByProfile("p2")).toHaveLength(1);
  });
});
