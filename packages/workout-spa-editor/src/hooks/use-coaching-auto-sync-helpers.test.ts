/**
 * Tests for runSourceSync and isStale helpers.
 *
 * Key invariant (spec §12.2): when auto-sync fails (throw or src.error set),
 * coaching.sync.failure MUST be emitted with isAutoSync: true.
 */

import type { Analytics } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { CoachingSyncState } from "./use-coaching-activities";
import { isStale, runSourceSync } from "./use-coaching-auto-sync-helpers";

const makeAnalytics = (): Analytics => ({
  pageView: vi.fn(),
  event: vi.fn(),
});

const makeSource = (
  overrides: Partial<CoachingSyncState> = {}
): CoachingSyncState => ({
  id: "train2go",
  label: "Train2Go",
  linked: true,
  connected: true,
  loading: false,
  error: null,
  sync: vi.fn(async () => undefined),
  connect: vi.fn(async () => undefined),
  ...overrides,
});

const NOW_MS = Date.now();

describe("isStale", () => {
  it("should return true when lastSyncedAt is undefined", () => {
    // Arrange

    // Act

    // Assert
    expect(isStale(undefined, NOW_MS)).toBe(true);
  });

  it("should return true when lastSyncedAt is unparseable", () => {
    // Arrange

    // Act

    // Assert
    expect(isStale("not-a-date", NOW_MS)).toBe(true);
  });

  it("should return false when lastSyncedAt is within 10 minutes", () => {
    // Arrange

    // Act
    const recent = new Date(NOW_MS - 5 * 60 * 1000).toISOString();

    // Assert
    expect(isStale(recent, NOW_MS)).toBe(false);
  });

  it("should return true when lastSyncedAt is older than 10 minutes", () => {
    // Arrange

    // Act
    const old = new Date(NOW_MS - 11 * 60 * 1000).toISOString();

    // Assert
    expect(isStale(old, NOW_MS)).toBe(true);
  });
});

describe("runSourceSync — auto-sync failure emits isAutoSync: true (spec §12.2)", () => {
  let analytics: Analytics;
  let persistence: ReturnType<typeof createInMemoryPersistence>;

  beforeEach(() => {
    analytics = makeAnalytics();
    persistence = createInMemoryPersistence();
  });

  it("should emit coaching.sync.failure with isAutoSync: true when src.sync throws", async () => {
    // Arrange
    const src = makeSource({
      sync: vi.fn(async () => {
        throw new Error("tab closed");
      }),
    });

    // Act
    await runSourceSync(
      src,
      "p1",
      "2026-04-13",
      "auto-mount",
      NOW_MS,
      persistence,
      analytics
    );

    // Assert
    expect(analytics.event).toHaveBeenCalledWith("coaching.sync.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "transport-error",
      isAutoSync: true,
    });
  });

  it("should emit coaching.sync.failure with isAutoSync: true when src.error is set after sync", async () => {
    // Arrange
    const src = makeSource({
      sync: vi.fn(async () => {
        src.error = "session expired";
      }),
    });

    // Act
    await runSourceSync(
      src,
      "p1",
      "2026-04-13",
      "auto-mount",
      NOW_MS,
      persistence,
      analytics
    );

    // Assert
    expect(analytics.event).toHaveBeenCalledWith("coaching.sync.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "transport-error",
      isAutoSync: true,
    });
  });

  it("should emit coaching.sync.invoked before syncing", async () => {
    // Arrange
    const src = makeSource();

    // Act
    await runSourceSync(
      src,
      "p1",
      "2026-04-13",
      "auto-week-change",
      NOW_MS,
      persistence,
      analytics
    );

    // Assert
    expect(analytics.event).toHaveBeenCalledWith("coaching.sync.invoked", {
      source: "train2go",
      profileId: "p1",
      trigger: "auto-week-change",
    });
  });

  it("should skip sync and emits nothing when state is fresh", async () => {
    // Arrange
    const fresh = new Date(NOW_MS - 60_000).toISOString();
    await persistence.coachingSyncState.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: fresh,
    });
    const src = makeSource();

    // Act
    await runSourceSync(
      src,
      "p1",
      "2026-04-13",
      "auto-mount",
      NOW_MS,
      persistence,
      analytics
    );

    // Assert
    expect(src.sync).not.toHaveBeenCalled();
    expect(analytics.event).not.toHaveBeenCalled();
  });
});
