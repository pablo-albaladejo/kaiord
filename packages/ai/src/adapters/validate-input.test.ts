import { describe, it, expect } from "vitest";
import { validateInput } from "./validate-input";
import { AiParsingError } from "../errors";

describe("validateInput", () => {
  it("should return trimmed text for valid input", () => {
    // Arrange

    // Act

    // Assert
    expect(validateInput("  4x(8' a 5'15\")  ")).toBe("4x(8' a 5'15\")");
  });

  it("should throw on empty string", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validateInput("")).toThrow(AiParsingError);
    expect(() => validateInput("   ")).toThrow(AiParsingError);
  });

  it("should throw on input exceeding 2000 characters", () => {
    // Arrange

    // Act
    const longInput = "a".repeat(2001);

    // Assert
    expect(() => validateInput(longInput)).toThrow(AiParsingError);
    expect(() => validateInput(longInput)).toThrow("exceeds");
  });

  it("should strip control characters but keep newlines", () => {
    // Arrange

    // Act
    const input = "step 1\nstep 2\x00\x01\x02";

    // Assert
    expect(validateInput(input)).toBe("step 1\nstep 2");
  });

  it("should preserve tabs", () => {
    // Arrange

    // Act

    // Assert
    expect(validateInput("step\t1")).toBe("step\t1");
  });

  it("should accept exactly 2000 characters", () => {
    // Arrange

    // Act
    const input = "a".repeat(2000);

    // Assert
    expect(validateInput(input)).toBe(input);
  });

  it("should throw when input is only control characters", () => {
    // Arrange

    // Act
    const input = "\x00\x01\x02";

    // Assert
    expect(() => validateInput(input)).toThrow(AiParsingError);
  });

  it("should truncate inputText in error for long inputs", () => {
    // Arrange

    // Act
    const longInput = "a".repeat(2001);

    // Assert
    try {
      validateInput(longInput);
    } catch (error) {
      expect((error as AiParsingError).inputText.length).toBeLessThanOrEqual(
        203
      );
    }
  });
});
