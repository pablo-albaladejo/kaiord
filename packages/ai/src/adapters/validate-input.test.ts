import { describe, it, expect } from "vitest";
import { validateInput } from "./validate-input";
import { AiParsingError } from "../errors";

describe("validateInput", () => {
  it("returns trimmed text for valid input", () => {
    expect(validateInput("  4x(8' a 5'15\")  ")).toBe("4x(8' a 5'15\")");
  });

  it("throws on empty string", () => {
    expect(() => validateInput("")).toThrow(AiParsingError);
    expect(() => validateInput("   ")).toThrow(AiParsingError);
  });

  it("throws on input exceeding 2000 characters", () => {
    const longInput = "a".repeat(2001);

    expect(() => validateInput(longInput)).toThrow(AiParsingError);
    expect(() => validateInput(longInput)).toThrow("exceeds");
  });

  it("strips control characters but keeps newlines", () => {
    const input = "step 1\nstep 2\x00\x01\x02";

    expect(validateInput(input)).toBe("step 1\nstep 2");
  });

  it("preserves tabs", () => {
    expect(validateInput("step\t1")).toBe("step\t1");
  });

  it("accepts exactly 2000 characters", () => {
    const input = "a".repeat(2000);

    expect(validateInput(input)).toBe(input);
  });
});
