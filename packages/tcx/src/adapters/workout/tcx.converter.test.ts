import type { KRD, Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { convertKRDToTcx } from "./tcx.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createMinimalKrd = (overrides: Partial<KRD> = {}): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2024-01-15T10:00:00Z",
    sport: "cycling",
  },
  extensions: {
    structured_workout: {
      sport: "cycling",
      name: "Test Workout",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
          intensity: "active",
        },
      ],
    },
  },
  ...overrides,
});

describe("convertKRDToTcx", () => {
  it("should convert minimal KRD to TCX structure", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd();

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;

    // Assert
    expect(result.TrainingCenterDatabase).toBeDefined();
    expect(tcd["@_xmlns"]).toBe(
      "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
    );
    expect(tcd["@_xmlns:xsi"]).toBe(
      "http://www.w3.org/2001/XMLSchema-instance"
    );
    expect(tcd["@_xmlns:kaiord"]).toBe("http://kaiord.dev/tcx-extensions/1.0");
  });

  it.each([
    ["cycling", "Biking"],
    ["training", "Other"],
    ["running", "Running"],
  ] as const)("should map %s sport to TCX %s", (krdSport, expectedTcxSport) => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd({
      metadata: { created: "2024-01-15T10:00:00Z", sport: krdSport },
      extensions: {
        structured_workout: {
          sport: krdSport,
          name: "Test Workout",
          steps: [],
        },
      },
    });

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;
    const workouts = tcd.Workouts as Record<string, unknown>;
    const workout = workouts.Workout as Record<string, unknown>;

    // Assert
    expect(workout["@_Sport"]).toBe(expectedTcxSport);
  });

  it("should throw when KRD has no structured_workout", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2024-01-15T10:00:00Z", sport: "cycling" },
      extensions: {},
    };

    // Assert
    expect(() => convertKRDToTcx(krd, logger)).toThrow(
      "KRD does not contain workout data in extensions"
    );
  });

  it("should add kaiord metadata to TrainingCenterDatabase", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd({
      metadata: {
        created: "2024-01-15T10:00:00Z",
        sport: "cycling",
        manufacturer: "Garmin",
        product: "Edge 1040",
        serialNumber: "ABC123",
      },
    });

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;

    // Assert
    expect(tcd["@_kaiord:timeCreated"]).toBe("2024-01-15T10:00:00Z");
    expect(tcd["@_kaiord:manufacturer"]).toBe("Garmin");
    expect(tcd["@_kaiord:product"]).toBe("Edge 1040");
    expect(tcd["@_kaiord:serialNumber"]).toBe("ABC123");
  });

  it("should restore TCX extensions from KRD", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd({
      extensions: {
        structured_workout: {
          sport: "cycling",
          name: "Test",
          steps: [],
        },
        tcx: { CustomField: "custom_value" },
      },
    });

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;

    // Assert
    expect(tcd.Extensions).toStrictEqual({ CustomField: "custom_value" });
  });

  it("should restore workout-level TCX extensions", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd({
      extensions: {
        structured_workout: {
          sport: "cycling",
          name: "Test",
          steps: [],
          extensions: {
            tcx: { WorkoutCustom: "value" },
          },
        },
      },
    });

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;
    const workouts = tcd.Workouts as Record<string, unknown>;
    const workout = workouts.Workout as Record<string, unknown>;

    // Assert
    expect(workout.Extensions).toStrictEqual({ WorkoutCustom: "value" });
  });

  it("should not include Extensions when not present", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd();

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;

    // Assert
    expect(tcd.Extensions).toBeUndefined();
  });

  it("should convert steps with correct StepId", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd({
      extensions: {
        structured_workout: {
          sport: "cycling",
          name: "Multi Step",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
              intensity: "warmup",
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "open",
              target: { type: "open" },
              intensity: "active",
            },
          ],
        },
      },
    });

    // Act
    const result = convertKRDToTcx(krd, logger) as Record<string, unknown>;
    const tcd = result.TrainingCenterDatabase as Record<string, unknown>;
    const workouts = tcd.Workouts as Record<string, unknown>;
    const workout = workouts.Workout as Record<string, unknown>;
    const steps = workout.Step as Array<Record<string, unknown>>;

    // Assert
    expect(steps).toHaveLength(2);
    expect(steps[0].StepId).toBe(1);
    expect(steps[1].StepId).toBe(2);
  });

  it("should log debug messages during conversion", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = createMinimalKrd();

    // Act
    convertKRDToTcx(krd, logger);

    // Assert
    expect(logger.debug).toHaveBeenCalledWith(
      "Converting KRD to TCX structure"
    );
  });
});
