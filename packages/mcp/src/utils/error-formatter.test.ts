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

const namedError = (name: string, message: string): Error => {
  const error = new Error(message);
  error.name = name;
  return error;
};

describe("formatError", () => {
  it("should extract message from Error objects", () => {
    // Arrange

    // Act
    const result = formatError(new Error("Something failed"));

    // Assert
    expect(result).toEqual({
      content: [{ type: "text", text: "Error: Something failed" }],
      isError: true,
      structuredContent: { error: { type: "unknown" } },
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
      structuredContent: { error: { type: "unknown" } },
    });
  });

  it("should classify an unsupported-format failure for agent branching", () => {
    // Arrange
    const error = namedError("UnsupportedFormatError", "bad format");

    // Act
    const result = formatError(error);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.structuredContent?.error.type).toBe("unsupported-format");
  });

  it("should classify an authentication failure for agent branching", () => {
    // Arrange
    const error = namedError("ServiceAuthError", "not authenticated");

    // Act
    const result = formatError(error);

    // Assert
    expect(result.structuredContent?.error.type).toBe("auth");
    expect(result.structuredContent?.error.suggestion).toBeDefined();
  });

  it("should classify a missing input file for agent branching", () => {
    // Arrange
    const error = Object.assign(new Error("no such file"), { code: "ENOENT" });

    // Act
    const result = formatError(error);

    // Assert
    expect(result.structuredContent?.error.type).toBe("file-not-found");
  });
});
