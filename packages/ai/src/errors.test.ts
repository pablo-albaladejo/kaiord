import { describe, it, expect } from "vitest";
import { AiParsingError, createAiParsingError } from "./errors";
import { ATTEMPTS_THREE } from "./test-utils/constants";

describe("AiParsingError", () => {
  it("should set all fields correctly", () => {
    // Arrange

    // Act
    const error = new AiParsingError(
      "msg",
      "input text",
      ATTEMPTS_THREE,
      "last err"
    );

    // Assert
    expect(error.message).toBe("msg");
    expect(error.name).toBe("AiParsingError");
    expect(error.code).toBe("AI_PARSING_ERROR");
    expect(error.inputText).toBe("input text");
    expect(error.attempts).toBe(ATTEMPTS_THREE);
    expect(error.lastError).toBe("last err");
    expect(error).toBeInstanceOf(Error);
  });

  it("should set lastError to undefined when not provided", () => {
    // Arrange

    // Act
    const error = new AiParsingError("msg", "input", 0);

    // Assert
    expect(error.lastError).toBeUndefined();
  });

  it("should produce an AiParsingError instance via createAiParsingError", () => {
    // Arrange

    // Act
    const error = createAiParsingError("fail", "raw", 2, "root cause");

    // Assert
    expect(error).toBeInstanceOf(AiParsingError);
    expect(error.code).toBe("AI_PARSING_ERROR");
    expect(error.lastError).toBe("root cause");
  });
});
