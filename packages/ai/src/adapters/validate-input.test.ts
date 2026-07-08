import { describe, it, expect } from "vitest";
import { validateInput } from "./validate-input";
import { AiParsingError } from "../errors";
import {
  INPUT_LEN_AT_LIMIT,
  INPUT_LEN_OVER_LIMIT,
  INPUT_TEXT_TRUNCATED_MAX_LEN,
} from "../test-utils/constants";

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
    const longInput = "a".repeat(INPUT_LEN_OVER_LIMIT);

    // Assert
    expect(() => validateInput(longInput)).toThrow(AiParsingError);
    expect(() => validateInput(longInput)).toThrow("exceeds");
  });

  it.each([
    [
      "control characters stripped, newlines kept",
      "step 1\nstep 2\x00\x01\x02",
      "step 1\nstep 2",
    ],
    ["tabs preserved", "step\t1", "step\t1"],
  ])("should sanitize input (%s)", (_case, input, expected) => {
    // Arrange

    // Act
    const result = validateInput(input);

    // Assert
    expect(result).toBe(expected);
  });

  it("should accept exactly 2000 characters", () => {
    // Arrange

    // Act
    const input = "a".repeat(INPUT_LEN_AT_LIMIT);

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
    expect.assertions(1);
    const longInput = "a".repeat(INPUT_LEN_OVER_LIMIT);

    // Act

    // Assert
    try {
      validateInput(longInput);
    } catch (error) {
      expect((error as AiParsingError).inputText.length).toBeLessThanOrEqual(
        INPUT_TEXT_TRUNCATED_MAX_LEN
      );
    }
  });

  it("should tag an empty-input error with the input_empty reason", () => {
    // Arrange
    expect.assertions(1);

    // Act

    // Assert
    try {
      validateInput("   ");
    } catch (error) {
      expect((error as AiParsingError).reason).toBe("input_empty");
    }
  });

  it("should tag a too-long-input error with reason and length details", () => {
    // Arrange
    expect.assertions(2);
    const longInput = "a".repeat(INPUT_LEN_OVER_LIMIT);

    // Act

    // Assert
    try {
      validateInput(longInput);
    } catch (error) {
      const parsed = error as AiParsingError;
      expect(parsed.reason).toBe("input_too_long");
      expect(parsed.details).toEqual({
        maxLength: INPUT_LEN_AT_LIMIT,
        actualLength: INPUT_LEN_OVER_LIMIT,
      });
    }
  });
});
