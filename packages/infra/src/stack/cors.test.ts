import { describe, expect, it } from "vitest";
import { parseAllowedOrigins } from "./cors";

const createMockNode = (contextValue: unknown) =>
  ({ tryGetContext: () => contextValue }) as never;

describe("parseAllowedOrigins", () => {
  it("should return array when given an array", () => {
    const origins = ["https://example.com"];

    const result = parseAllowedOrigins(createMockNode(origins));

    expect(result).toEqual(["https://example.com"]);
  });

  it("should parse JSON string array", () => {
    const json = '["https://a.com","https://b.com"]';

    const result = parseAllowedOrigins(createMockNode(json));

    expect(result).toEqual(["https://a.com", "https://b.com"]);
  });

  it("should throw when context is undefined", () => {
    expect(() => parseAllowedOrigins(createMockNode(undefined))).toThrow(
      "Missing or invalid CDK context: allowedOrigins"
    );
  });

  it("should throw when JSON is invalid", () => {
    expect(() => parseAllowedOrigins(createMockNode("not-json"))).toThrow(
      "Missing or invalid CDK context: allowedOrigins"
    );
  });

  it("should throw when parsed value is not string array", () => {
    expect(() => parseAllowedOrigins(createMockNode("[1,2]"))).toThrow(
      "Missing or invalid CDK context: allowedOrigins"
    );
  });
});
