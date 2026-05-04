import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";
import { useBatchRunner } from "./use-batch-runner";

const processBatchSpy = vi.fn();

vi.mock("../../application/batch-processor", () => ({
  processBatch: (...args: unknown[]) => processBatchSpy(...args),
}));

vi.mock("../../adapters/dexie/dexie-database", () => ({
  db: {},
}));

vi.mock("./batch-process-one", () => ({
  createProcessOne: vi.fn(() => vi.fn()),
}));

const provider: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude",
  label: "Default",
  isDefault: true,
  createdAt: 0,
};

const workout = {
  id: "w1",
  date: "2026-04-18",
  state: "raw",
  raw: { description: "3k", comments: [] },
} as unknown as WorkoutRecord;

describe("useBatchRunner", () => {
  it("should flip isProcessing around the batch run and calls processBatch", async () => {
    // Arrange

    processBatchSpy.mockResolvedValueOnce(undefined);
    const setMessage = vi.fn();

    // Act

    const { result } = renderHook(() => useBatchRunner(setMessage));

    // Assert

    expect(result.current.isProcessing).toBe(false);
    await act(async () => {
      await result.current.run({ provider, workouts: [workout] });
    });

    await waitFor(() => expect(processBatchSpy).toHaveBeenCalledTimes(1));
    expect(result.current.isProcessing).toBe(false);
  });

  it("should surface an error message when processBatch throws", async () => {
    // Arrange

    processBatchSpy.mockRejectedValueOnce(new Error("boom"));
    const setMessage = vi.fn();

    const { result } = renderHook(() => useBatchRunner(setMessage));

    // Act

    await act(async () => {
      await result.current.run({ provider, workouts: [workout] });
    });

    // Assert

    expect(setMessage).toHaveBeenCalledWith(
      "Batch processing encountered an unexpected error."
    );
    expect(result.current.isProcessing).toBe(false);
  });
});
