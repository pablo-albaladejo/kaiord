import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import { convertTcxToKRD } from "./krd.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxToKRD", () => {
  it("should convert a minimal TCX workout to KRD", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {
        Workouts: {
          Workout: {
            "@_Sport": "Running",
            Name: "Morning Run",
            Step: {
              "@_xsi:type": "Step_t",
              Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
              Target: { "@_xsi:type": "None_t" },
              Intensity: "Warmup",
            },
          },
        },
      },
    };

    const result = convertTcxToKRD(tcxData, logger);

    expect(result.version).toBe("1.0");
    expect(result.type).toBe("structured_workout");
    expect(result.metadata.sport).toBe("running");
    expect(result.extensions?.structured_workout).toBeDefined();
  });

  it("should extract kaiord metadata from TrainingCenterDatabase", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {
        "@_kaiord:timeCreated": "2024-01-15T10:00:00Z",
        "@_kaiord:manufacturer": "Garmin",
        "@_kaiord:product": "Edge 1040",
        "@_kaiord:serialNumber": "ABC123",
        Workouts: {
          Workout: {
            "@_Sport": "Biking",
            Name: "Ride",
            Step: [],
          },
        },
      },
    };

    const result = convertTcxToKRD(tcxData, logger);

    expect(result.metadata.created).toBe("2024-01-15T10:00:00Z");
    expect(result.metadata.manufacturer).toBe("Garmin");
    expect(result.metadata.product).toBe("Edge 1040");
    expect(result.metadata.serialNumber).toBe("ABC123");
  });

  it("should throw when no workouts found", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {},
    };

    expect(() => convertTcxToKRD(tcxData, logger)).toThrow(
      "No workouts found in TCX file"
    );
  });

  it("should handle workout array and use first workout", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {
        Workouts: {
          Workout: [
            {
              "@_Sport": "Running",
              Name: "First Workout",
              Step: [],
            },
            {
              "@_Sport": "Biking",
              Name: "Second Workout",
              Step: [],
            },
          ],
        },
      },
    };

    const result = convertTcxToKRD(tcxData, logger);

    expect(result.metadata.sport).toBe("running");
    const workout = result.extensions?.structured_workout as { name: string };
    expect(workout.name).toBe("First Workout");
  });

  it("should preserve TCX extensions from TrainingCenterDatabase", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {
        Workouts: {
          Workout: {
            "@_Sport": "Running",
            Name: "With Extensions",
            Step: [],
          },
        },
        Extensions: {
          CustomData: "test_value",
        },
      },
    };

    const result = convertTcxToKRD(tcxData, logger);

    expect(result.extensions?.tcx).toStrictEqual({
      CustomData: "test_value",
    });
  });

  it("should not include tcx extensions when not present", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {
        Workouts: {
          Workout: {
            "@_Sport": "Running",
            Name: "No Extensions",
            Step: [],
          },
        },
      },
    };

    const result = convertTcxToKRD(tcxData, logger);

    expect(result.extensions?.tcx).toBeUndefined();
  });

  it("should log debug messages during conversion", () => {
    const logger = createMockLogger();
    const tcxData = {
      TrainingCenterDatabase: {
        Workouts: {
          Workout: {
            "@_Sport": "Running",
            Name: "Test",
            Step: [],
          },
        },
      },
    };

    convertTcxToKRD(tcxData, logger);

    expect(logger.debug).toHaveBeenCalledWith("Converting TCX to KRD");
    expect(logger.debug).toHaveBeenCalledWith("TCX to KRD conversion complete");
  });
});
