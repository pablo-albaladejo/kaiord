import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import { convertTcxStep } from "./step.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxStep", () => {
  it("should convert a basic TCX step with time duration and open target", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Name: "Warm Up",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 300,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
      Intensity: "Warmup",
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).not.toBeNull();
    expect(result?.stepIndex).toBe(0);
    expect(result?.name).toBe("Warm Up");
    expect(result?.duration).toStrictEqual({ type: "time", seconds: 300 });
    expect(result?.target).toStrictEqual({ type: "open" });
    expect(result?.intensity).toBe("warmup");
  });

  it("should convert step with distance duration", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Distance_t",
        Meters: 1000,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
      Intensity: "Active",
    };

    const result = convertTcxStep(tcxStep, 1, logger);

    expect(result).not.toBeNull();
    expect(result?.duration).toStrictEqual({ type: "distance", meters: 1000 });
  });

  it("should convert step with heart rate target", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 600,
      },
      Target: {
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 3,
        },
      },
      Intensity: "Active",
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).not.toBeNull();
    expect(result?.target).toStrictEqual({
      type: "heart_rate",
      value: { unit: "zone", value: 3 },
    });
  });

  it("should return null for Repeat_t step type", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Repeat_t",
      Repetitions: 3,
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Repetition blocks not yet supported",
      { stepIndex: 0 }
    );
  });

  it("should return null when duration is missing", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Target: { "@_xsi:type": "None_t" },
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Step has no valid duration, skipping",
      { stepIndex: 0 }
    );
  });

  it("should extract extensions from step", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 300,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
      Intensity: "Active",
      Extensions: {
        TPX: { Watts: 250 },
      },
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).not.toBeNull();
    expect(result?.extensions).toStrictEqual({
      tcx: { TPX: { Watts: 250 } },
    });
  });

  it("should convert power from extensions to power target", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 300,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
      Intensity: "Active",
      Extensions: {
        TPX: { Watts: 250 },
      },
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).not.toBeNull();
    expect(result?.target).toStrictEqual({
      type: "power",
      value: { unit: "watts", value: 250 },
    });
  });

  it("should handle step without name", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 300,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).not.toBeNull();
    expect(result?.name).toBeUndefined();
  });

  it("should handle step without extensions", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 300,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
    };

    const result = convertTcxStep(tcxStep, 0, logger);

    expect(result).not.toBeNull();
    expect(result?.extensions).toBeUndefined();
  });

  it("should log debug message with step index", () => {
    const logger = createMockLogger();
    const tcxStep = {
      "@_xsi:type": "Step_t",
      Duration: {
        "@_xsi:type": "Time_t",
        Seconds: 300,
      },
      Target: {
        "@_xsi:type": "None_t",
      },
    };

    convertTcxStep(tcxStep, 5, logger);

    expect(logger.debug).toHaveBeenCalledWith("Converting TCX step", {
      stepIndex: 5,
    });
  });
});
