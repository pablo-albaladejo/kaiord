import type { Analytics } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { BULK_EVENT } from "../../application/garmin-bulk/bulk-analytics";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";

const mockPlace = vi.fn(async () => ({ kind: "scheduled" as const }));
const mockDeps = vi.fn();
vi.mock("../garmin-place-record", () => ({
  placeRecordResult: (...args: unknown[]) => mockPlace(...args),
}));
vi.mock("../garmin-placement-deps", () => ({
  buildPlacementDeps: () => mockDeps(),
}));

import { pushQuiet } from "../garmin-push-fn";
import { runSendWeek } from "./send-week-run";

const WEEK = [
  { workoutId: "w-1", date: "2026-10-05" },
  { workoutId: "w-2", date: "2026-10-06" },
];
const handlers = { isCancelled: () => false, onOutcome: vi.fn() };
const context = (overrides = {}) => ({
  persistence: createInMemoryPersistence(),
  analytics: { event: vi.fn() } as unknown as Analytics,
  features: [],
  routeActive: true,
  bridgeInstalled: true,
  sessionActive: true,
  ...overrides,
});

describe("runSendWeek", () => {
  it("should push each item quietly and emit the run's counts", async () => {
    // Arrange
    mockDeps.mockReturnValue({
      locks: {},
      secureContext: true,
      sleep: vi.fn(),
    });
    const ctx = context();

    // Act
    const run = await runSendWeek(ctx, WEEK, handlers);

    // Assert
    expect(run).toMatchObject({ cancelled: false });
    expect(mockPlace).toHaveBeenCalledTimes(WEEK.length);
    expect(mockPlace.mock.calls[0][1]).toBe(pushQuiet);
    expect(ctx.analytics.event).toHaveBeenCalledWith(
      BULK_EVENT,
      expect.objectContaining({ scheduled: WEEK.length, failed: 0 })
    );
  });

  it("should stop at a failed pre-flight with 0 calls", async () => {
    // Arrange
    mockPlace.mockClear();
    mockDeps.mockReturnValue({
      locks: {},
      secureContext: true,
      sleep: vi.fn(),
    });
    const ctx = context({ sessionActive: false });

    // Act
    const run = await runSendWeek(ctx, WEEK, handlers);

    // Assert
    expect(run).toBe("no-session");
    expect(mockPlace).not.toHaveBeenCalled();
    expect(ctx.analytics.event).not.toHaveBeenCalled();
  });
});
