import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Workout } from "@kaiord/core";
import { createTextToWorkout } from "./text-to-workout";
import { AiParsingError } from "../errors";
import {
  EXPECTED_STEP_COUNT_THREE,
  INPUT_LEN_OVER_LIMIT,
  MAX_OUTPUT_TOKENS_DEFAULT,
} from "../test-utils/constants";

const RUNNING_WORKOUT: Workout = {
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 900 },
      targetType: "pace",
      target: { type: "pace", value: { unit: "zone", value: 1 } },
      intensity: "warmup",
    },
    {
      repeatCount: 4,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 480 },
          targetType: "pace",
          target: { type: "pace", value: { unit: "mps", value: 3.175 } },
          intensity: "interval",
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 240 },
          targetType: "open",
          target: { type: "open" },
          intensity: "recovery",
        },
      ],
    },
    {
      stepIndex: 2,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "open",
      target: { type: "open" },
      intensity: "cooldown",
    },
  ],
};

vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: { object: vi.fn(({ schema }: { schema: unknown }) => ({ schema })) },
}));

const mockGenerateText = vi.mocked((await import("ai")).generateText);

const mockModel = { modelId: "test-model" } as Parameters<
  typeof createTextToWorkout
>[0]["model"];

describe("createTextToWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse running workout from natural language", async () => {
    // Arrange
    mockGenerateText.mockResolvedValueOnce({
      output: RUNNING_WORKOUT,
    } as never);
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const result = await parse("Rodaje 15' Z1 + 4x(8' a 5'15\" + 4' R)");

    // Assert
    expect(result.sport).toBe("running");
    expect(result.steps).toHaveLength(EXPECTED_STEP_COUNT_THREE);
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("should pass sport hint to system prompt", async () => {
    // Arrange
    mockGenerateText.mockResolvedValueOnce({
      output: RUNNING_WORKOUT,
    } as never);
    const parse = createTextToWorkout({ model: mockModel });
    await parse("4x(8' a 5'15\")", { sport: "running" });

    // Act
    const callArgs = mockGenerateText.mock.calls[0]?.[0] as {
      system?: string;
    };

    // Assert
    expect(callArgs.system).toContain("running");
  });

  it("should apply name override as post-processing", async () => {
    // Arrange
    mockGenerateText.mockResolvedValueOnce({
      output: { ...RUNNING_WORKOUT, name: "LLM Name" },
    } as never);
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const result = await parse("test", { name: "My Workout" });

    // Assert
    expect(result.name).toBe("My Workout");
  });

  it("should retry on first failure and succeeds on second attempt", async () => {
    // Arrange
    mockGenerateText
      .mockRejectedValueOnce(new Error("Schema validation failed"))
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const result = await parse("4x(8' a 5'15\")");

    // Assert
    expect(result.sport).toBe("running");
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it("should include error feedback in retry prompt", async () => {
    // Arrange
    mockGenerateText
      .mockRejectedValueOnce(new Error("Invalid duration"))
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);
    const parse = createTextToWorkout({ model: mockModel });
    await parse("test workout");

    // Act
    const retryArgs = mockGenerateText.mock.calls[1]?.[0] as {
      prompt?: string;
    };

    // Assert
    expect(retryArgs.prompt).toContain("Invalid duration");
  });

  it("should throw AiParsingError after max retries exhausted", async () => {
    // Arrange
    mockGenerateText.mockRejectedValue(new Error("Always fails"));

    // Act
    const parse = createTextToWorkout({ model: mockModel, maxRetries: 1 });

    // Assert
    await expect(parse("bad input")).rejects.toThrow(AiParsingError);
    await expect(parse("bad input")).rejects.toMatchObject({
      code: "AI_PARSING_ERROR",
    });
  });

  it("should throw AiParsingError when output is null", async () => {
    // Arrange
    mockGenerateText.mockResolvedValue({ output: null } as never);

    // Act
    const parse = createTextToWorkout({ model: mockModel, maxRetries: 0 });

    // Assert
    await expect(parse("test")).rejects.toThrow(AiParsingError);
  });

  it("should reindex non-sequential stepIndex values", async () => {
    // Arrange
    const badIndices: Workout = {
      sport: "running",
      steps: [
        {
          stepIndex: 99,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 42,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
      ],
    };
    mockGenerateText.mockResolvedValueOnce({
      output: badIndices,
    } as never);
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const result = await parse("warmup + cooldown");

    // Assert
    expect(result.steps[0]).toMatchObject({ stepIndex: 0 });
    expect(result.steps[1]).toMatchObject({ stepIndex: 1 });
  });

  it("should log at debug, info, and warn levels", async () => {
    // Arrange
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    mockGenerateText
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);
    const parse = createTextToWorkout({ model: mockModel, logger });

    // Act
    await parse("test");

    // Assert
    expect(logger.debug).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should throw on invalid sport option before calling LLM", async () => {
    // Arrange

    // Act
    const parse = createTextToWorkout({ model: mockModel });

    // Assert
    await expect(
      parse("test", { sport: "triathlon" as never })
    ).rejects.toThrow();
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("should preserve LLM name when options has no name override", async () => {
    // Arrange
    mockGenerateText.mockResolvedValueOnce({
      output: { ...RUNNING_WORKOUT, name: "LLM Name" },
    } as never);
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const result = await parse("test", { sport: "running" });

    // Assert
    expect(result.name).toBe("LLM Name");
  });

  it("should throw AiParsingError on empty input without calling LLM", async () => {
    // Arrange

    // Act
    const parse = createTextToWorkout({ model: mockModel });

    // Assert
    await expect(parse("")).rejects.toThrow(AiParsingError);
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("should throw AiParsingError on input exceeding max length", async () => {
    // Arrange
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const longInput = "a".repeat(INPUT_LEN_OVER_LIMIT);

    // Assert
    await expect(parse(longInput)).rejects.toThrow(AiParsingError);
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("should pass default config values to generateText", async () => {
    // Arrange
    mockGenerateText.mockResolvedValueOnce({
      output: RUNNING_WORKOUT,
    } as never);
    const parse = createTextToWorkout({ model: mockModel });
    await parse("test");

    // Act
    const callArgs = mockGenerateText.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    // Assert
    expect(callArgs.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS_DEFAULT);
    expect(callArgs.temperature).toBe(0);
  });

  it("should handle non-Error thrown values in catch", async () => {
    // Arrange
    mockGenerateText
      .mockRejectedValueOnce("plain string error")
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);
    const parse = createTextToWorkout({ model: mockModel });

    // Act
    const result = await parse("test");

    // Assert
    expect(result.sport).toBe("running");
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });
});
