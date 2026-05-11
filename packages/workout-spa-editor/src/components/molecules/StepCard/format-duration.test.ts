import { describe, expect, it } from "vitest";

import type { WorkoutStep } from "../../../types/krd";
import { formatDuration } from "./format-duration";

const step = (durationType: string, duration: unknown): WorkoutStep =>
  ({ durationType, duration }) as unknown as WorkoutStep;

describe("formatDuration", () => {
  it("should format a 5-minute time step (300s) as '5 min' (no padding when seconds=0)", () => {
    // Arrange
    const input = step("time", { seconds: 300 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("5 min");
  });

  it("should format a 4:10 time step (250s) as '4:10'", () => {
    // Arrange
    const input = step("time", { seconds: 250 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("4:10");
  });

  it("should format a 0:05 time step (5s) as '0:05' (padStart adds leading zero)", () => {
    // Arrange
    const input = step("time", { seconds: 5 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("0:05");
  });

  it("should format a 0-second time step as '0 min'", () => {
    // Arrange
    const input = step("time", { seconds: 0 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("0 min");
  });

  it("should fall back to 'Time' when durationType='time' but duration is missing seconds key", () => {
    // Arrange
    const input = step("time", {});

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("Time");
  });

  it("should format a 1500m distance step as '1.50 km'", () => {
    // Arrange
    const input = step("distance", { meters: 1500 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("1.50 km");
  });

  it("should format a 1000m distance step as '1.00 km' (boundary km=1)", () => {
    // Arrange
    const input = step("distance", { meters: 1000 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("1.00 km");
  });

  it("should format a 500m distance step as '500 m' (km < 1 fallback)", () => {
    // Arrange
    const input = step("distance", { meters: 500 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("500 m");
  });

  it("should fall back to 'Distance' when durationType='distance' but duration has no meters key", () => {
    // Arrange
    const input = step("distance", {});

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("Distance");
  });

  it("should format a calories step as '250 cal'", () => {
    // Arrange
    const input = step("calories", { calories: 250 });

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("250 cal");
  });

  it("should fall back to 'Calories' when durationType='calories' but duration has no calories key", () => {
    // Arrange
    const input = step("calories", {});

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("Calories");
  });

  it("should return 'Open' for an open step", () => {
    // Arrange
    const input = step("open", {});

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("Open");
  });

  it("should default-format an unknown durationType by replacing underscores with spaces", () => {
    // Arrange
    const input = step("lap_button_press", {});

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("lap button press");
  });

  it("should default-format a snake_case durationType with multiple underscores", () => {
    // Arrange
    const input = step("heart_rate_zone_high", {});

    // Act
    const result = formatDuration(input);

    // Assert
    expect(result).toBe("heart rate zone high");
  });
});
