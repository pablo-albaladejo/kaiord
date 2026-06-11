import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Workout } from "@kaiord/core";

import { executeWithRetry } from "./execute-with-retry";
import { AiParsingError } from "../errors";
import {
  ATTEMPTS_THREE,
  HTTP_STATUS_SERVICE_OVERLOADED,
  HTTP_STATUS_UNAUTHORIZED,
  MAX_OUTPUT_TOKENS_DEFAULT,
} from "../test-utils/constants";

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return {
    ...actual,
    generateText: vi.fn(),
    Output: {
      object: vi.fn(({ schema }: { schema: unknown }) => ({ schema })),
    },
  };
});

const { generateText, APICallError } = await import("ai");
const mockGenerateText = vi.mocked(generateText);

const VALID_WORKOUT: Workout = {
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "open",
      target: { type: "open" },
    },
  ],
};

const mockModel = { modelId: "test" } as Parameters<typeof executeWithRetry>[0];

const buildApiCallError = (isRetryable: boolean) =>
  new APICallError({
    message: isRetryable ? "Overloaded" : "Unauthorized",
    url: "https://api.example.com/v1/messages",
    requestBodyValues: {},
    statusCode: isRetryable
      ? HTTP_STATUS_SERVICE_OVERLOADED
      : HTTP_STATUS_UNAUTHORIZED,
    isRetryable,
  });

describe("executeWithRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should rethrow non-retryable APICallError on first attempt without prompt correction", async () => {
    // Arrange
    const authError = buildApiCallError(false);
    mockGenerateText.mockRejectedValueOnce(authError);

    // Act
    const run = executeWithRetry(
      mockModel,
      "sys",
      "txt",
      2,
      MAX_OUTPUT_TOKENS_DEFAULT,
      0,
      undefined
    );

    // Assert
    await expect(run).rejects.toBe(authError);
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("should retry retryable APICallError up to maxRetries + 1 attempts", async () => {
    // Arrange
    const overload = buildApiCallError(true);
    mockGenerateText
      .mockRejectedValueOnce(overload)
      .mockRejectedValueOnce(overload)
      .mockResolvedValueOnce({ output: VALID_WORKOUT } as never);

    // Act
    const result = await executeWithRetry(
      mockModel,
      "sys",
      "txt",
      2,
      MAX_OUTPUT_TOKENS_DEFAULT,
      0,
      undefined
    );

    // Assert
    expect(result.sport).toBe("running");
    expect(mockGenerateText).toHaveBeenCalledTimes(ATTEMPTS_THREE);
  });

  it("should retry on schema validation failure with prompt-correction injection", async () => {
    // Arrange
    mockGenerateText
      .mockResolvedValueOnce({ output: { sport: "bogus" } } as never)
      .mockResolvedValueOnce({ output: VALID_WORKOUT } as never);

    // Act
    await executeWithRetry(
      mockModel,
      "sys",
      "first prompt",
      2,
      MAX_OUTPUT_TOKENS_DEFAULT,
      0,
      undefined
    );

    // Assert
    const retryArgs = mockGenerateText.mock.calls[1]?.[0] as {
      prompt?: string;
    };
    expect(retryArgs.prompt).toContain("[Previous attempt failed:");
  });

  it("should retry plain non-APICallError up to maxRetries then throw AiParsingError", async () => {
    // Arrange
    mockGenerateText.mockRejectedValue(new Error("transient blip"));

    // Act
    const run = executeWithRetry(
      mockModel,
      "sys",
      "txt",
      1,
      MAX_OUTPUT_TOKENS_DEFAULT,
      0,
      undefined
    );

    // Assert
    await expect(run).rejects.toThrow(AiParsingError);
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });

  it("should coerce a non-Error thrown value before retrying", async () => {
    // Arrange
    mockGenerateText
      .mockRejectedValueOnce("plain string error")
      .mockResolvedValueOnce({ output: VALID_WORKOUT } as never);

    // Act
    const result = await executeWithRetry(
      mockModel,
      "sys",
      "txt",
      1,
      MAX_OUTPUT_TOKENS_DEFAULT,
      0,
      undefined
    );

    // Assert
    expect(result.sport).toBe("running");
    expect(mockGenerateText).toHaveBeenCalledTimes(2);
  });
});
