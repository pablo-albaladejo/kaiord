/**
 * A bulk week against the real placement pipeline and the fake Garmin
 * calendar (AC-43, AC-44, the outdated-bridge scenario, and a bulk run
 * racing a single push of the same record). Invariant: never a gap, worst
 * case a duplicate — here, exactly 1 entry per eligible session.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALL_FEATURES,
  createPlacementHarness,
  type PlacementHarness,
} from "../../test-utils/placement-harness";
import type { PlacementPipelineDeps } from "../garmin-placement/push-workout-to-garmin-calendar";
import { mergeOutcomes, retryCandidates } from "./bulk-retry";
import type { WeekPushCandidate } from "./select-week-push-candidates";
import { sendWeekToGarmin } from "./send-week-to-garmin";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const WEEK: WeekPushCandidate[] = [
  { workoutId: "w-mon", date: "2026-10-05" },
  { workoutId: "w-wed", date: "2026-10-07" },
  { workoutId: "w-fri", date: "2026-10-09" },
];
const dateOf = (id: string) => WEEK.find((c) => c.workoutId === id)?.date;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

const runWeek = (
  h: PlacementHarness,
  candidates: readonly WeekPushCandidate[],
  deps: PlacementPipelineDeps = h.deps
) =>
  sendWeekToGarmin(
    {
      pushOne: (id) =>
        h.push(dateOf(id) ?? "", "v1", { kaiordRecordId: id }, deps),
      sleep: h.deps.sleep,
      isCancelled: () => false,
    },
    candidates
  );

const dates = (h: PlacementHarness) =>
  h.calendar.items.map((i) => i.date).sort();

describe("send week through the placement pipeline", () => {
  it("should place every other session when the bridge fails session k", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.scripts.schedule.push(
      {},
      { answer: { ok: false, error: "deadline-before-send" } }
    );

    // Act
    const run = await runWeek(h, WEEK);

    // Assert
    expect(run.outcomes.map((o) => o.status)).toEqual([
      "scheduled",
      "failed",
      "scheduled",
    ]);
    expect(dates(h)).toEqual(["2026-10-05", "2026-10-09"]);
  });

  it("should retry only the failed session and end with 1 entry each", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.scripts.schedule.push(
      {},
      { answer: { ok: false, error: "deadline-before-send" } }
    );
    const first = await runWeek(h, WEEK);
    const pushesBefore = h.library.pushes;
    const callsBefore = h.calendar.calls.length;

    // Act
    const retry = await runWeek(
      h,
      retryCandidates(first.outcomes, Date.now(), ALL_FEATURES)
    );

    // Assert
    const touched = h.calendar.calls.slice(callsBefore);
    expect(new Set(touched.map((c) => ("date" in c ? c.date : "")))).toEqual(
      new Set(["2026-10-07"])
    );
    expect(h.library.pushes).toBe(pushesBefore);
    expect(mergeOutcomes(first.outcomes, retry.outcomes)).toMatchObject([
      { status: "scheduled" },
      { status: "scheduled" },
      { status: "scheduled" },
    ]);
    expect(dates(h)).toEqual(["2026-10-05", "2026-10-07", "2026-10-09"]);
  });

  it("should fill the library on an outdated bridge and schedule on retry", async () => {
    // Arrange
    const h = createPlacementHarness({ features: [] });
    const first = await runWeek(h, WEEK);
    const pushesAfterFirst = h.library.pushes;
    const updated = { ...h.deps, features: ALL_FEATURES };

    // Act
    await runWeek(
      h,
      retryCandidates(first.outcomes, Date.now(), ALL_FEATURES),
      updated
    );

    // Assert
    expect(first.outcomes.map((o) => o.result)).toEqual(
      WEEK.map(() => ({ kind: "library-only", reason: "bridge-outdated" }))
    );
    expect(pushesAfterFirst).toBe(WEEK.length);
    expect(h.library.pushes).toBe(WEEK.length);
    expect(h.calendar.count("schedule")).toBe(WEEK.length);
    expect(dates(h)).toEqual(["2026-10-05", "2026-10-07", "2026-10-09"]);
  });

  it("should join a single push of the same record racing the bulk run", async () => {
    // Arrange
    const h = createPlacementHarness();
    const bulk = runWeek(h, WEEK);

    // Act
    const single = await h.push("2026-10-05", "v1", {
      kaiordRecordId: "w-mon",
    });
    const run = await bulk;

    // Assert
    expect(single).toEqual(run.outcomes[0].result);
    expect(h.library.pushes).toBe(WEEK.length);
    expect(dates(h)).toEqual(["2026-10-05", "2026-10-07", "2026-10-09"]);
  });
});
