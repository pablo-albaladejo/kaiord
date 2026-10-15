import { describe, expect, it } from "vitest";

import { listedModels, modelDisplayName } from "./model-names";
import { MODEL_CATALOG } from "./provider-models";
import type { LlmProviderType } from "./types";

const TYPES: LlmProviderType[] = ["anthropic", "openai", "google"];

describe("modelDisplayName", () => {
  it.each([
    ["claude-sonnet-5", "Claude Sonnet 5"],
    ["claude-sonnet-5-5", "Claude Sonnet 5.5"],
    ["claude-haiku-4-5", "Claude Haiku 4.5"],
    ["claude-fable-5-1", "Claude Fable 5.1"],
    ["claude-haiku-4-5-20251001", "Claude Haiku 4.5 (2025-10-01)"],
    ["gpt-5-mini", "GPT-5 mini"],
    ["gpt-4.1-nano", "GPT-4.1 nano"],
    ["gpt-4o", "GPT-4o"],
    ["gpt-5-mini-2025-08-07", "GPT-5 mini (2025-08-07)"],
    ["gpt-3.5-turbo-0125", "GPT-3.5 turbo (0125)"],
    ["gpt-4-0613", "GPT-4 (0613)"],
    ["o4-mini", "o4-mini"],
    ["gemini-2.5-flash", "Gemini 2.5 Flash"],
    ["gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite"],
    ["gemini-2.0-flash-001", "Gemini 2.0 Flash (001)"],
    ["my-fine-tune", "my-fine-tune"],
  ])("should name %s as %s", (id, name) => {
    // Arrange
    const modelId = id;

    // Act
    const shown = modelDisplayName(modelId);

    // Assert
    expect(shown).toBe(name);
  });
});

describe("listedModels", () => {
  it("should drop a dated pin whose alias is also in the catalog", () => {
    // Arrange
    const catalog = MODEL_CATALOG.anthropic.map((m) => m.id);

    // Act
    const ids = listedModels("anthropic");

    // Assert
    expect(catalog).toContain("claude-haiku-4-5-20251001");
    expect(ids).toContain("claude-haiku-4-5");
    expect(ids).not.toContain("claude-haiku-4-5-20251001");
    expect(listedModels("openai")).not.toContain("gpt-5-mini-2025-08-07");
    expect(listedModels("google")).not.toContain("gemini-2.0-flash-001");
  });

  it.each(TYPES)("should give every listed %s model a unique name", (type) => {
    // Arrange
    const ids = listedModels(type);

    // Act
    const names = ids.map(modelDisplayName);

    // Assert
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(TYPES)("should only list %s catalog models", (type) => {
    // Arrange
    const catalog = MODEL_CATALOG[type].map((m) => m.id);

    // Act
    const ids = listedModels(type);

    // Assert
    expect(ids.every((id) => catalog.includes(id))).toBe(true);
  });
});
