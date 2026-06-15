/**
 * Tests for the pure helpers backing `useCoachingAi`. Exercises the
 * generated `aiMeta` shape returned by the `GenerateKrdPort` adapter,
 * including the resolved `modelId` flowing into `aiMeta.model`.
 */
import { describe, expect, it, vi } from "vitest";

import { generateWorkoutKrd } from "../../../lib/generate-workout";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { buildGenerateKrdPort } from "./use-coaching-ai-helpers";

vi.mock("../../../lib/generate-workout", () => ({
  generateWorkoutKrd: vi.fn(async () => ({ kind: "krd-stub" })),
}));

const provider: LlmProviderConfig = {
  id: "p-1",
  type: "openai",
  apiKey: "secret",
} as unknown as LlmProviderConfig;

describe("buildGenerateKrdPort", () => {
  it("should populate aiMeta with provider type, resolved model, prompt version and timestamp", async () => {
    // Arrange
    const port = buildGenerateKrdPort(
      provider,
      "gpt-4o-mini",
      () => "2026-05-07T12:00:00Z"
    );

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
    const port = buildGenerateKrdPort(
      provider,
      "gpt-4o-mini",
      () => "2026-05-07T12:00:00Z"
    );

    // Act
    await port({ text: "warmup", sport: "weirdsport" });

    // Assert
    expect(generateWorkoutKrd).toHaveBeenCalledWith(
      expect.objectContaining({ sport: undefined })
    );
  });
});
