import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { BatchPrep } from "./batch-prepare";
import { useBatchState } from "./use-batch-state";

let mockProviderCount = 0;
let mockPrep: BatchPrep = { ok: false, message: "" };
const runSpy =
  vi.fn<
    (batch: {
      provider: LlmProviderConfig;
      workouts: WorkoutRecord[];
    }) => Promise<void>
  >();

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => mockProviderCount,
}));

vi.mock("../../adapters/dexie/dexie-database", () => ({
  db: { table: () => ({ count: () => mockProviderCount }) },
}));

vi.mock("./batch-prepare", () => ({
  prepareBatch: async () => mockPrep,
}));

vi.mock("./use-batch-runner", () => ({
  useBatchRunner: () => ({
    progress: null,
    isProcessing: false,
    run: runSpy,
    cancel: vi.fn(),
  }),
}));

const provider: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude",
  label: "Default",
  isDefault: true,
};

const workout = {
  id: "w1",
  date: "2026-04-18",
  state: "raw",
  raw: { description: "3k", comments: [] },
} as unknown as WorkoutRecord;

describe("useBatchState (two-phase start)", () => {
  beforeEach(() => {
    mockProviderCount = 0;
    mockPrep = { ok: false, message: "" };
    runSpy.mockReset();
    runSpy.mockResolvedValue();
  });

  it("surfaces a message when no providers are configured", async () => {
    mockProviderCount = 0;
    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });

    expect(result.current.message).toMatch(/Configure an AI provider/i);
    expect(result.current.pending).toBeNull();
  });

  it("surfaces prepareBatch errors without dispatching the run", async () => {
    mockProviderCount = 1;
    mockPrep = { ok: false, message: "No raw workouts to process this week." };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });

    expect(result.current.message).toBe(
      "No raw workouts to process this week."
    );
    expect(result.current.pending).toBeNull();
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("stages pending on successful requestStart without auto-dispatching", async () => {
    mockProviderCount = 1;
    mockPrep = { ok: true, provider, workouts: [workout] };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });

    expect(result.current.pending).toEqual({
      provider,
      workouts: [workout],
    });
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("confirmStart runs the staged batch and clears pending", async () => {
    mockProviderCount = 1;
    mockPrep = { ok: true, provider, workouts: [workout] };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });
    await act(async () => {
      await result.current.confirmStart();
    });

    await waitFor(() => expect(runSpy).toHaveBeenCalledTimes(1));
    expect(runSpy.mock.calls[0][0]).toEqual({
      provider,
      workouts: [workout],
    });
    expect(result.current.pending).toBeNull();
  });

  it("cancelRequest clears pending without calling run", async () => {
    mockProviderCount = 1;
    mockPrep = { ok: true, provider, workouts: [workout] };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });
    act(() => {
      result.current.cancelRequest();
    });

    expect(result.current.pending).toBeNull();
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("confirmStart is a no-op when nothing is pending", async () => {
    mockProviderCount = 1;

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.confirmStart();
    });

    expect(runSpy).not.toHaveBeenCalled();
  });
});
