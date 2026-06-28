import { describe, expect, it } from "vitest";

import { decodeBase64 } from "./base64";

describe("decodeBase64", () => {
  it.each([
    [Buffer.from("hello world").toString("base64"), "hello world"],
    [Buffer.from("ab").toString("base64"), "ab"],
  ])("should decode base64 %s to %s", (encoded, decoded) => {
    // Arrange

    // Act
    const result = decodeBase64(encoded);

    // Assert
    expect(Buffer.from(result).toString()).toBe(decoded);
  });

  it("should handle whitespace in base64", () => {
    // Arrange
    const encoded = Buffer.from("hello").toString("base64");
    const withWhitespace = `  ${encoded}  \n`;

    // Act
    const result = decodeBase64(withWhitespace);

    // Assert
    expect(Buffer.from(result).toString()).toBe("hello");
  });

  it("should throw for invalid base64 characters", () => {
    // Arrange

    // Act

    // Assert
    expect(() => decodeBase64("not!valid@base64")).toThrow("Invalid base64");
  });

  it("should throw for empty decode result from non-empty input", () => {
    // Arrange

    // Act

    // Assert
    expect(() => decodeBase64("=")).toThrow(
      "Base64 decoding produced empty buffer."
    );
  });
});
