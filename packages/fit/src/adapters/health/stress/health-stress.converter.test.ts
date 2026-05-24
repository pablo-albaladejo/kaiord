import { describe, expect, it } from "vitest";

import type { FitStressLevel } from "./fit-stress.schema";
import {
  mapFitStressToKrd,
  mapKrdStressToFit,
} from "./health-stress.converter";

const START = "2026-05-23T08:00:00.000Z";
const MID = "2026-05-23T09:00:00.000Z";
const END = "2026-05-23T10:00:00.000Z";
const SECOND_SAMPLE_VALUE = 40;

describe("mapFitStressToKrd", () => {
  it("should aggregate valid samples into a single episode", () => {
    // Arrange
    const samples: FitStressLevel[] = [
      { stressLevelTime: new Date(START), stressLevelValue: 30 },
      { stressLevelTime: new Date(MID), stressLevelValue: 50 },
      { stressLevelTime: new Date(END), stressLevelValue: 70 },
    ];

    // Act
    const result = mapFitStressToKrd(samples);

    // Assert
    expect(result).toEqual({
      kind: "stress",
      version: "2.0",
      startTime: START,
      endTime: END,
      averageLevel: 50,
      peakLevel: 70,
    });
  });

  it("should drop negative sentinel samples before aggregation", () => {
    // Arrange
    const samples: FitStressLevel[] = [
      { stressLevelTime: new Date(START), stressLevelValue: -1 },
      { stressLevelTime: new Date(END), stressLevelValue: SECOND_SAMPLE_VALUE },
    ];

    // Act
    const result = mapFitStressToKrd(samples);

    // Assert
    expect(result?.startTime).toBe(END);
    expect(result?.peakLevel).toBe(SECOND_SAMPLE_VALUE);
  });

  it("should return undefined when no sample is valid", () => {
    // Arrange
    const samples: FitStressLevel[] = [
      { stressLevelTime: new Date(START), stressLevelValue: -2 },
    ];

    // Act
    const result = mapFitStressToKrd(samples);

    // Assert
    expect(result).toBeUndefined();
  });
});

describe("mapKrdStressToFit", () => {
  it("should emit one sample at startTime with averageLevel and one at endTime with peakLevel", () => {
    // Arrange
    const episode = {
      kind: "stress" as const,
      version: "2.0",
      startTime: START,
      endTime: END,
      averageLevel: 40,
      peakLevel: 80,
    };

    // Act
    const samples = mapKrdStressToFit(episode);

    // Assert
    expect(samples).toHaveLength(2);
    expect(samples[0]).toEqual({
      stressLevelTime: new Date(START),
      stressLevelValue: 40,
    });
    expect(samples[1]).toEqual({
      stressLevelTime: new Date(END),
      stressLevelValue: 80,
    });
  });
});
