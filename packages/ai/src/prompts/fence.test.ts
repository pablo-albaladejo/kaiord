import { describe, expect, it } from "vitest";

import { fenceUntrusted, UNTRUSTED_CLOSE, UNTRUSTED_OPEN } from "./fence";

const OVER_CAP_LENGTH = 600;
const CAP = 500;

describe("fenceUntrusted", () => {
  it("should wrap text in the untrusted-data delimiters", () => {
    // Arrange
    const text = "coach note";

    // Act
    const result = fenceUntrusted(text);

    // Assert
    expect(result).toBe(`${UNTRUSTED_OPEN}coach note${UNTRUSTED_CLOSE}`);
  });

  it("should return an empty string for null or undefined", () => {
    // Arrange

    // Act
    const result = fenceUntrusted(null);

    // Assert
    expect(result).toBe("");
  });

  it("should cap the fenced content at 500 characters", () => {
    // Arrange
    const long = "a".repeat(OVER_CAP_LENGTH);

    // Act
    const result = fenceUntrusted(long);

    // Assert
    const inner = result.slice(UNTRUSTED_OPEN.length, -UNTRUSTED_CLOSE.length);
    expect(inner).toHaveLength(CAP);
  });
});
