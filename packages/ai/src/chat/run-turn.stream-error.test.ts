/**
 * Real-SDK test (no `ai` mock): a provider failure surfaces from `runTurn`
 * as the provider's own `APICallError` — with its `statusCode` — instead of
 * the SDK's generic `NoOutputGeneratedError`, whose message ("No output
 * generated…") hides the status and misled message-based classification.
 */
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";

import { runTurn } from "./run-turn";

const invalidRequest = () =>
  new APICallError({
    message: "tools.11.custom.input_schema.type: Field required",
    url: "https://api.anthropic.com/v1/messages",
    requestBodyValues: {},
    statusCode: 400,
    responseBody:
      '{"type":"error","error":{"type":"invalid_request_error","message":"tools.11.custom.input_schema.type: Field required"}}',
    isRetryable: false,
  });

describe("runTurn stream errors", () => {
  it("should rethrow the provider APICallError instead of NoOutputGeneratedError", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw invalidRequest();
      },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act
    const run = runTurn({
      model,
      messages: [{ role: "user", content: "hola" }],
      tools: {},
      maxSteps: 8,
    });

    // Assert
    await expect(run).rejects.toSatisfy(
      (e: unknown) => APICallError.isInstance(e) && e.statusCode === 400
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
