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

  it.each([
    {
      field: "sourceBridgeId",
      second: { ...baseInput, sourceBridgeId: "withings-bridge" },
    },
    {
      field: "externalId",
      second: { ...baseInput, externalId: "ext-002" },
    },
  ])(
    "should create separate records for different $field on same date",
    async ({ second }) => {
      // Arrange
      const repo = makeRepo();
      const deps = { recordRepo: repo };

      // Act
      const first = await upsertImportedRecord(deps, baseInput);
      const result = await upsertImportedRecord(deps, second);

      // Assert
      expect(first.created).toBe(true);
      expect(result.created).toBe(true);
      expect(first.kaiordRecordId).not.toBe(result.kaiordRecordId);
      expect(repo.rows).toHaveLength(2);
    }
  );
});
