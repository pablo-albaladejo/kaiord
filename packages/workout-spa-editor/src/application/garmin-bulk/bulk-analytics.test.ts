import { describe, expect, it } from "vitest";

import { failed } from "../garmin-placement/placement-result";
import { bulkEvent } from "./bulk-analytics";

const DATE = "2026-10-05";

describe("bulkEvent", () => {
  it("should count every status and carry nothing else", () => {
    // Arrange
    const outcomes = [
      { workoutId: "w-1", date: DATE, status: "scheduled" as const },
      { workoutId: "w-2", date: DATE, status: "scheduled" as const },
      {
        workoutId: "w-3",
        date: DATE,
        status: "failed" as const,
        result: failed("needs-reauth", true),
      },
    ];

    // Act
    const event = bulkEvent(outcomes);

    // Assert
    expect(event).toEqual({
      scheduled: 2,
      moved: 0,
      unchanged: 0,
      "duplicate-left": 0,
      uncertain: 0,
      "library-only": 0,
      "not-eligible": 0,
      failed: 1,
    });
  });
});
