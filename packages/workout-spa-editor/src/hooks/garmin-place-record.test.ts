import { describe, expect, it, vi } from "vitest";

import { recordDeleted } from "../application/garmin-placement/placement-result";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { createPlacementHarness } from "../test-utils/placement-harness";
import { placeRecordResult } from "./garmin-place-record";

describe("placeRecordResult", () => {
  it("should report a workout deleted before its turn as record-deleted", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const pushWorkout = vi.fn();
    const { deps } = createPlacementHarness();

    // Act
    const result = await placeRecordResult(
      persistence,
      pushWorkout,
      "gone",
      deps
    );

    // Assert
    expect(result).toEqual({ result: recordDeleted() });
    expect(pushWorkout).not.toHaveBeenCalled();
  });
});
