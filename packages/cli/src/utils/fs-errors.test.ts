import { describe, expect, it } from "vitest";
import { isNodeSystemError } from "./fs-errors";

describe("isNodeSystemError", () => {
  it("should return true for Error with code property", () => {
    const error = Object.assign(new Error("test"), { code: "ENOENT" });

    const result = isNodeSystemError(error);

    expect(result).toBe(true);
  });

  it("should return false for plain Error without code", () => {
    const error = new Error("test");

    const result = isNodeSystemError(error);

    expect(result).toBe(false);
  });

  it("should return false for null", () => {
    const result = isNodeSystemError(null);

    expect(result).toBe(false);
  });

  it("should return false for undefined", () => {
    const result = isNodeSystemError(undefined);

    expect(result).toBe(false);
  });

  it("should return false for a string", () => {
    const result = isNodeSystemError("ENOENT");

    expect(result).toBe(false);
  });

  it("should return false for a plain object with code", () => {
    const result = isNodeSystemError({ code: "ENOENT", message: "test" });

    expect(result).toBe(false);
  });

  it("should allow access to code property when type guard passes", () => {
    const error = Object.assign(new Error("test"), { code: "EACCES" });

    expect(isNodeSystemError(error)).toBe(true);
    if (isNodeSystemError(error)) {
      expect(error.code).toBe("EACCES");
    }
  });
});
