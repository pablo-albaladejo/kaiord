import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { flushPendingSaves } from "../../../lib/pending-flushes";
import { usePromptAutosave } from "./use-prompt-autosave";

// The pause the hook waits after the last keystroke.
const PAUSE_MS = 800;

describe("usePromptAutosave", () => {
  it("should save a change still waiting on its pause when pending saves are flushed", async () => {
    // Arrange
    const save = vi.fn(async () => true);
    const { result } = renderHook(() => usePromptAutosave(save));
    act(() => result.current.change("Be brief"));

    // Act
    await act(() => flushPendingSaves());

    // Assert
    expect(save).toHaveBeenCalledWith("Be brief");
  });

  it("should have nothing to flush once the pause has saved the change", async () => {
    // Arrange
    vi.useFakeTimers();
    const save = vi.fn(async () => true);
    const { result } = renderHook(() => usePromptAutosave(save));
    act(() => result.current.change("Be brief"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAUSE_MS);
    });
    vi.useRealTimers();

    // Act
    await act(() => flushPendingSaves());

    // Assert
    expect(save).toHaveBeenCalledTimes(1);
  });
});
