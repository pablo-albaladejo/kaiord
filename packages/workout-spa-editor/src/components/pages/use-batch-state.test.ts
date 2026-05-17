import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const runnerSuccessSpy = vi.fn<(count: number) => void>();

vi.mock("./use-batch-runner", () => ({
  useBatchRunner: (
    _setMessage: (msg: string | null) => void,
    onSuccess?: (count: number) => void
  ) => {
    if (onSuccess) {
      runnerSuccessSpy.mockImplementation(onSuccess);
    }
    return {
      progress: null,
      isProcessing: false,
      run: runSpy,
      cancel: vi.fn(),
    };
  },
}));

const mockShowSuccess = vi.fn();

vi.mock("../../contexts/ToastContext", () => ({
  useToastContext: () => ({
    error: vi.fn(),
    success: mockShowSuccess,
    toast: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }),
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

describe("useBatchState (two-phase start)", () => {
  beforeEach(() => {
    mockProviderCount = 0;
    mockPrep = { ok: false, message: "" };
    runSpy.mockReset();
    runSpy.mockResolvedValue();
  });

  it("should surface a message when no providers are configured", async () => {
    // Arrange

    mockProviderCount = 0;
    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    // Act

    await act(async () => {
      await result.current.requestStart();
    });

    // Assert

    expect(result.current.message).toMatch(/Configure an AI provider/i);
    expect(result.current.pending).toBeNull();
  });

  it("should surface prepareBatch errors without dispatching the run", async () => {
    // Arrange

    mockProviderCount = 1;
    mockPrep = { ok: false, message: "No raw workouts to process this week." };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    // Act

    await act(async () => {
      await result.current.requestStart();
    });

    // Assert

    expect(result.current.message).toBe(
      "No raw workouts to process this week."
    );
    expect(result.current.pending).toBeNull();
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("should stage pending on successful requestStart without auto-dispatching", async () => {
    // Arrange

    mockProviderCount = 1;
    mockPrep = { ok: true, provider, workouts: [workout] };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    // Act

    await act(async () => {
      await result.current.requestStart();
    });

    // Assert

    expect(result.current.pending).toEqual({
      provider,
      workouts: [workout],
    });
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("should run the staged batch and clear pending via confirmStart", async () => {
    // Arrange

    mockProviderCount = 1;
    mockPrep = { ok: true, provider, workouts: [workout] };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });

    // Act

    await act(async () => {
      await result.current.confirmStart();
    });

    // Assert

    await waitFor(() => expect(runSpy).toHaveBeenCalledTimes(1));
    expect(runSpy.mock.calls[0][0]).toEqual({
      provider,
      workouts: [workout],
    });
    expect(result.current.pending).toBeNull();
  });

  it("should clear pending without calling run via cancelRequest", async () => {
    // Arrange

    mockProviderCount = 1;
    mockPrep = { ok: true, provider, workouts: [workout] };

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    await act(async () => {
      await result.current.requestStart();
    });

    // Act

    act(() => {
      result.current.cancelRequest();
    });

    // Assert

    expect(result.current.pending).toBeNull();
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("should be a no-op via confirmStart when nothing is pending", async () => {
    // Arrange

    mockProviderCount = 1;

    const { result } = renderHook(() =>
      useBatchState("2026-04-13", "2026-04-19")
    );

    // Act

    await act(async () => {
      await result.current.confirmStart();
    });

    // Assert

    expect(runSpy).not.toHaveBeenCalled();
  });
});
