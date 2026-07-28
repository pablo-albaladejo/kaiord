import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSyncValue } from "./use-sync-value";

const engine = vi.hoisted(() => ({
  value: { connected: false, lastSyncedAt: null as string | null },
}));

vi.mock("../../../contexts/sync-context", () => ({
  useSync: () => engine.value,
}));

const FIVE_MINUTES_MS = 300_000;

describe("useSyncValue", () => {
  it("should report a disconnected account truthfully", () => {
    // Arrange
    engine.value = { connected: false, lastSyncedAt: null };

    // Act
    const { result } = renderHook(() => useSyncValue());

    // Assert
    expect(result.current).toBe("Not connected");
  });

  it("should report a connected account that has never synced", () => {
    // Arrange
    engine.value = { connected: true, lastSyncedAt: null };

    // Act
    const { result } = renderHook(() => useSyncValue());

    // Assert
    expect(result.current).toBe("Connected — not synced yet");
  });

  it("should render the last sync as a relative time", () => {
    // Arrange
    engine.value = {
      connected: true,
      lastSyncedAt: new Date(Date.now() - FIVE_MINUTES_MS).toISOString(),
    };

    // Act
    const { result } = renderHook(() => useSyncValue());

    // Assert
    expect(result.current).toBe("Drive · 5m ago");
  });
});
