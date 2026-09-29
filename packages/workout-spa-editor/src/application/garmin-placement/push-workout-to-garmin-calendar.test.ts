import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALL_FEATURES,
  createPlacementHarness,
  D1,
  D2,
  preparePath,
  type PushPath,
} from "../../test-utils/placement-harness";
import { PENDING_TTL_MS } from "../export/record-export-constraint";
import { PLACEMENT_EVENT } from "./placement-analytics";
import {
  CALENDAR_WRITE_FEATURE,
  SPA_ACTION_TIMEOUT_MS,
} from "./placement-timing";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const MINUTE_MS = 60_000;
/** Slack between the SPA wait and the pending TTL. */
const WINDOW_MARGIN_MS = 240_000;
const PATHS: PushPath[] = ["C", "U", "S"];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

describe("pushWorkoutToGarminCalendar — happy paths", () => {
  it("should place a first push on its date with 1 library push and 1 schedule", async () => {
    // Arrange
    const h = createPlacementHarness();

    // Act
    const result = await h.push(D1);

    // Assert
    expect(result).toEqual({ kind: "scheduled" });
    expect(h.library.pushes).toBe(1);
    expect(h.calendar.items.map((i) => i.date)).toEqual([D1]);
    expect((await h.row())?.placement?.kind).toBe("scheduled");
  });

  it.each(PATHS)(
    "should hold attempting{posted:true} with previous when schedule is called [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      const before = (await h.row())?.placement;
      const seen: unknown[] = [];
      h.calendar.state.beforeAnswer = async () => {
        seen.push((await h.row())?.placement);
      };

      // Act
      await h.push(date, content);

      // Assert
      expect(seen).toEqual([
        expect.objectContaining({
          kind: "attempting",
          posted: true,
          at: expect.any(String),
          ...(before ? { previous: before } : {}),
        }),
      ]);
    }
  );

  it.each(["C", "U"] as const)(
    "should make 0 calls and keep updatedAt on an unchanged re-push [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      await h.push(date, content);
      const before = await h.row();
      const calls = h.calendar.calls.length;
      const pushes = h.library.pushes;
      vi.setSystemTime(T0.getTime() + MINUTE_MS);

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toEqual({ kind: "unchanged" });
      expect(h.calendar.calls.length).toBe(calls);
      expect(h.library.pushes).toBe(pushes);
      expect((await h.row())?.updatedAt).toBe(before?.updatedAt);
    }
  );

  it("should move a date-only change with 0 library pushes, retiring before unschedule [S]", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const oldId = h.calendar.items[0]?.id;
    const atUnschedule: unknown[] = [];
    const unschedule = h.calendar.port.unschedule;
    h.calendar.port.unschedule = async (id) => {
      atUnschedule.push(
        (await h.row())?.removalQueue?.find((e) => e.workoutScheduleId === id)
          ?.state
      );
      return unschedule(id);
    };

    // Act
    const result = await h.push(D2);

    // Assert
    expect(result).toEqual({ kind: "moved" });
    expect(h.library.pushes).toBe(1);
    expect(h.calendar.count("schedule")).toBe(2);
    expect(atUnschedule).toEqual(["retire"]);
    expect(h.calendar.calls.at(-1)).toEqual({ op: "unschedule", id: oldId });
    expect(h.calendar.items.map((i) => i.date)).toEqual([D2]);
  });

  it.each([D1, D2])(
    "should replace the entry on a content move to %s [U]",
    async (date) => {
      // Arrange
      const h = createPlacementHarness();
      await h.push(D1, "v1");

      // Act
      const result = await h.push(date, "v2");

      // Assert
      expect(result).toEqual({ kind: "moved" });
      expect(h.library.pushes).toBe(2);
      expect(h.calendar.count("schedule")).toBe(2);
      expect(h.calendar.count("unschedule")).toBe(1);
      expect(h.calendar.items).toHaveLength(1);
      expect(h.calendar.items[0]?.workoutId).toBe("1700001");
    }
  );
});

describe("pushWorkoutToGarminCalendar — no orphans (AC-18, AC-17)", () => {
  it.each(["C", "U"] as const)(
    "should retry a definite failure with 0 library pushes and 1 schedule [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      h.calendar.scripts.schedule.push({ answer: { ok: false, status: 400 } });
      const failedRun = await h.push(date, content);
      const pushes = h.library.pushes;
      const schedules = h.calendar.count("schedule");

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(failedRun).toEqual({
        kind: "failed",
        reason: "schedule-rejected",
        retryable: false,
      });
      expect(result.kind).toBe(path === "C" ? "scheduled" : "moved");
      expect(h.library.pushes).toBe(pushes);
      expect(h.calendar.count("schedule")).toBe(schedules + 1);
      expect(h.calendar.count("unschedule")).toBe(path === "U" ? 1 : 0);
      expect(h.calendar.items).toHaveLength(1);
    }
  );

  it.each(["C", "U"] as const)(
    "should make 0 calendar calls when the library push fails [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      const calls = h.calendar.calls.length;
      h.library.fail = true;

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toEqual({
        kind: "failed",
        reason: "library-push-failed",
        retryable: true,
      });
      expect(h.calendar.calls.length).toBe(calls);
    }
  );

  it("should keep the SPA action wait far below the pending TTL", () => {
    // Arrange
    const longestPhaseOneWait = SPA_ACTION_TIMEOUT_MS;

    // Act
    const margin = PENDING_TTL_MS - longestPhaseOneWait;

    // Assert
    expect(margin).toBeGreaterThan(WINDOW_MARGIN_MS);
  });
});

