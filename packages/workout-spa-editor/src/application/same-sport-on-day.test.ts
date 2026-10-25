import { describe, expect, it } from "vitest";

import { canonicalizeSport } from "../lib/canonicalize-sport";
import { type DayInput, sameSportOnDay } from "./same-sport-on-day";

const input = (overrides: Partial<DayInput> = {}): DayInput => ({
  workoutIds: ["other"],
  sport: "cycling",
  recording: false,
  ...overrides,
});

describe("sameSportOnDay", () => {
  it("should report a conflict for a matched session of the same sport (AC-13)", () => {
    // Arrange
    const inputs = [input({ workoutIds: ["planned", "rec"], sport: "bike" })];

    // Act
    const verdict = sameSportOnDay(inputs, "cycling", canonicalizeSport);

    // Assert
    expect(verdict).toEqual({ kind: "conflict", recording: false });
  });

  it("should flag a same-sport recording so the prompt adds the lock sentence (AC-14)", () => {
    // Arrange
    const inputs = [input({ sport: "running", recording: true })];

    // Act
    const verdict = sameSportOnDay(inputs, "run", canonicalizeSport);

    // Assert
    expect(verdict).toEqual({ kind: "conflict", recording: true });
  });

  it("should report a conflict for a solo coach plan of the same sport (AC-15)", () => {
    // Arrange
    const inputs = [input({ workoutIds: [], sport: "swim" })];

    // Act
    const verdict = sameSportOnDay(inputs, "swimming", canonicalizeSport);

    // Assert
    expect(verdict).toEqual({ kind: "conflict", recording: false });
  });

  it("should stay clear when the day only holds a different sport", () => {
    // Arrange
    const inputs = [input({ sport: "running", recording: true })];

    // Act
    const verdict = sameSportOnDay(inputs, "cycling", canonicalizeSport);

    // Assert
    expect(verdict).toEqual({ kind: "clear" });
  });

  it("should compare unknown sports by their trimmed lowercase name", () => {
    // Arrange
    const inputs = [input({ sport: " Yoga " })];

    // Act
    const same = sameSportOnDay(inputs, "yoga", canonicalizeSport);
    const other = sameSportOnDay(inputs, "pilates", canonicalizeSport);

    // Assert
    expect(same).toEqual({ kind: "conflict", recording: false });
    expect(other).toEqual({ kind: "clear" });
  });
});
