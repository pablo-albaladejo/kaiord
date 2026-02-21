import { describe, it, expect } from "vitest";
import { AiParsingError, createAiParsingError } from "./errors";

describe("AiParsingError", () => {
  it("sets all fields correctly", () => {
    const error = new AiParsingError("msg", "input text", 3, "last err");

    expect(error.message).toBe("msg");
    expect(error.name).toBe("AiParsingError");
    expect(error.code).toBe("AI_PARSING_ERROR");
    expect(error.inputText).toBe("input text");
    expect(error.attempts).toBe(3);
    expect(error.lastError).toBe("last err");
    expect(error).toBeInstanceOf(Error);
  });

  it("sets lastError to undefined when not provided", () => {
    const error = new AiParsingError("msg", "input", 0);

    expect(error.lastError).toBeUndefined();
  });

  it("createAiParsingError produces an AiParsingError instance", () => {
    const error = createAiParsingError("fail", "raw", 2, "root cause");

    expect(error).toBeInstanceOf(AiParsingError);
    expect(error.code).toBe("AI_PARSING_ERROR");
    expect(error.lastError).toBe("root cause");
  });
});
