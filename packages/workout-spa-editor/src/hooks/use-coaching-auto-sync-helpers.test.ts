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
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
// eslint-disable-next-line no-magic-numbers -- 5 minutes window inside the isStale 10-minute threshold
const FIVE_MINUTES_MS = 5 * SECONDS_PER_MINUTE * MS_PER_SECOND;
// eslint-disable-next-line no-magic-numbers -- 11 minutes window past the isStale 10-minute threshold
const ELEVEN_MINUTES_MS = 11 * SECONDS_PER_MINUTE * MS_PER_SECOND;
const ONE_MINUTE_MS = SECONDS_PER_MINUTE * MS_PER_SECOND;

describe("isStale", () => {
  it.each([
    { lastSyncedAt: undefined, expected: true },
    { lastSyncedAt: "not-a-date", expected: true },
    {
      lastSyncedAt: new Date(NOW_MS - FIVE_MINUTES_MS).toISOString(),
      expected: false,
    },
    {
      lastSyncedAt: new Date(NOW_MS - ELEVEN_MINUTES_MS).toISOString(),
      expected: true,
    },
  ])(
    "should return $expected when lastSyncedAt is $lastSyncedAt",
    ({ lastSyncedAt, expected }) => {
      // Arrange

      // Act
      const result = isStale(lastSyncedAt, NOW_MS);

      // Assert
      expect(result).toBe(expected);
    }
  );
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
    const fresh = new Date(NOW_MS - ONE_MINUTE_MS).toISOString();
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
