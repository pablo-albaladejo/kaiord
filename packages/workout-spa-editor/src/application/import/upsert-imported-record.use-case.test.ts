/**
 * Tests for upsertImportedRecord use case (inbound natural-key upsert).
 * Uses in-memory port mocks — no Dexie dependency.
 */
import { describe, expect, it } from "vitest";

import type {
  ImportedRecord,
  ImportedRecordRepository,
} from "./imported-record-repository.port";
import { upsertImportedRecord } from "./upsert-imported-record.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const DATE = "2026-05-26";
const MEASURED_AT = "2026-05-26T08:00:00.000Z";

const baseInput = {
  profileId: PROFILE_ID,
  dataType: "weight" as const,
  sourceBridgeId: "garmin-bridge",
  externalId: "ext-001",
  date: DATE,
  payload: { weightKilograms: 75 },
  measuredAt: MEASURED_AT,
};

const makeRepo = (): ImportedRecordRepository & {
  rows: ImportedRecord[];
} => {
  const rows: ImportedRecord[] = [];
  return {
    rows,
    findByNaturalKey: async ({ profileId, sourceBridgeId, externalId }) =>
      rows.find(
        (r) =>
          r.profileId === profileId &&
          r.sourceBridgeId === sourceBridgeId &&
          r.externalId === externalId
      ),
    insert: async ({ record }) => {
      rows.push(record);
    },
  };
};

describe("upsertImportedRecord", () => {
  it("should create a new record on first call", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { recordRepo: repo };

    // Act
    const result = await upsertImportedRecord(deps, baseInput);

    // Assert
    expect(result.created).toBe(true);
    expect(result.kaiordRecordId).toBeTruthy();
    expect(repo.rows).toHaveLength(1);
  });

  it("should skip insert and return existing kaiordRecordId on second call with same natural key", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { recordRepo: repo };
    const first = await upsertImportedRecord(deps, baseInput);

    // Act
    const second = await upsertImportedRecord(deps, baseInput);

    // Assert
    expect(second.created).toBe(false);
    expect(second.kaiordRecordId).toBe(first.kaiordRecordId);
    expect(repo.rows).toHaveLength(1);
  });

  it("should create separate records for different sourceBridgeId on same date", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { recordRepo: repo };

    // Act
    const garmin = await upsertImportedRecord(deps, {
      ...baseInput,
      sourceBridgeId: "garmin-bridge",
    });
    const withings = await upsertImportedRecord(deps, {
      ...baseInput,
      sourceBridgeId: "withings-bridge",
    });

    // Assert
    expect(garmin.created).toBe(true);
    expect(withings.created).toBe(true);
    expect(garmin.kaiordRecordId).not.toBe(withings.kaiordRecordId);
    expect(repo.rows).toHaveLength(2);
  });

  it("should create separate records for different externalId on same date", async () => {
    // Arrange
    const repo = makeRepo();
    const deps = { recordRepo: repo };

    // Act
    const result1 = await upsertImportedRecord(deps, {
      ...baseInput,
      externalId: "ext-001",
    });
    const result2 = await upsertImportedRecord(deps, {
      ...baseInput,
      externalId: "ext-002",
    });

    // Assert
    expect(result1.created).toBe(true);
    expect(result2.created).toBe(true);
    expect(result1.kaiordRecordId).not.toBe(result2.kaiordRecordId);
    expect(repo.rows).toHaveLength(2);
  });
});
