import { afterEach, describe, expect, it, vi } from "vitest";

import { type AiRunProgress, beginAiRun } from "./ai-run-progress";

const T0 = Date.parse("2026-10-24T10:00:00Z");
const LATER_MS = 4_000;
const MUCH_LATER_MS = 9_000;

const slotWithState = () => {
  let state: AiRunProgress | null = null;
  const slot = {
    abortRef: { current: null },
    setProgress: (
      next:
        | AiRunProgress
        | null
        | ((run: AiRunProgress | null) => AiRunProgress | null)
    ) => {
      state = typeof next === "function" ? next(state) : next;
    },
  };
  return { slot, read: () => state };
};

describe("beginAiRun", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should restart the phase clock only when the phase changes", () => {
    // Arrange
    vi.useFakeTimers({ now: T0 });
    const { slot, read } = slotWithState();
    const { onProgress } = beginAiRun(slot, "Claude Sonnet 5");

    // Act
    vi.setSystemTime(T0 + LATER_MS);
    onProgress({ phase: "generating", attempt: 1, maxAttempts: 3, items: 1 });
    vi.setSystemTime(T0 + MUCH_LATER_MS);
    onProgress({ phase: "generating", attempt: 1, maxAttempts: 3, items: 2 });

    // Assert
    expect(read()?.startedAt).toBe(T0);
    expect(read()?.phaseStartedAt).toBe(T0 + LATER_MS);
    expect(read()?.update?.items).toBe(2);
  });
});
