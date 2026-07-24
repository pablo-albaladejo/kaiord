import { describe, it, expect } from "vitest";
import { validateInput } from "./validate-input";
import { AiParsingError } from "../errors";
import {
  INPUT_LEN_AT_LIMIT,
  INPUT_LEN_OVER_LIMIT,
  INPUT_TEXT_TRUNCATED_MAX_LEN,
} from "../test-utils/constants";

/** Runs validateInput expecting rejection, returning the thrown error. */
const rejectionOf = (input: string): AiParsingError => {
  try {
    validateInput(input);
  } catch (error) {
    return error as AiParsingError;
  }
  throw new Error("expected validateInput to reject");
};

describe("validateInput", () => {
  it("should return trimmed text for valid input", () => {
    // Arrange
    const input = "  4x(8' a 5'15\")  ";

    // Act
    const result = validateInput(input);

    // Assert
    expect(result).toBe("4x(8' a 5'15\")");
  });

  it.each([
    { scenario: "an empty string", input: "" },
    { scenario: "whitespace only", input: "   " },
    { scenario: "control characters only", input: "\x00\x01\x02" },
  ])(
    "should reject $scenario with an input_empty AiParsingError",
    ({ input }) => {
      // Arrange

      // Act
      const error = rejectionOf(input);

      // Assert
      expect(error).toBeInstanceOf(AiParsingError);
      expect(error.reason).toBe("input_empty");
    }
  );

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

  it("should accept input of exactly the maximum length", () => {
    // Arrange
    const input = "a".repeat(INPUT_LEN_AT_LIMIT);

    // Act
    const result = validateInput(input);

    // Assert
    expect(result).toBe(input);
  });

  it("should reject over-limit input with an input_too_long AiParsingError carrying both lengths", () => {
    // Arrange
    const longInput = "a".repeat(INPUT_LEN_OVER_LIMIT);

    // Act
    const error = rejectionOf(longInput);

    // Assert
    expect(error).toBeInstanceOf(AiParsingError);
    expect(error.reason).toBe("input_too_long");
    expect(error.details).toEqual({
      maxLength: INPUT_LEN_AT_LIMIT,
      actualLength: INPUT_LEN_OVER_LIMIT,
    });
  });

  it("should truncate inputText in the error for long inputs", () => {
    // Arrange
    const longInput = "a".repeat(INPUT_LEN_OVER_LIMIT);

    // Act
    const error = rejectionOf(longInput);

    // Assert
    expect(error.inputText.length).toBeLessThanOrEqual(
      INPUT_TEXT_TRUNCATED_MAX_LEN
    );
  });
});
