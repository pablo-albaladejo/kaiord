import { describe, expect, it } from "vitest";

import { HTTP_STATUS_TOO_MANY_REQUESTS } from "../test-utils/constants";
import { readProviderError } from "./read-provider-error";

const withBody = (statusCode: number, responseBody: string) =>
  Object.assign(new Error("call failed"), { statusCode, responseBody });

describe("readProviderError", () => {
  it.each([
    {
      provider: "anthropic",
      body: '{"type":"error","error":{"type":"not_found_error","message":"model: x"}}',
      expected: { errorType: "not_found_error", errorMessage: "model: x" },
    },
    {
      provider: "openai",
      body: '{"error":{"message":"m","type":"invalid_request_error","code":"model_not_found"}}',
      expected: {
        errorType: "invalid_request_error",
        errorCode: "model_not_found",
        errorMessage: "m",
      },
    },
    {
      provider: "google",
      body: '{"error":{"code":404,"message":"models/x is not found","status":"NOT_FOUND"}}',
      expected: {
        errorStatus: "NOT_FOUND",
        errorMessage: "models/x is not found",
      },
    },
  ])("should read the $provider error body fields", ({ body, expected }) => {
    // Arrange
    const error = withBody(404, body);

    // Act
    const info = readProviderError(error);

    // Assert
    expect(info).toMatchObject({ statusCode: 404, ...expected });
  });

  it("should read the first level that carries structure through lastError then cause", () => {
    // Arrange
    const inner = withBody(
      HTTP_STATUS_TOO_MANY_REQUESTS,
      '{"type":"error","error":{"type":"rate_limit_error","message":"slow"}}'
    );
    const error = new Error("wrapped", {
      cause: Object.assign(new Error("retry"), { lastError: inner }),
    });

    // Act
    const info = readProviderError(error);

    // Assert
    expect(info.statusCode).toBe(HTTP_STATUS_TOO_MANY_REQUESTS);
    expect(info.errorType).toBe("rate_limit_error");
  });

  it("should take a stream chunk's own error type", () => {
    // Arrange
    const chunk = { type: "overloaded_error", message: "busy" };

    // Act
    const info = readProviderError(chunk);

    // Assert
    expect(info.errorType).toBe("overloaded_error");
  });

  it.each([
    { name: "unparseable body", error: withBody(404, "<html>") },
    { name: "non-object", error: "boom" },
  ])("should tolerate a $name", ({ error }) => {
    // Arrange

    // Act
    const info = readProviderError(error);

    // Assert
    expect(info.errorType).toBeUndefined();
  });
});
