import { describe, expect, it, vi } from "vitest";

import type { GenerateFn, ProcessorParams } from "./ai-workout-processor";
import { processWorkoutWithAi } from "./ai-workout-processor";
import { makeValidKrd, makeWorkoutRecord } from "./test-helpers";

function makeParams(overrides: Partial<ProcessorParams> = {}): ProcessorParams {
  return {
    workout: makeWorkoutRecord(),
    selectedComments: [],
    zonesContext: "Z1: 120-140bpm",
    generateFn: vi.fn<GenerateFn>().mockResolvedValue(makeValidKrd()),
    provider: "openai",
    model: "gpt-4o",
    ...overrides,
  };
}

describe("processWorkoutWithAi", () => {
  it("returns success with valid LLM output", async () => {
    const params = makeParams();

    const result = await processWorkoutWithAi(params);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.krd.type).toBe("structured_workout");
      expect(result.aiMeta.promptVersion).toBe("1.0.0");
      expect(result.aiMeta.provider).toBe("openai");
      expect(result.aiMeta.model).toBe("gpt-4o");
      expect(result.retried).toBe(false);
    }
  });

  it("returns error when workout has no raw data", async () => {
    const params = makeParams({
      workout: makeWorkoutRecord({ raw: null }),
    });

    const result = await processWorkoutWithAi(params);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("no raw data");
    }
  });

  it("retries once on first failure then succeeds", async () => {
    const generateFn = vi
      .fn<GenerateFn>()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(makeValidKrd());

    const result = await processWorkoutWithAi(makeParams({ generateFn }));

    expect(result.ok).toBe(true);
    expect(result.retried).toBe(true);
    expect(generateFn).toHaveBeenCalledTimes(2);
  });

  it("returns error after both attempts fail", async () => {
    const generateFn = vi
      .fn<GenerateFn>()
      .mockRejectedValue(new Error("Persistent error"));

    const result = await processWorkoutWithAi(makeParams({ generateFn }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Persistent error");
      expect(result.retried).toBe(true);
    }
  });

  it("retries when sanity check fails", async () => {
    const badKrd = makeValidKrd(0, 3600);
    const goodKrd = makeValidKrd(3, 3600);
    const generateFn = vi
      .fn<GenerateFn>()
      .mockResolvedValueOnce(badKrd)
      .mockResolvedValueOnce(goodKrd);

    const result = await processWorkoutWithAi(makeParams({ generateFn }));

    expect(result.ok).toBe(true);
    expect(generateFn).toHaveBeenCalledTimes(2);
  });

  it("includes error context in retry prompt", async () => {
    const generateFn = vi
      .fn<GenerateFn>()
      .mockRejectedValueOnce(new Error("Invalid JSON"))
      .mockResolvedValueOnce(makeValidKrd());

    await processWorkoutWithAi(makeParams({ generateFn }));

    const retryPrompt = generateFn.mock.calls[1][0];
    expect(retryPrompt).toContain("Previous attempt failed");
    expect(retryPrompt).toContain("Invalid JSON");
  });

  it("passes selected comments to prompt", async () => {
    const generateFn = vi.fn<GenerateFn>().mockResolvedValue(makeValidKrd());

    await processWorkoutWithAi(
      makeParams({
        generateFn,
        selectedComments: ["Keep HR low"],
      })
    );

    const prompt = generateFn.mock.calls[0][0];
    expect(prompt).toContain("Keep HR low");
  });

  it("does not retry when allowRetry is false", async () => {
    const generateFn = vi.fn<GenerateFn>().mockRejectedValue(new Error("Fail"));

    const result = await processWorkoutWithAi(
      makeParams({ generateFn, allowRetry: false })
    );

    expect(result.ok).toBe(false);
    expect(result.retried).toBe(false);
    expect(generateFn).toHaveBeenCalledTimes(1);
  });
});
