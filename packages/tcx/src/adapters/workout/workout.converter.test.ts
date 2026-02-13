import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import { convertTcxWorkout } from "./workout.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxWorkout", () => {
  it("should convert a workout with Running sport", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "Morning Run",
      Step: {
        "@_xsi:type": "Step_t",
        Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
        Target: { "@_xsi:type": "None_t" },
        Intensity: "Warmup",
      },
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.sport).toBe("running");
    expect(result.name).toBe("Morning Run");
    expect(result.steps).toHaveLength(1);
  });

  it("should convert a workout with Biking sport", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Biking",
      Name: "Cycling Intervals",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.sport).toBe("cycling");
    expect(result.name).toBe("Cycling Intervals");
  });

  it("should convert a workout with Other sport to generic", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Other",
      Name: "Cross Training",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.sport).toBe("generic");
  });

  it("should default to generic for unknown sport", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Swimming",
      Name: "Swim Workout",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.sport).toBe("generic");
  });

  it("should default to generic when sport is missing", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      Name: "Unnamed Workout",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.sport).toBe("generic");
  });

  it("should handle multiple steps as array", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "Intervals",
      Step: [
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Warmup",
        },
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 60 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Active",
        },
      ],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.steps).toHaveLength(2);
  });

  it("should handle single step (not in array)", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Biking",
      Name: "Easy Ride",
      Step: {
        "@_xsi:type": "Step_t",
        Duration: { "@_xsi:type": "Time_t", Seconds: 3600 },
        Target: { "@_xsi:type": "None_t" },
        Intensity: "Active",
      },
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.steps).toHaveLength(1);
  });

  it("should handle no steps", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "Empty Workout",
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.steps).toHaveLength(0);
  });

  it("should handle workout with extensions", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Biking",
      Name: "With Extensions",
      Step: [],
      Extensions: {
        CustomField: "custom_value",
      },
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.extensions).toStrictEqual({
      tcx: { CustomField: "custom_value" },
    });
  });

  it("should not include extensions when not present", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "No Extensions",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.extensions).toBeUndefined();
  });

  it("should skip Repeat_t steps", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "With Repeats",
      Step: [
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Warmup",
        },
        {
          "@_xsi:type": "Repeat_t",
          Repetitions: 3,
        },
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Cooldown",
        },
      ],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.steps).toHaveLength(2);
  });

  it("should extract workout name", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "My Workout Name",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.name).toBe("My Workout Name");
  });

  it("should handle missing name", () => {
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Step: [],
    };

    const result = convertTcxWorkout(tcxWorkout, logger);

    expect(result.name).toBeUndefined();
  });
});
