import { describe, expect, it } from "vitest";

import { decodeBase64 } from "./base64";

describe("decodeBase64", () => {
  it("should decode valid base64 string", () => {
    // Arrange
    const encoded = Buffer.from("hello world").toString("base64");

    // Act
    const result = decodeBase64(encoded);

    // Assert
    expect(Buffer.from(result).toString()).toBe("hello world");
  });

  it("should handle base64 with padding", () => {
    // Arrange
    const encoded = Buffer.from("ab").toString("base64");

    // Act
    const result = decodeBase64(encoded);

    // Assert
    expect(Buffer.from(result).toString()).toBe("ab");
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
    expect(() => decodeBase64("====")).toThrow("Invalid base64");
  });
});
