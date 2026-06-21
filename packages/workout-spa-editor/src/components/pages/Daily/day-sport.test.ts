import { describe, expect, it } from "vitest";

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { representativeDaySport } from "./day-sport";

const matchedWith = (icon: string) =>
  ({ activity: { sport: { icon } } }) as MatchedSessionWithMetadata;
const planWith = (icon: string) => ({ sport: { icon } }) as CoachingActivity;
const workoutWith = (sport: string) => ({ sport }) as WorkoutRecord;

describe("representativeDaySport", () => {
  it("should use the matched activity's sport icon first", () => {
    // Arrange
    const matched = [matchedWith("\u{1F3CA}")];

    // Act
    const sport = representativeDaySport(matched, [planWith("\u{1F6B4}")], []);

    // Assert
    expect(sport).toBe("\u{1F3CA}");
  });

  it("should fall back to a solo plan's sport icon", () => {
    // Arrange
    const plans = [planWith("\u{1F6B4}")];

    // Act
    const sport = representativeDaySport([], plans, [workoutWith("running")]);

    // Assert
    expect(sport).toBe("\u{1F6B4}");
  });

  it("should map a core workout sport to an emoji when no coaching", () => {
    // Arrange
    const actuals = [workoutWith("running")];

    // Act
    const sport = representativeDaySport([], [], actuals);

    // Assert
    expect(sport).toBe("\u{1F3C3}");
  });

  it("should return null for an unknown workout sport", () => {
    // Arrange
    const actuals = [workoutWith("kayaking")];

    // Act
    const sport = representativeDaySport([], [], actuals);

    // Assert
    expect(sport).toBeNull();
  });

  it("should return null for an empty day", () => {
    // Arrange

    // Act
    const sport = representativeDaySport([], [], []);

    // Assert
    expect(sport).toBeNull();
  });
});
