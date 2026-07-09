/**
 * Unit tests for the pure parsing/filtering helpers behind the SDK-sourced
 * model catalog generator. The IO path (reading installed `@ai-sdk/*` type
 * defs) is exercised by the freshness guard.
 */
import { describe, expect, it } from "vitest";

import {
  chatModelIds,
  parseModelIds,
} from "../../scripts/model-catalog-extract.mjs";

const OPENAI_DTS =
  "type OpenAIChatModelId = 'gpt-4o' | 'gpt-4o-audio-preview' | 'gpt-5' | (string & {});";
const GOOGLE_DTS =
  "type GoogleGenerativeAIModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash-image' | 'gemini-embedding-001' | (string & {});";

describe("parseModelIds", () => {
  it("should extract union literals and drop the open string fallback", () => {
    // Arrange
    const dts = "type X = 'a' | 'b' | (string & {});";

    // Act
    const ids = parseModelIds(dts, "X");

    // Assert
    expect(ids).toEqual(["a", "b"]);
  });

  it("should throw when the named union is absent", () => {
    // Arrange
    const dts = "type Other = 'a';";

    // Act
    const act = () => parseModelIds(dts, "Missing");

    // Assert
    expect(act).toThrow();
  });
});

describe("chatModelIds", () => {
  it.each([
    { type: "openai", dts: OPENAI_DTS, expected: ["gpt-4o", "gpt-5"] },
    { type: "google", dts: GOOGLE_DTS, expected: ["gemini-2.5-pro"] },
  ])("should drop non-text $type variants", ({ type, dts, expected }) => {
    // Arrange

    // Act
    const ids = chatModelIds(type, dts);

    // Assert
    expect(ids).toEqual(expected);
  });
});
