import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isRefreshCoolingDown,
  isRefreshRunning,
  REFRESH_COOLDOWN_MS,
  resetRefreshCooldown,
  startOrJoinRefresh,
} from "./refresh-cooldown";

afterEach(() => {
  resetRefreshCooldown();
});

describe("refresh-cooldown", () => {
  it("should hold the caller off for the whole window after a pass", async () => {
    // Arrange
    // The reachable failure: a forced pass bypasses the store's 30-second
    // positive cache and the 60-second visibility floor, and probes run
    // outside BRIDGE_QUEUE — so a held button messages four extensions with
    // no backpressure at all.
    const start = 1_000_000;
    const now = vi.fn(() => start);

    // Act
    await startOrJoinRefresh(() => Promise.resolve(), now);

    // Assert
    expect(isRefreshCoolingDown(start + REFRESH_COOLDOWN_MS - 1)).toBe(true);
    expect(isRefreshCoolingDown(start + REFRESH_COOLDOWN_MS)).toBe(false);
  });

  it("should join a pass already in flight instead of starting a second", async () => {
    // Arrange
    // Two clicks inside the same tick: a captured status cannot settle this,
    // because neither click has seen the other's state update yet.
    const passes = vi.fn(() => Promise.resolve());

    // Act
    const first = startOrJoinRefresh(passes);
    const second = startOrJoinRefresh(passes);
    await Promise.all([first, second]);

    // Assert
    expect(passes).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("should report a pass as running until it settles", async () => {
    // Arrange
    let release = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Act
    const running = startOrJoinRefresh(() => pending);
    const duringPass = isRefreshRunning();
    release();
    await running;

    // Assert
    expect(duringPass).toBe(true);
    expect(isRefreshRunning()).toBe(false);
  });

  it("should stamp the cooldown after a pass that failed", async () => {
    // Arrange
    // Without this, a bridge that throws can be retried in a tight loop —
    // exactly the case where backing off matters most.
    const start = 2_000_000;
    const now = vi.fn(() => start);

    // Act
    await expect(
      startOrJoinRefresh(() => Promise.reject(new Error("gone")), now)
    ).rejects.toThrow("gone");

    // Assert
    expect(isRefreshRunning()).toBe(false);
    expect(isRefreshCoolingDown(start + 1)).toBe(true);
  });
});
