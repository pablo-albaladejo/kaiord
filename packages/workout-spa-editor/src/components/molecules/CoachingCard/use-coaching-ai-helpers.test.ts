/**
 * Tests for the pure helpers backing `useCoachingAi`. Exercises
 * provider selection (selected → fallback to first → null) and the
 * generated `aiMeta` shape returned by the `GenerateKrdPort` adapter.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateWorkoutKrd } from "../../../lib/generate-workout";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { buildGenerateKrdPort, pickProvider } from "./use-coaching-ai-helpers";

vi.mock("../../../lib/generate-workout", () => ({
  generateWorkoutKrd: vi.fn(async () => ({ kind: "krd-stub" })),
}));

const provider: LlmProviderConfig = {
  id: "p-1",
  type: "openai",
  model: "gpt-4o-mini",
  apiKey: "secret",
  customName: null,
} as unknown as LlmProviderConfig;

const provider2: LlmProviderConfig = {
  ...provider,
  id: "p-2",
  model: "claude",
};

describe("pickProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prefer the selected provider when present", () => {
    // Arrange
    const providers = [provider, provider2];

    // Act
    const result = pickProvider(providers, "p-2");

    // Assert
    expect(result?.id).toBe("p-2");
  });

  it("should fall back to the first provider when selection is null", () => {
    // Arrange
    const providers = [provider, provider2];

    // Act
    const result = pickProvider(providers, null);

    // Assert
    expect(result?.id).toBe("p-1");
  });

  it("should return null when no providers exist", () => {
    // Arrange

    // Act
    const result = pickProvider([], null);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null when providers list is undefined", () => {
    // Arrange

    // Act
    const result = pickProvider(undefined, "p-1");

    // Assert
    expect(result).toBeNull();
  });
});

describe("buildGenerateKrdPort", () => {
  it("should populate aiMeta with provider type, model, prompt version and timestamp", async () => {
    // Arrange
    const port = buildGenerateKrdPort(provider, () => "2026-05-07T12:00:00Z");

    // Act
    const result = await port({ text: "warmup", sport: "cycling" });

    // Assert
    expect(result.aiMeta).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: expect.any(String),
      processedAt: "2026-05-07T12:00:00Z",
    });
  });

  it("should drop the sport hint when the value is not a known Sport", async () => {
    // Arrange
    const port = buildGenerateKrdPort(provider, () => "2026-05-07T12:00:00Z");
    // Act
    await port({ text: "warmup", sport: "weirdsport" });

    // Assert
    expect(generateWorkoutKrd).toHaveBeenCalledWith(
      expect.objectContaining({ sport: undefined })
    );
  });
});
