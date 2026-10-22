import type { Target, WorkoutStep } from "@kaiord/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../i18n/i18n";
import { type ReviewCopy, reviewCopyFor } from "./review-copy";
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

  it("should format a percent_ftp power range as % FTP", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
    };

    // Act
    const detail = stepDetail(target);

    // Assert
    expect(detail).toBe("@ 50–75% FTP");
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

describe("step wording in Spanish", () => {
  let es: ReviewCopy;
  beforeAll(async () => {
    await setActiveLocale("es");
    es = reviewCopyFor("es");
  });
  afterAll(async () => {
    await appI18n.changeLanguage("en");
  });
  const ENGLISH =
    /\b(warm up|cool down|recovery|rest|interval|active|work|stroke|easy|max|bpm)\b/i;

  it("should name every intensity without English words", () => {
    // Arrange
    const intensities = [
      "warmup",
      "cooldown",
      "recovery",
      "rest",
      "interval",
      "active",
      "other",
    ] as const;

    // Act
    const kinds = intensities.map((intensity) =>
      stepKind({ intensity } as WorkoutStep, es)
    );
    const unnamed = stepKind({} as WorkoutStep, es);

    // Assert
    for (const kind of [...kinds, unnamed]) expect(kind).not.toMatch(ENGLISH);
    expect(kinds[0]).toBe("Calentamiento");
  });

  it("should word every target without English words", () => {
    // Arrange
    const targets = [
      { type: "heart_rate", value: { unit: "bpm", value: 160 } },
      { type: "heart_rate", value: { unit: "percent_max", value: 90 } },
      { type: "heart_rate", value: { unit: "range", min: 140, max: 160 } },
      { type: "stroke_type" },
      { type: "open" },
    ] as Target[];

    // Act
    const details = targets.map((target) => stepDetail(target, es));

    // Assert
    for (const detail of details) expect(detail).not.toMatch(ENGLISH);
    expect(details[0]).toBe("@ 160 ppm");
    expect(details[1]).toBe("@ 90% máx");
  });
});
