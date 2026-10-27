import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncEngine, SyncStatus } from "./sync-engine-types";
import {
  RESUME_MIN_GAP_MS,
  useSyncOnResume,
  VISIBLE_POLL_MS,
} from "./use-sync-on-resume";

function engine(status: SyncStatus = "idle", connected = true): SyncEngine {
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

const becomeVisible = () =>
  document.dispatchEvent(new Event("visibilitychange"));

describe("useSyncOnResume", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should pull when the app becomes visible after a while", () => {
    // Arrange
    const clock = { now: 0 };
    const sync = engine();
    renderHook(() => useSyncOnResume(sync, () => clock.now));

    // Act
    clock.now = RESUME_MIN_GAP_MS;
    becomeVisible();

    // Assert
    expect(sync.syncNow).toHaveBeenCalledTimes(1);
  });

  it("should not pull again on a quick tab switch", () => {
    // Arrange
    const clock = { now: 0 };
    const sync = engine();
    renderHook(() => useSyncOnResume(sync, () => clock.now));

    // Act
    clock.now = RESUME_MIN_GAP_MS - 1;
    becomeVisible();
    window.dispatchEvent(new Event("focus"));

    // Assert
    expect(sync.syncNow).not.toHaveBeenCalled();
  });

  it("should pull every few minutes while the app stays visible", () => {
    // Arrange
    const clock = { now: 0 };
    const sync = engine();
    renderHook(() => useSyncOnResume(sync, () => clock.now));

    // Act
    clock.now = VISIBLE_POLL_MS;
    vi.advanceTimersByTime(VISIBLE_POLL_MS);

    // Assert
    expect(sync.syncNow).toHaveBeenCalledTimes(1);
  });

  it("should not pull when disconnected or waiting for a sign-in", () => {
    // Arrange
    const clock = { now: 0 };
    const offline = engine("idle", false);
    const waiting = engine("needsAuth");
    renderHook(() => useSyncOnResume(offline, () => clock.now));
    renderHook(() => useSyncOnResume(waiting, () => clock.now));

    // Act
    clock.now = RESUME_MIN_GAP_MS;
    becomeVisible();

    // Assert
    expect(offline.syncNow).not.toHaveBeenCalled();
    expect(waiting.syncNow).not.toHaveBeenCalled();
  });
});
