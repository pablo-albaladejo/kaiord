import { describe, expect, it } from "vitest";

import { formatError, formatSuccess } from "./error-formatter";

describe("formatSuccess", () => {
  it("should return a success result with text content", () => {
    // Arrange

    // Act
    const result = formatSuccess("Operation completed");

    // Assert
    expect(result).toEqual({
      content: [{ type: "text", text: "Operation completed" }],
    });
  });

  it("should not include isError property", () => {
    // Arrange

    // Act
    const result = formatSuccess("OK");

    // Assert
    expect(result.isError).toBeUndefined();
  });
});

describe("formatError", () => {
  it("should extract message from Error objects", () => {
    // Arrange

    // Act
    const result = formatError(new Error("Something failed"));

    // Assert
    expect(result).toEqual({
      content: [{ type: "text", text: "Error: Something failed" }],
      isError: true,
    });
  });

  it("should convert non-Error values to string", () => {
    // Arrange

    // Act
    const result = formatError("string error");

    // Assert
    expect(result).toEqual({
      content: [{ type: "text", text: "Error: string error" }],
      isError: true,
    });
  });

  it("should handle numeric errors", () => {
    // Arrange

    // Act
    const result = formatError(404);

    // Assert
    expect(result).toEqual({
      content: [{ type: "text", text: "Error: 404" }],
      isError: true,
    });
  });
});
