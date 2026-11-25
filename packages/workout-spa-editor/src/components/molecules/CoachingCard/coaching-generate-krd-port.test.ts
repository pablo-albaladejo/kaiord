/**
 * Tests for the coaching dialog's `GenerateKrdPort`. Exercises the
 * generated `aiMeta` shape returned by the `GenerateKrdPort` adapter,
 * including the resolved `modelId` flowing into `aiMeta.model`.
 */
import { describe, expect, it, vi } from "vitest";

import { NoAiProviderError } from "../../../application/coaching/convert-coaching-activity-error-mapper";
import { generateStepNotes } from "../../../lib/generate-step-notes";
import { generateWorkoutKrd } from "../../../lib/generate-workout";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import {
  buildGenerateKrdPort,
  buildGenerateStepNotesPort,
} from "./coaching-generate-krd-port";

vi.mock("../../../lib/generate-step-notes", () => ({
  generateStepNotes: vi.fn(async () => []),
}));

vi.mock("../../../lib/generate-workout", () => ({
  generateWorkoutKrd: vi.fn(async () => ({ kind: "krd-stub" })),
}));

const provider: LlmProviderConfig = {
  id: "p-1",
  type: "openai",
  apiKey: "secret",
} as unknown as LlmProviderConfig;

const DEPS = { persistence: {} as never, usage: { emit: () => undefined } };
const CHOICE = { provider, modelId: "gpt-4o-mini" };
const chooseModel = () => CHOICE;

describe("buildGenerateKrdPort", () => {
  it("should populate aiMeta with provider type, resolved model, prompt version and timestamp", async () => {
    // Arrange
    const port = buildGenerateKrdPort(
      DEPS,
      chooseModel,
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
      DEPS,
      chooseModel,
      () => "2026-05-07T12:00:00Z"
    );

    // Act
    await port({ text: "warmup", sport: "weirdsport" });

    // Assert
    expect(generateWorkoutKrd).toHaveBeenCalledWith(
      expect.objectContaining({ sport: undefined })
    );
  });

  it("should forward the abort signal and the progress listener to the generator", async () => {
    // Arrange
    const onProgress = vi.fn();
    const port = buildGenerateKrdPort(
      DEPS,
      chooseModel,
      () => "2026-05-07T12:00:00Z",
      { onProgress }
    );
    const abortSignal = new AbortController().signal;

    // Act
    await port({ text: "warmup", sport: "cycling", abortSignal });

    // Assert
    expect(generateWorkoutKrd).toHaveBeenCalledWith(
      expect.objectContaining({ abortSignal, onProgress })
    );
  });

  it("should choose the model only when the AI is called, and say it started", async () => {
    // Arrange
    const choose = vi.fn(chooseModel);
    const onAiStart = vi.fn();
    const port = buildGenerateKrdPort(DEPS, choose, () => "t", { onAiStart });

    // Act
    const before = choose.mock.calls.length;
    await port({ text: "warmup", sport: "cycling" });

    // Assert
    expect(before).toBe(0);
    expect(choose).toHaveBeenCalledOnce();
    expect(onAiStart).toHaveBeenCalledWith(CHOICE);
  });

  it("should fail with no provider, without starting the AI, when none is configured", async () => {
    // Arrange
    vi.mocked(generateWorkoutKrd).mockClear();
    const onAiStart = vi.fn();
    const port = buildGenerateKrdPort(
      DEPS,
      () => null,
      () => "t",
      {
        onAiStart,
      }
    );

    // Act
    const run = port({ text: "warmup", sport: "cycling" });

    // Assert
    await expect(run).rejects.toBeInstanceOf(NoAiProviderError);
    expect(onAiStart).not.toHaveBeenCalled();
    expect(generateWorkoutKrd).not.toHaveBeenCalled();
  });
});

describe("buildGenerateStepNotesPort", () => {
  const INPUT = { coachText: "A una pierna", steps: ["30 s R1"] };

  it("should make no notes call, and add no notes, when no provider is configured", async () => {
    // Arrange
    vi.mocked(generateStepNotes).mockClear();
    const port = buildGenerateStepNotesPort(DEPS, () => null);

    // Act
    const notes = await port(INPUT);

    // Assert
    expect(notes).toBeNull();
    expect(generateStepNotes).not.toHaveBeenCalled();
  });

  it("should choose the model only when the notes are asked for", async () => {
    // Arrange
    const choose = vi.fn(chooseModel);
    const port = buildGenerateStepNotesPort(DEPS, choose);

    // Act
    const before = choose.mock.calls.length;
    await port(INPUT);

    // Assert
    expect(before).toBe(0);
    expect(generateStepNotes).toHaveBeenCalledWith(
      expect.objectContaining({ input: INPUT, modelId: "gpt-4o-mini" })
    );
  });
});
