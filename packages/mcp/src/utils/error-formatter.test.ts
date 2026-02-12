import { describe, expect, it } from "vitest";
import { formatError, formatSuccess } from "./error-formatter";

describe("formatSuccess", () => {
  it("should return a success result with text content", () => {
    const result = formatSuccess("Operation completed");

    expect(result).toEqual({
      content: [{ type: "text", text: "Operation completed" }],
    });
  });

  it("should not include isError property", () => {
    const result = formatSuccess("OK");

    expect(result.isError).toBeUndefined();
  });
});

describe("formatError", () => {
  it("should extract message from Error objects", () => {
    const result = formatError(new Error("Something failed"));

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: Something failed" }],
      isError: true,
    });
  });

  it("should convert non-Error values to string", () => {
    const result = formatError("string error");

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: string error" }],
      isError: true,
    });
  });

  it("should handle numeric errors", () => {
    const result = formatError(404);

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: 404" }],
      isError: true,
    });
  });
});
