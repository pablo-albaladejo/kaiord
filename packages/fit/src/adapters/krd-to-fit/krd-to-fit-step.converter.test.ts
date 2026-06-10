import type { Logger, WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { convertWorkoutStep } from "./krd-to-fit-step.converter";

const MESSAGE_INDEX = 4;
const DURATION_SECONDS = 300;
const FIT_NOTES_LIMIT = 256;
const OVERSIZED_NOTES_LENGTH = 300;

const createSpyLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const baseStep = (overrides: Partial<WorkoutStep>): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: DURATION_SECONDS },
  targetType: "open",
  target: { type: "open" },
  ...overrides,
});

describe("convertWorkoutStep", () => {
  it("should produce a message with the given message index", () => {
    // Arrange
    const logger = createMockLogger();
    const step = baseStep({});

    // Act
    const message = convertWorkoutStep(step, MESSAGE_INDEX, logger);

    // Assert
    expect(message.messageIndex).toBe(MESSAGE_INDEX);
    expect(message.durationType).toBe("time");
    expect(message.durationTime).toBe(DURATION_SECONDS);
  });

  it("should include the step name and intensity when present", () => {
    // Arrange
    const logger = createMockLogger();
    const step = baseStep({ name: "Tempo", intensity: "active" });

    // Act
    const message = convertWorkoutStep(step, 0, logger);

    // Assert
    expect(message.wktStepName).toBe("Tempo");
    expect(message.intensity).toBe("active");
  });

  it("should omit name and intensity when absent", () => {
    // Arrange
    const logger = createMockLogger();
    const step = baseStep({});

    // Act
    const message = convertWorkoutStep(step, 0, logger);

    // Assert
    expect(message).not.toHaveProperty("wktStepName");
    expect(message).not.toHaveProperty("intensity");
  });

  it("should pass through notes shorter than the FIT limit", () => {
    // Arrange
    const logger = createMockLogger();
    const step = baseStep({ notes: "easy spin" });

    // Act
    const message = convertWorkoutStep(step, 0, logger);

    // Assert
    expect(message.notes).toBe("easy spin");
  });

  it("should truncate oversized notes to 256 characters by default", () => {
    // Arrange
    const logger = createSpyLogger();
    const longNotes = "x".repeat(OVERSIZED_NOTES_LENGTH);
    const step = baseStep({ notes: longNotes });

    // Act
    const message = convertWorkoutStep(step, 0, logger);

    // Assert
    expect(message.notes).toBe("x".repeat(FIT_NOTES_LIMIT));
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Notes truncated"),
      { stepIndex: 0, originalLength: OVERSIZED_NOTES_LENGTH }
    );
  });

  it("should throw a FIT parsing error for oversized notes when truncation is disabled", () => {
    // Arrange
    const logger = createMockLogger();
    const step = baseStep({ notes: "x".repeat(OVERSIZED_NOTES_LENGTH) });

    // Act
    const act = (): unknown =>
      convertWorkoutStep(step, 0, logger, { notesTruncation: "error" });

    // Assert
    expect(act).toThrowError(/Notes exceed 256 characters at step 0/);
  });
});
