import { describe, expect, it } from "vitest";

import type { WorkoutState } from "../../../types/calendar-enums";
import { formatDuration, lifecycleTone } from "./workout-card-utils";

const THIRTY_MINUTES_SECONDS = 1800;

const ONE_HOUR_THIRTY_MINUTES_SECONDS = 5400;

const QUIET_STATES: WorkoutState[] = [
  "structured",
  "ready",
  "pushed",
  "modified",
  "skipped",
];

describe("lifecycleTone", () => {
  it("should raise a raw session, which cannot reach a watch", () => {
    // Arrange

    // Act
    const tone = lifecycleTone("raw");

    // Assert
    expect(tone).toBe("attention");
  });

  it("should raise a stale session, which no longer matches its plan", () => {
    // Arrange

    // Act
    const tone = lifecycleTone("stale");

    // Assert
    expect(tone).toBe("attention");
  });

  it.each(QUIET_STATES)("should keep %s quiet", (state) => {
    // Arrange

    // Act
    const tone = lifecycleTone(state);

    // Assert
    expect(tone).toBe("quiet");
  });
});

describe("formatDuration", () => {
  it("should format minutes only", () => {
    // Arrange

    // Act

    // Assert
    expect(formatDuration(THIRTY_MINUTES_SECONDS)).toBe("30m");
  });

  it("should format hours and minutes", () => {
    // Arrange

    // Act

    // Assert
    expect(formatDuration(ONE_HOUR_THIRTY_MINUTES_SECONDS)).toBe("1h 30m");
  });

  it("should format zero minutes", () => {
    // Arrange

    // Act

    // Assert
    expect(formatDuration(0)).toBe("0m");
  });
});
