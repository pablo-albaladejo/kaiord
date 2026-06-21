import { describe, expect, it } from "vitest";

import { getStepColor } from "./step-colors";

const DEFAULT_BLUE = "#3b82f6";
const BLOCK_PURPLE = "#8b5cf6";
const WARMUP_GREEN = "#10b981";
const COOLDOWN_CYAN = "#06b6d4";
const REST_GRAY = "#6b7280";
const POWER_RED = "#ef4444";
const HR_ORANGE = "#f59e0b";
const REPEAT = 4;

describe("getStepColor", () => {
  it("should return the default blue for a non-object input", () => {
    // Arrange
    const step = null;

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(DEFAULT_BLUE);
  });

  it("should return purple for a repetition block", () => {
    // Arrange
    const step = { repeatCount: REPEAT };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(BLOCK_PURPLE);
  });

  it("should return green for a warmup step", () => {
    // Arrange
    const step = { intensity: "warmup" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(WARMUP_GREEN);
  });

  it("should return cyan for a cooldown step", () => {
    // Arrange
    const step = { intensity: "cooldown" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(COOLDOWN_CYAN);
  });

  it("should return gray for rest and recovery steps", () => {
    // Arrange
    const rest = { intensity: "rest" };
    const recovery = { intensity: "recovery" };

    // Act
    const restColor = getStepColor(rest);
    const recoveryColor = getStepColor(recovery);

    // Assert
    expect(restColor).toBe(REST_GRAY);
    expect(recoveryColor).toBe(REST_GRAY);
  });

  it("should return red for an active power step", () => {
    // Arrange
    const step = { intensity: "active", targetType: "power" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(POWER_RED);
  });

  it("should return orange for an interval heart-rate step", () => {
    // Arrange
    const step = { intensity: "interval", targetType: "heart_rate" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(HR_ORANGE);
  });

  it("should return the default blue for an active step without a power or HR target", () => {
    // Arrange
    const step = { intensity: "active", targetType: "pace" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(DEFAULT_BLUE);
  });

  it("should return the default blue for an unknown intensity", () => {
    // Arrange
    const step = { intensity: "other" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(DEFAULT_BLUE);
  });
});