describe("pushWorkoutToGarminCalendar — lock and pre-flight (AC-30, AC-34)", () => {
  it("should share one run between two pushes in the same tab", async () => {
    // Arrange
    const h = createPlacementHarness();

    // Act
    const [a, b] = await Promise.all([h.push(D1), h.push(D1)]);

    // Assert
    expect(a).toBe(b);
    expect(h.library.pushes).toBe(1);
    expect(h.calendar.count("schedule")).toBe(1);
  });

  it("should refuse a second tab with busy and 0 calls, library included", async () => {
    // Arrange
    const h = createPlacementHarness();
    const otherTab = {
      ...h.deps,
      locks: h.lockManager.port(),
      joins: new Map(),
    };
    let release = () => {};
    h.library.fail = false;
    const gate = new Promise<void>((resolve) => (release = resolve));
    h.calendar.state.beforeAnswer = () => gate;
    const first = h.push(D1);
    await vi.waitFor(() => expect(h.calendar.count("schedule")).toBe(1));

    // Act
    const second = await h.push(D1, "v1", {}, otherTab);
    release();

    // Assert
    expect(second).toEqual({ kind: "failed", reason: "busy", retryable: true });
    expect(h.library.pushes).toBe(1);
    expect(await first).toEqual({ kind: "scheduled" });
    expect(h.lockManager.held.size).toBe(0);
  });

  it("should release the lock when the run throws", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.port.schedule = async () => {
      throw new Error("port broke");
    };

    // Act
    const run = h.push(D1);

    // Assert
    await expect(run).rejects.toThrow("port broke");
    expect(h.lockManager.held.size).toBe(0);
  });

  it("should push the library only, without Web Locks", async () => {
    // Arrange
    const h = createPlacementHarness({ locks: null });

    // Act
    const result = await h.push(D1);

    // Assert
    expect(result).toEqual({
      kind: "library-only",
      reason: "insecure-context",
    });
    expect(h.library.pushes).toBe(1);
    expect(h.calendar.calls).toEqual([]);
  });

  it("should push the library only on a bridge without calendar-write, then place after the update", async () => {
    // Arrange
    const h = createPlacementHarness({ features: [] });
    const outdated = await h.push(D1);
    const updated = { ...h.deps, features: ALL_FEATURES };

    // Act
    const result = await h.push(D1, "v1", {}, updated);

    // Assert
    expect(outdated).toEqual({
      kind: "library-only",
      reason: "bridge-outdated",
    });
    expect(result).toEqual({ kind: "scheduled" });
    expect(h.library.pushes).toBe(1);
    expect(h.calendar.count("schedule")).toBe(1);
    expect(updated.features).toContain(CALENDAR_WRITE_FEATURE);
  });
});

describe("pushWorkoutToGarminCalendar — analytics and onLibraryConfirmed (AC-35)", () => {
  it("should emit enum values and counts only, after the run", async () => {
    // Arrange
    const event = vi.fn();
    const h = createPlacementHarness({
      analytics: { event, pageView: vi.fn() },
    });
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 409 } });

    // Act
    await h.push(D1);

    // Assert
    expect(event).toHaveBeenCalledWith(PLACEMENT_EVENT, {
      result: "failed",
      reason: "schedule-rejected",
      durationMs: 0,
      abandonedCount: 0,
    });
    const payload = JSON.stringify(event.mock.calls);
    expect(payload).not.toMatch(/\d{4}-\d{2}-\d{2}|1700000|aaaaaaaa/);
  });

  it("should call onLibraryConfirmed with the confirmed id, and not for an unconfirmed one", async () => {
    // Arrange
    const confirmed = createPlacementHarness();
    const unconfirmed = createPlacementHarness();
    unconfirmed.library.noId = true;
    const onA = vi.fn();
    const onB = vi.fn();

    // Act
    await confirmed.push(D1, "v1", { onLibraryConfirmed: onA });
    const result = await unconfirmed.push(D1, "v1", {
      onLibraryConfirmed: onB,
    });

    // Assert
    expect(onA).toHaveBeenCalledWith("1700000");
    expect(onB).not.toHaveBeenCalled();
    expect(result).toEqual({
      kind: "failed",
      reason: "library-id-unknown",
      retryable: true,
    });
  });
});
