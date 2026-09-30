import { APICallError, NoOutputGeneratedError, RetryError } from "ai";
import { describe, expect, it } from "vitest";

import { categorizeChatError } from "./chat-error";

describe("categorizeChatError", () => {
  it("should map auth failures to a fixed category", () => {
    // Arrange
    const error = new Error("401 Unauthorized: invalid api_key sk-secret");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("auth");
  });

  it("should map a retired-model 404 to the model category", () => {
    // Arrange
    const error = Object.assign(new Error("Not Found"), {
      statusCode: 404,
      responseBody:
        '{"type":"error","error":{"type":"not_found_error","message":"model: claude-3-haiku-20240307"}}',
    });

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("model");
  });

  it("should map rate/quota failures to a fixed category", () => {
    // Arrange
    const error = new Error("429 rate limit exceeded");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("rate");
  });

  it("should map network failures to a fixed category", () => {
    // Arrange
    const error = new Error("fetch failed: network timeout");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("network");
  });

  it("should fall back to a generic category for unknown errors", () => {
    // Arrange
    const error = "some opaque failure";

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("generic");
  });

  it("should never leak the original message into the category", () => {
    // Arrange
    const error = new Error("boom: user said I slept 7 hours and weigh 80kg");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).not.toContain("slept");
    expect(category).not.toContain("80kg");
  });

  describe("structured provider errors", () => {
    const HTTP_BAD_REQUEST = 400;
    const HTTP_UNAUTHORIZED = 401;
    const HTTP_TOO_MANY_REQUESTS = 429;
    const HTTP_OVERLOADED = 529;
    const INVALID_TOOL_SCHEMA =
      "tools.11.custom.input_schema.type: Field required";
    const apiError = (statusCode: number, type: string, message: string) =>
      new APICallError({
        message,
        url: "https://api.anthropic.com/v1/messages",
        requestBodyValues: {},
        statusCode,
        responseBody: JSON.stringify({
          type: "error",
          error: { type, message },
        }),
      });

    it("should not classify the production 400 invalid_request_error as rate", () => {
      // Arrange
      const error = apiError(
        HTTP_BAD_REQUEST,
        "invalid_request_error",
        INVALID_TOOL_SCHEMA
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should classify by status code even when the message mentions a rate", () => {
      // Arrange
      const error = apiError(
        HTTP_BAD_REQUEST,
        "invalid_request_error",
        "max_tokens rate field invalid; quota of tools exceeded 429 chars"
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should map a 429 rate_limit_error to rate", () => {
      // Arrange
      const error = apiError(
        HTTP_TOO_MANY_REQUESTS,
        "rate_limit_error",
        "Number of requests"
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });

    it("should map an overloaded_error to rate", () => {
      // Arrange
      const error = apiError(HTTP_OVERLOADED, "overloaded_error", "Overloaded");

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });

    it("should map a 401 authentication_error to auth", () => {
      // Arrange
      const error = apiError(
        HTTP_UNAUTHORIZED,
        "authentication_error",
        "invalid x-api-key"
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("auth");
    });

    it("should classify by error type even when the message echoes a missing model", () => {
      // Arrange
      const error = apiError(
        HTTP_BAD_REQUEST,
        "invalid_request_error",
        "tool_result not_found_error: model lookup failed"
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should map a Google NOT_FOUND model body behind a RetryError to model", () => {
      // Arrange
      const HTTP_NOT_FOUND = 404;
      const last = new APICallError({
        message: "models/gemini-legacy is not found for API version v1beta",
        url: "https://generativelanguage.googleapis.com/v1beta",
        requestBodyValues: {},
        statusCode: HTTP_NOT_FOUND,
        responseBody: JSON.stringify({
          error: {
            code: HTTP_NOT_FOUND,
            message: "models/gemini-legacy is not found for API version v1beta",
            status: "NOT_FOUND",
          },
        }),
      });
      const error = new RetryError({
        message: "Failed after 3 attempts",
        reason: "maxRetriesExceeded",
        errors: [last],
      });

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("model");
    });

    it("should not read a bare 404 as a missing model", () => {
      // Arrange
      const HTTP_NOT_FOUND = 404;
      const error = Object.assign(new Error("Not Found"), {
        statusCode: HTTP_NOT_FOUND,
      });

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should map a body-less error whose message names a missing model to model", () => {
      // Arrange
      const error = new Error(
        "The model `gpt-legacy` does not exist or you do not have access to it."
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("model");
    });

    it("should read the status through a RetryError's lastError", () => {
      // Arrange
      const last = apiError(
        HTTP_TOO_MANY_REQUESTS,
        "rate_limit_error",
        "slow down"
      );
      const error = new RetryError({
        message: "Failed after 3 attempts",
        reason: "maxRetriesExceeded",
        errors: [last],
      });

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });
  });

  describe("message fallback uses word boundaries", () => {
    it("should not read 'generated' in NoOutputGeneratedError as rate", () => {
      // Arrange
      const error = new NoOutputGeneratedError({
        message: "No output generated. Check the stream for errors.",
      });

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should not read 'separate' or 'invalid_request_error' as rate", () => {
      // Arrange
      const error = new Error(
        "invalid_request_error: separate the generate step"
      );

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should still map a textual rate_limit_error to rate", () => {
      // Arrange
      const error = new Error("rate_limit_error: too many requests");

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });
  });

  describe("provider codes, stream chunks and plain objects", () => {
    it.each([
      ["insufficient_quota: billing"],
      ["quota_exceeded for this key"],
      ["model overload, retry later"],
    ])("should map the provider code in %s to rate", (text) => {
      // Arrange
      const error = new Error(text);

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });

    it("should not read 'quotation' as a quota", () => {
      // Arrange
      const error = new Error("unterminated quotation in tool input");

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("generic");
    });

    it("should map a 503 service-unavailable to rate", () => {
      // Arrange
      const HTTP_SERVICE_UNAVAILABLE = 503;
      const error = Object.assign(new Error("Service Unavailable"), {
        statusCode: HTTP_SERVICE_UNAVAILABLE,
      });

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });

    it("should map an Anthropic mid-stream overloaded_error chunk to rate", () => {
      // Arrange
      const error = { type: "overloaded_error", message: "Server busy" };

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("rate");
    });

    it("should read the message of a plain error object", () => {
      // Arrange
      const error = { message: "401 Unauthorized" };

      // Act
      const category = categorizeChatError(error);

      // Assert
      expect(category).toBe("auth");
    });
  });
});
