import { describe, expect, it } from "vitest";

import {
  HTTP_STATUS_SERVICE_OVERLOADED,
  HTTP_STATUS_UNAUTHORIZED,
} from "../test-utils/constants";
import { isModelNotFoundError } from "./model-not-found";

const apiCallError = (statusCode: number, responseBody: string) =>
  Object.assign(new Error("Not Found"), { statusCode, responseBody });

describe("isModelNotFoundError", () => {
  it.each([
    {
      provider: "anthropic",
      error: apiCallError(
        404,
        '{"type":"error","error":{"type":"not_found_error","message":"model: claude-3-haiku-20240307"}}'
      ),
    },
    {
      provider: "openai",
      error: new Error(
        "The model `gpt-legacy` does not exist or you do not have access to it."
      ),
    },
    {
      provider: "google",
      error: new Error(
        "models/gemini-legacy is not found for API version v1beta"
      ),
    },
    {
      provider: "google NOT_FOUND body",
      error: apiCallError(
        404,
        '{"error":{"code":404,"message":"models/gemini-legacy is not found for API version v1beta, or is not supported for generateContent.","status":"NOT_FOUND"}}'
      ),
    },
    {
      provider: "openai model_not_found body",
      error: apiCallError(
        404,
        '{"error":{"message":"no such model","type":"invalid_request_error","code":"model_not_found"}}'
      ),
    },
  ])("should detect a $provider unknown-model rejection", ({ error }) => {
    // Arrange

    // Act
    const result = isModelNotFoundError(error);

    // Assert
    expect(result).toBe(true);
  });

  it("should detect a model rejection nested in the error cause chain", () => {
    // Arrange
    const error = new Error("Generation failed", {
      cause: apiCallError(
        404,
        '{"type":"error","error":{"type":"not_found_error","message":"model: claude-3-haiku-20240307"}}'
      ),
    });

    // Act
    const result = isModelNotFoundError(error);

    // Assert
    expect(result).toBe(true);
  });

  it.each([
    {
      name: "auth",
      error: apiCallError(
        HTTP_STATUS_UNAUTHORIZED,
        '{"type":"authentication_error"}'
      ),
    },
    {
      name: "overload",
      error: apiCallError(
        HTTP_STATUS_SERVICE_OVERLOADED,
        '{"type":"overloaded_error"}'
      ),
    },
    {
      name: "404 with a body that names no model",
      error: apiCallError(
        404,
        '{"type":"error","error":{"type":"not_found_error","message":"file: f_123"}}'
      ),
    },
    { name: "bare 404", error: apiCallError(404, "") },
    {
      name: "wrapped bare 404",
      error: new Error("Generation failed", { cause: apiCallError(404, "") }),
    },
    { name: "plain", error: new Error("Failed to fetch") },
    { name: "non-error", error: "boom" },
  ])("should not flag an unrelated $name failure", ({ error }) => {
    // Arrange

    // Act
    const result = isModelNotFoundError(error);

    // Assert
    expect(result).toBe(false);
  });
});
