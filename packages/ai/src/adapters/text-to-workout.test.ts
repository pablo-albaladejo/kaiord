import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Workout } from "@kaiord/core";
import { createTextToWorkout } from "./text-to-workout";
import { AiParsingError } from "../errors";

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
    mockGenerateText.mockResolvedValueOnce({
      output: RUNNING_WORKOUT,
    } as never);

    const parse = createTextToWorkout({ model: mockModel });
    const result = await parse("Rodaje 15' Z1 + 4x(8' a 5'15\" + 4' R)");

    expect(result.sport).toBe("running");
    expect(result.steps).toHaveLength(3);
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("should pass sport hint to system prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({
      output: RUNNING_WORKOUT,
    } as never);

    const parse = createTextToWorkout({ model: mockModel });
    await parse("4x(8' a 5'15\")", { sport: "running" });

    const callArgs = mockGenerateText.mock.calls[0]?.[0] as {
      system?: string;
    };

    expect(callArgs.system).toContain("running");
  });

  it("should apply name override as post-processing", async () => {
    mockGenerateText.mockResolvedValueOnce({
      output: { ...RUNNING_WORKOUT, name: "LLM Name" },
    } as never);

    const parse = createTextToWorkout({ model: mockModel });
    const result = await parse("test", { name: "My Workout" });

    expect(result.name).toBe("My Workout");
  });

  it("should retry on first failure and succeeds on second attempt", async () => {
    mockGenerateText
      .mockRejectedValueOnce(new Error("Schema validation failed"))
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);

    const parse = createTextToWorkout({ model: mockModel });
    const result = await parse("4x(8' a 5'15\")");

    expect(result.sport).toBe("running");
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it("should include error feedback in retry prompt", async () => {
    mockGenerateText
      .mockRejectedValueOnce(new Error("Invalid duration"))
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);

    const parse = createTextToWorkout({ model: mockModel });
    await parse("test workout");

    const retryArgs = mockGenerateText.mock.calls[1]?.[0] as {
      prompt?: string;
    };
    expect(retryArgs.prompt).toContain("Invalid duration");
  });

  it("should throw AiParsingError after max retries exhausted", async () => {
    mockGenerateText.mockRejectedValue(new Error("Always fails"));
    const parse = createTextToWorkout({ model: mockModel, maxRetries: 1 });

    await expect(parse("bad input")).rejects.toThrow(AiParsingError);
    await expect(parse("bad input")).rejects.toMatchObject({
      code: "AI_PARSING_ERROR",
    });
  });

  it("should throw AiParsingError when output is null", async () => {
    mockGenerateText.mockResolvedValue({ output: null } as never);
    const parse = createTextToWorkout({ model: mockModel, maxRetries: 0 });

    await expect(parse("test")).rejects.toThrow(AiParsingError);
  });

  it("should reindex non-sequential stepIndex values", async () => {
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
    const result = await parse("warmup + cooldown");

    expect(result.steps[0]).toMatchObject({ stepIndex: 0 });
    expect(result.steps[1]).toMatchObject({ stepIndex: 1 });
  });

  it("should log at debug, info, and warn levels", async () => {
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
    await parse("test");

    expect(logger.debug).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should throw on invalid sport option before calling LLM", async () => {
    const parse = createTextToWorkout({ model: mockModel });

    await expect(
      parse("test", { sport: "triathlon" as never })
    ).rejects.toThrow();

    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("should preserve LLM name when options has no name override", async () => {
    mockGenerateText.mockResolvedValueOnce({
      output: { ...RUNNING_WORKOUT, name: "LLM Name" },
    } as never);

    const parse = createTextToWorkout({ model: mockModel });
    const result = await parse("test", { sport: "running" });

    expect(result.name).toBe("LLM Name");
  });

  it("should throw AiParsingError on empty input without calling LLM", async () => {
    const parse = createTextToWorkout({ model: mockModel });

    await expect(parse("")).rejects.toThrow(AiParsingError);

    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("should throw AiParsingError on input exceeding max length", async () => {
    const parse = createTextToWorkout({ model: mockModel });
    const longInput = "a".repeat(2001);

    await expect(parse(longInput)).rejects.toThrow(AiParsingError);

    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("should pass default config values to generateText", async () => {
    mockGenerateText.mockResolvedValueOnce({
      output: RUNNING_WORKOUT,
    } as never);

    const parse = createTextToWorkout({ model: mockModel });
    await parse("test");

    const callArgs = mockGenerateText.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    expect(callArgs.maxOutputTokens).toBe(4096);
    expect(callArgs.temperature).toBe(0);
  });

  it("should handle non-Error thrown values in catch", async () => {
    mockGenerateText
      .mockRejectedValueOnce("plain string error")
      .mockResolvedValueOnce({
        output: RUNNING_WORKOUT,
      } as never);

    const parse = createTextToWorkout({ model: mockModel });
    const result = await parse("test");

    expect(result.sport).toBe("running");
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });
});
