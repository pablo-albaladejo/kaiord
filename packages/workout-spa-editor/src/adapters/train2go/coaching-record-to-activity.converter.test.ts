import { describe, expect, it } from "vitest";

import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import { toCoachingActivity } from "./coaching-record-to-activity.converter";

const baseRecord: CoachingActivityRecord = {
  id: buildCoachingActivityId("p1", "train2go", "12345"),
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-13",
  sport: "cycling",
  title: "Z2 60'",
  duration: "01:00:00",
  workload: 4,
  intensity: 3,
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
};

describe("toCoachingActivity (record → view-model)", () => {
  it("should build a stable view-model id of the form `${source}:${sourceId}`", () => {
    // Arrange

    // Act
    const result = toCoachingActivity(baseRecord);

    // Assert
    expect(result.id).toBe("train2go:12345");
    expect(result.source).toBe("train2go");
  });

  it("should use T2G as badge for train2go source", () => {
    // Arrange

    // Act
    const result = toCoachingActivity(baseRecord);

    // Assert
    expect(result.sourceBadge).toBe("T2G");
  });

  it("should fall back to upper-cased source label for unknown badges", () => {
    // Arrange

    // Act
    const result = toCoachingActivity({ ...baseRecord, source: "future-src" });

    // Assert
    expect(result.sourceBadge).toBe("FUTURE-SRC");
  });

  it("should map duration / status / intensity fields through", () => {
    // Arrange

    // Act
    const result = toCoachingActivity(baseRecord);

    // Assert
    expect(result.duration).toBe("01:00:00");
    expect(result.status).toBe("pending");
    expect(result.effort).toBe(3);
  });

  it("should omit empty duration", () => {
    // Arrange

    // Act
    const result = toCoachingActivity({ ...baseRecord, duration: "" });

    // Assert
    expect(result.duration).toBeUndefined();
  });
});
