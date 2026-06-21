import type { Target, WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { stepDetail, stepKind } from "./step-detail";

describe("stepKind", () => {
  it("should use the explicit step name when present", () => {
    // Arrange
    const step = { name: "Sprint", intensity: "active" } as WorkoutStep;

    // Act
    const kind = stepKind(step);

    // Assert
    expect(kind).toBe("Sprint");
  });

  it("should humanize the intensity when no name is set", () => {
    // Arrange
    const step = { intensity: "warmup" } as WorkoutStep;

    // Act
    const kind = stepKind(step);

    // Assert
    expect(kind).toBe("Warm up");
  });

  it("should fall back to Work when neither name nor intensity is set", () => {
    // Arrange
    const step = {} as WorkoutStep;

    // Act
    const kind = stepKind(step);

    // Assert
    expect(kind).toBe("Work");
  });
});

describe("stepDetail", () => {
  it("should format watts power as W", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 250 W");
  });

  it("should format percent_ftp power as % FTP", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "percent_ftp", value: 85 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 85% FTP");
  });

  it("should format a power zone as Z", () => {
    // Arrange
    const target: Target = { type: "power", value: { unit: "zone", value: 3 } };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ Z3");
  });

  it("should format a power range as min–max W", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "range", min: 200, max: 300 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 200–300 W");
  });

  it("should format bpm heart rate as bpm", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: 160 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 160 bpm");
  });

  it("should format percent_max heart rate as % max", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "percent_max", value: 90 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 90% max");
  });

  it("should format a heart-rate range as min–max bpm", () => {
    // Arrange
    const target: Target = {
      type: "heart_rate",
      value: { unit: "range", min: 140, max: 160 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 140–160 bpm");
  });

  it("should format mps pace as m/s", () => {
    // Arrange
    const target: Target = { type: "pace", value: { unit: "mps", value: 4 } };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 4 m/s");
  });

  it("should format a pace range as min–max m/s", () => {
    // Arrange
    const target: Target = {
      type: "pace",
      value: { unit: "range", min: 3, max: 5 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 3–5 m/s");
  });

  it("should format rpm cadence as rpm", () => {
    // Arrange
    const target: Target = {
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 90 rpm");
  });

  it("should format a cadence range as min–max rpm", () => {
    // Arrange
    const target: Target = {
      type: "cadence",
      value: { unit: "range", min: 80, max: 100 },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 80–100 rpm");
  });

  it("should label a stroke_type target as Stroke", () => {
    // Arrange
    const target = { type: "stroke_type" } as Target;

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("Stroke");
  });

  it("should fall back to Easy for an open target", () => {
    // Arrange
    const target: Target = { type: "open" };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("Easy");
  });
});
