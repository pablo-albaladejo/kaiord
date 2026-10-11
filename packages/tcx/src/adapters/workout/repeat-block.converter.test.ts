import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import {
  convertTcxRepeat,
  isTcxRepeat,
  MAX_UNROLLED_STEPS,
} from "./repeat-block.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const WORK_SECONDS = 240;
const REST_SECONDS = 120;
const SHORT_SECONDS = 60;
const INNER_B_SECONDS = 30;
const INNER_C_SECONDS = 15;
const INTERVALS = 5;
const OUTER_REPEATS = 3;
const INNER_REPEATS = 2;
const NESTED_START = 4;
const DROPPED_COUNT = 4;

const timeStep = (name: string, seconds = SHORT_SECONDS) => ({
  "@_xsi:type": "Step_t",
  Name: name,
  Duration: { "@_xsi:type": "Time_t", Seconds: seconds },
  Intensity: "Active",
  Target: { "@_xsi:type": "None_t" },
});

describe("isTcxRepeat", () => {
  it("should recognise only Repeat_t steps", () => {
    // Arrange
    const repeat = { "@_xsi:type": "Repeat_t" };
    const step = { "@_xsi:type": "Step_t" };

    // Act
    const results = [isTcxRepeat(repeat), isTcxRepeat(step)];

    // Assert
    expect(results).toStrictEqual([true, false]);
  });
});

describe("convertTcxRepeat", () => {
  it("should map Repetitions and every Child to a repetition block", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Repetitions: INTERVALS,
      Child: [timeStep("Work", WORK_SECONDS), timeStep("Rest", REST_SECONDS)],
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, 1, "cycling", logger);

    // Assert
    expect(block?.repeatCount).toBe(INTERVALS);
    expect(block?.steps).toMatchObject([
      { stepIndex: 1, name: "Work", duration: { seconds: WORK_SECONDS } },
      { stepIndex: 2, name: "Rest", duration: { seconds: REST_SECONDS } },
    ]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should accept a single Child parsed as an object", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Repetitions: OUTER_REPEATS,
      Child: timeStep("Only"),
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, 0, "running", logger);

    // Assert
    expect(block?.repeatCount).toBe(OUTER_REPEATS);
    expect(block?.steps).toHaveLength(1);
    expect(block?.steps[0].name).toBe("Only");
  });

  it("should unroll a nested repeat into its parent and warn", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Repetitions: OUTER_REPEATS,
      Child: [
        timeStep("A"),
        {
          "@_xsi:type": "Repeat_t",
          Repetitions: INNER_REPEATS,
          Child: [
            timeStep("B", INNER_B_SECONDS),
            timeStep("C", INNER_C_SECONDS),
          ],
        },
      ],
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, NESTED_START, "running", logger);

    // Assert
    expect(block?.repeatCount).toBe(OUTER_REPEATS);
    expect(block?.steps.map((s) => s.name)).toStrictEqual([
      "A",
      "B",
      "C",
      "B",
      "C",
    ]);
    expect(block?.steps.map((s) => s.stepIndex)).toStrictEqual(
      block?.steps.map((_, offset) => NESTED_START + offset)
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: nested TCX repeat unrolled into its parent block",
      { stepIndex: NESTED_START + 1, repetitions: INNER_REPEATS }
    );
  });

  it("should import a nested repeat once when unrolling it exceeds the step budget", () => {
    // Arrange
    const logger = createMockLogger();
    const hugeRepetitions = MAX_UNROLLED_STEPS * MAX_UNROLLED_STEPS;
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Repetitions: OUTER_REPEATS,
      Child: [
        timeStep("A"),
        {
          "@_xsi:type": "Repeat_t",
          Repetitions: hugeRepetitions,
          Child: [
            timeStep("B", INNER_B_SECONDS),
            timeStep("C", INNER_C_SECONDS),
          ],
        },
      ],
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, 0, "running", logger);

    // Assert
    expect(block?.repeatCount).toBe(OUTER_REPEATS);
    expect(block?.steps.map((s) => s.name)).toStrictEqual(["A", "B", "C"]);
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: nested TCX repeat too large to unroll, importing its steps once",
      { stepIndex: 1, repetitions: hugeRepetitions }
    );
  });

  it("should drop a nested repeat with no importable child without iterating its count", () => {
    // Arrange
    const logger = createMockLogger();
    const hugeRepetitions = MAX_UNROLLED_STEPS ** OUTER_REPEATS;
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Repetitions: OUTER_REPEATS,
      Child: [
        timeStep("A"),
        {
          "@_xsi:type": "Repeat_t",
          Repetitions: hugeRepetitions,
          Child: { "@_xsi:type": "Step_t", Target: { "@_xsi:type": "None_t" } },
        },
      ],
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, 0, "running", logger);

    // Assert
    expect(block?.steps.map((s) => s.name)).toStrictEqual(["A"]);
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: nested TCX repeat has no importable steps, dropping it",
      { stepIndex: 1, repetitions: hugeRepetitions }
    );
  });

  it("should import the children once when Repetitions is invalid", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Child: [timeStep("Work")],
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, 0, "running", logger);

    // Assert
    expect(block?.repeatCount).toBe(1);
    expect(block?.steps).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: TCX repeat has no valid Repetitions, importing its steps once",
      { repetitions: undefined, fallback: 1 }
    );
  });

  it("should drop a repeat with no importable child and warn", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxRepeat = {
      "@_xsi:type": "Repeat_t",
      Repetitions: DROPPED_COUNT,
      Child: { "@_xsi:type": "Step_t", Target: { "@_xsi:type": "None_t" } },
    };

    // Act
    const block = convertTcxRepeat(tcxRepeat, 2, "running", logger);

    // Assert
    expect(block).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Lossy conversion: TCX repeat has no importable steps, dropping it",
      { startIndex: 2, repeatCount: DROPPED_COUNT }
    );
  });
});
