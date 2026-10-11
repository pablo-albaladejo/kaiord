import { describe, expect, it } from "vitest";

import { recordedSleepSeconds } from "./recorded-sleep-duration";

const SEVEN_THIRTY = 27000;

describe("recordedSleepSeconds", () => {
  it("should return a recorded duration", () => {
    // Arrange
    const krd = { totalDurationSeconds: SEVEN_THIRTY };

    // Act
    const result = recordedSleepSeconds(krd);

    // Assert
    expect(result).toBe(SEVEN_THIRTY);
  });

  it("should read a missing duration as not recorded", () => {
    // Arrange
    const krd = {};

    // Act
    const result = recordedSleepSeconds(krd);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should read the legacy zero of a score-only entry as not recorded", () => {
    // Arrange
    const krd = { totalDurationSeconds: 0 };

    // Act
    const result = recordedSleepSeconds(krd);

    // Assert
    expect(result).toBeUndefined();
  });
});
