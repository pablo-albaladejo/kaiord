/**
 * Unit tests for the pure parsing/filtering helpers behind the SDK-sourced
 * model catalog generator. The IO path (reading installed `@ai-sdk/*` type
 * defs) is exercised by the freshness guard.
 */
import { describe, expect, it } from "vitest";

import {
  assertSuccessorsInCatalog,
  chatModelIds,
  matchDefinitionKeys,
  parseModelIds,
  renderCatalogModule,
} from "../../scripts/model-catalog-extract.mjs";

const OPENAI_DTS =
  "type OpenAIChatModelId = 'gpt-4o' | 'gpt-4o-audio-preview' | 'gpt-5' | (string & {});";
const ANTHROPIC_DTS =
  "type AnthropicModelId = 'claude-3-haiku-20240307' | 'claude-opus-4-0' | 'claude-haiku-4-5' | (string & {});";
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

describe("matchDefinitionKeys", () => {
  const DEFINITIONS_DTS = [
    "declare const languageModelDefinitions: {",
    "  'claude-opus-5': {",
    "    effort: true;",
    "  };",
    "  'claude-haiku-4-5': {",
    "    effort: false;",
    "  };",
    "};",
    "type AnthropicModelId = AnthropicModelIds['language'] | (string & {});",
  ].join("\n");

  it("should return the top-level keys of the definitions object", () => {
    // Arrange
    const dts = DEFINITIONS_DTS;

    // Act
    const ids = matchDefinitionKeys(dts, "languageModelDefinitions");

    // Assert
    expect(ids).toEqual(["claude-opus-5", "claude-haiku-4-5"]);
  });

  it("should return null when the definitions object is absent", () => {
    // Arrange
    const dts = "type X = 'a';";

    // Act
    const ids = matchDefinitionKeys(dts, "languageModelDefinitions");

    // Assert
    expect(ids).toBeNull();
  });

  it("should keep only readonly entries that serve the requested endpoint", () => {
    // Arrange
    const dts = [
      "declare const openaiLanguageModelDefinitions: {",
      "  readonly 'gpt-5': {",
      '    readonly endpoints: readonly ["chat", "responses"];',
      "    readonly definition: {};",
      "  };",
      "  readonly 'gpt-5-codex': {",
      '    readonly endpoints: readonly ["responses"];',
      "    readonly definition: {};",
      "  };",
      "};",
    ].join("\n");

    // Act
    const ids = matchDefinitionKeys(
      dts,
      "openaiLanguageModelDefinitions",
      "chat"
    );

    // Assert
    expect(ids).toEqual(["gpt-5"]);
  });

  it("should prefer the definitions keys over the indexed-access union", () => {
    // Arrange
    const dts = DEFINITIONS_DTS;

    // Act
    const ids = chatModelIds("anthropic", dts);

    // Assert
    expect(ids).toEqual(["claude-opus-5", "claude-haiku-4-5"]);
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

describe("retired and deprecated models", () => {
  it("should drop retired and deprecated anthropic ids from the catalog", () => {
    // Arrange
    const dts = ANTHROPIC_DTS;

    // Act
    const ids = chatModelIds("anthropic", dts);

    // Assert
    expect(ids).toEqual(["claude-haiku-4-5"]);
  });

  it("should emit retired successors and deprecations so the UI can heal and warn", () => {
    // Arrange
    const catalog = { anthropic: [], openai: [], google: [] };
    const none = { anthropic: {}, openai: {}, google: {} };

    // Act
    const text = renderCatalogModule(
      catalog,
      { ...none, anthropic: { "claude-3-haiku-20240307": "claude-haiku-4-5" } },
      {
        ...none,
        anthropic: {
          "claude-sonnet-4-0": {
            successor: "claude-sonnet-5",
            retiresOn: null,
          },
        },
      }
    );

    // Assert
    expect(text).toContain(
      'anthropic: {\n    "claude-3-haiku-20240307": "claude-haiku-4-5",\n  },'
    );
    expect(text).toContain(
      '"claude-sonnet-4-0": { successor: "claude-sonnet-5", retiresOn: null },'
    );
    expect(text).toContain("openai: {},");
  });

  it("should throw when a successor is not in the catalog", () => {
    // Arrange
    const catalog = {
      anthropic: [{ id: "claude-haiku-4-5", label: "claude-haiku-4-5" }],
      openai: [],
      google: [],
    };
    const retired = { anthropic: { "claude-old": "claude-gone" } };

    // Act
    const act = () => assertSuccessorsInCatalog(catalog, retired, {});

    // Assert
    expect(act).toThrow(/claude-gone/);
  });
});
