import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { getHealthRecordsForDay } from "./get-health-records-for-day";

const PROFILE_ID = "p-1";
const DAY = "2026-05-26";

describe("getHealthRecordsForDay", () => {
  it("should tag each row with its real sourceBridgeId", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthHrv.put({
      id: "row-1",
      profileId: PROFILE_ID,
      date: DAY,
      krd: {
        kind: "hrv",
        version: "2.0",
        rMSSD: 45,
        measurementWindow: "spot",
      },
      sourceBridgeId: "whoop-bridge",
      externalId: "ext-1",
    });

    // Act
    const result = await getHealthRecordsForDay(persistence, {
      profileId: PROFILE_ID,
      dataType: "hrv",
      day: DAY,
    });

    // Assert
    expect(result).toEqual([
      {
        sourceBridgeId: "whoop-bridge",
        record: {
          kind: "hrv",
          version: "2.0",
          rMSSD: 45,
          measurementWindow: "spot",
        },
      },
    ]);
  });

  it("should default to 'unknown' when a row has no sourceBridgeId", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthHrv.put({
      id: "row-1",
      profileId: PROFILE_ID,
      date: DAY,
      krd: {
        kind: "hrv",
        version: "2.0",
        rMSSD: 45,
        measurementWindow: "spot",
      },
    });

    // Act
    const result = await getHealthRecordsForDay(persistence, {
      profileId: PROFILE_ID,
      dataType: "hrv",
      day: DAY,
    });

    // Assert
    expect(result[0]?.sourceBridgeId).toBe("unknown");
  });

  it("should return an empty array for a dataType with no health table", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await getHealthRecordsForDay(persistence, {
      profileId: PROFILE_ID,
      dataType: "workout",
      day: DAY,
    });

    // Assert
    expect(result).toEqual([]);
  });
});
