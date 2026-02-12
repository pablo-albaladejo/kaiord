import { describe, expect, it } from "vitest";

import { decodeBase64 } from "./base64";

describe("decodeBase64", () => {
  it("should decode valid base64 string", () => {
    const encoded = Buffer.from("hello world").toString("base64");

    const result = decodeBase64(encoded);

    expect(Buffer.from(result).toString()).toBe("hello world");
  });

  it("should handle base64 with padding", () => {
    const encoded = Buffer.from("ab").toString("base64");

    const result = decodeBase64(encoded);

    expect(Buffer.from(result).toString()).toBe("ab");
  });

  it("should handle whitespace in base64", () => {
    const encoded = Buffer.from("hello").toString("base64");
    const withWhitespace = `  ${encoded}  \n`;

    const result = decodeBase64(withWhitespace);

    expect(Buffer.from(result).toString()).toBe("hello");
  });

  it("should throw for invalid base64 characters", () => {
    expect(() => decodeBase64("not!valid@base64")).toThrow("Invalid base64");
  });

  it("should throw for empty decode result from non-empty input", () => {
    expect(() => decodeBase64("====")).toThrow("Invalid base64");
  });
});
