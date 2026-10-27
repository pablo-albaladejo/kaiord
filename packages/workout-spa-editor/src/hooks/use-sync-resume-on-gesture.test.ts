import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SyncEngine, SyncStatus } from "./sync-engine-types";
import { useSyncResumeOnGesture } from "./use-sync-resume-on-gesture";

function engine(status: SyncStatus, connected = true): SyncEngine {
  return {
    status,
    connected,
    lastSyncedAt: null,
    error: null,
    profileChoice: null,
    syncNow: vi.fn(async () => "synced" as const),
    connect: vi.fn(async () => {}),
    requestPush: vi.fn(),
    disconnect: vi.fn(),
    stop: vi.fn(async () => {}),
    chooseProfile: vi.fn(async () => "synced" as const),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useSyncResumeOnGesture", () => {
  it("should sign in and sync on the next click while sync needs a sign-in", async () => {
    // Arrange
    const sync = engine("needsAuth");
    renderHook(() => useSyncResumeOnGesture(sync));

    // Act
    document.body.click();
    await flush();

    // Assert
    expect(sync.connect).toHaveBeenCalledTimes(1);
    expect(sync.syncNow).toHaveBeenCalledTimes(1);
  });

  it("should not resume a second time after a gesture was used", async () => {
    // Arrange
    const sync = engine("needsAuth");
    const { rerender } = renderHook(
      ({ value }) => useSyncResumeOnGesture(value),
      { initialProps: { value: sync } }
    );
    document.body.click();
    await flush();

    // Act
    rerender({ value: { ...sync } });
    document.body.click();
    await flush();

    // Assert
    expect(sync.connect).toHaveBeenCalledTimes(1);
  });

  it("should ignore gestures when sync is idle or not connected", async () => {
    // Arrange
    const idle = engine("idle");
    const offline = engine("needsAuth", false);
    renderHook(() => useSyncResumeOnGesture(idle));
    renderHook(() => useSyncResumeOnGesture(offline));

    // Act
    document.body.click();
    await flush();

    // Assert
    expect(idle.connect).not.toHaveBeenCalled();
    expect(offline.connect).not.toHaveBeenCalled();
  });
});
