import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REFRESH_COOLDOWN_MS, resetRefreshCooldown } from "./refresh-cooldown";
import { useConnectionsRefresh } from "./use-connections-refresh";

const refresh = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("../../adapters/bridge/bridge-connection-store", () => ({
  bridgeConnections: { refresh },
}));

describe("useConnectionsRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRefreshCooldown();
    refresh.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRefreshCooldown();
  });

  it("should force a pass over every bridge", async () => {
    // Arrange
    const { result } = renderHook(() => useConnectionsRefresh());

    // Act
    await act(async () => {
      result.current.run();
    });

    // Assert
    expect(refresh).toHaveBeenCalledWith({ force: true });
  });

  it("should stop telling the reader to wait once the window has passed", async () => {
    // Arrange
    // Reachable in two presses: the second is refused inside the window, and
    // nothing else re-renders this control afterwards — so "Try again in a
    // minute" would outlive the minute and read as a dead button.
    const { result } = renderHook(() => useConnectionsRefresh());
    await act(async () => {
      result.current.run();
    });

    // Act
    act(() => {
      result.current.run();
    });
    const refused = result.current.status;
    act(() => {
      vi.advanceTimersByTime(REFRESH_COOLDOWN_MS);
    });

    // Assert
    expect(refused).toBe("cooldown");
    expect(result.current.status).toBe("idle");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
