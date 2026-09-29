import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPlacementHarness,
  D1,
  D2,
  LEDGER_KEY,
  preparePath,
  type PushPath,
} from "../../test-utils/placement-harness";
import type { BridgeFailure } from "./garmin-calendar-port";
import type { PlacementResult } from "./placement-result";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const MINUTE_MS = 60_000;
const LAST_THREE = 3;
const PATHS: PushPath[] = ["C", "U", "S"];
const DEFINITE: Array<[BridgeFailure, PlacementResult]> = [
  [
    { ok: false, status: 403 },
    { kind: "failed", reason: "schedule-rejected", retryable: false },
  ],
  [
    { ok: false, retryable: false, error: "invalid date" },
    { kind: "failed", reason: "schedule-rejected", retryable: false },
  ],
  [
    { ok: false, status: 401, needsReauth: true },
    { kind: "failed", reason: "needs-reauth", retryable: true },
  ],
  [
    { ok: false, needsReauth: true },
    { kind: "failed", reason: "needs-reauth", retryable: true },
  ],
  [
    { ok: false, retryable: true, error: "deadline-before-send" },
    { kind: "failed", reason: "deadline-before-send", retryable: true },
  ],
];
const CASES = PATHS.flatMap((path) =>
  DEFINITE.map(
    ([answer, result]) =>
      [
        path,
        answer.status ?? answer.error ?? "needsReauth",
        answer,
        result,
      ] as const
  )
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

describe("definite failures roll the claim back", () => {
  it.each(CASES)(
    "should restore the pre-claim row verbatim [%s, %s]",
    async (path, _name, answer, expected) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      h.calendar.scripts.schedule.push({ answer });
      vi.setSystemTime(T0.getTime() + MINUTE_MS);
      let preClaim: unknown;
      const push = h.library.pushes;
      const run = h.push(date, content, {
        onLibraryConfirmed: () => {
          preClaim = h.snapshot();
        },
      });

      // Act
      const result = await run;

      // Assert
      expect(result).toEqual(expected);
      expect(await h.row()).toStrictEqual(preClaim);
      expect(h.library.pushes - push).toBe(path === "S" ? 0 : 1);
    }
  );

  it("should restore previous with a stamped write when another writer touched the row", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const placed = (await h.row())?.placement;
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 400 } });
    h.calendar.state.beforeAnswer = async () => {
      await h.ledgerRepo.mutateByKey(
        LEDGER_KEY,
        (row) =>
          row && {
            ...row,
            removalQueue: [
              ...(row.removalQueue ?? []),
              {
                workoutScheduleId: "77" as never,
                workoutId: "1700000" as never,
                date: "2026-10-30",
                attempts: 0,
                abandoned: false,
                state: "held",
              },
            ],
          }
      );
    };
    vi.setSystemTime(T0.getTime() + MINUTE_MS);

    // Act
    await h.push(D2);

    // Assert
    const row = await h.row();
    expect(row?.placement).toEqual(placed);
    expect(row?.removalQueue?.map((e) => e.workoutScheduleId)).toContain("77");
    expect(row?.updatedAt).toBe(
      new Date(T0.getTime() + MINUTE_MS).toISOString()
    );
  });
  it("should keep a write that landed between the claim and the POST", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const placed = (await h.row())?.placement;
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 400 } });
    const mutate = h.ledgerRepo.mutateByKey.bind(h.ledgerRepo);
    let injected = false;
    h.ledgerRepo.mutateByKey = async (key, fn) => {
      const after = await mutate(key, fn);
      const claimed =
        after?.placement?.kind === "attempting" && !after.placement.posted;
      if (!claimed || injected) return after;
      injected = true;
      return mutate(
        key,
        (row) =>
          row && {
            ...row,
            removalQueue: [
              ...(row.removalQueue ?? []),
              {
                workoutScheduleId: "77" as never,
                workoutId: "1700000" as never,
                date: "2026-10-30",
                attempts: 0,
                abandoned: false,
                state: "held",
              },
            ],
          }
      );
    };
    vi.setSystemTime(T0.getTime() + MINUTE_MS);

    // Act
    await h.push(D2);

    // Assert
    const row = await h.row();
    expect(injected).toBe(true);
    expect(row?.placement).toEqual(placed);
    expect(row?.removalQueue?.map((e) => e.workoutScheduleId)).toContain("77");
  });
});

describe("schedule 404 (AC-32)", () => {
  it("should flag a library id from an earlier push as missing, then re-create it on the next push [S]", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const previous = (await h.row())?.placement;
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 404 } });
    const failedRun = await h.push(D2);
    const flagged = await h.row();

    // Act
    const result = await h.push(D2);

    // Assert
    expect(failedRun).toEqual({
      kind: "failed",
      reason: "library-missing",
      retryable: true,
    });
    expect(flagged).toMatchObject({
      forceRepush: true,
      library: { kind: "missing" },
      placement: previous,
    });
    expect(result).toEqual({ kind: "moved" });
    expect(h.library.pushes).toBe(2);
    expect((await h.row())?.forceRepush).toBeUndefined();
    expect(h.calendar.calls.slice(-LAST_THREE).map((c) => c.op)).toEqual([
      "schedule",
      "find",
      "unschedule",
    ]);
  });

  it.each(["C", "U"] as const)(
    "should fail schedule-endpoint without a flag for an id minted in this run [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      h.calendar.scripts.schedule.push({ answer: { ok: false, status: 404 } });

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toEqual({
        kind: "failed",
        reason: "schedule-endpoint",
        retryable: false,
      });
      expect((await h.row())?.forceRepush).toBeUndefined();
    }
  );

  it("should set forceRepush with 0 calendar calls for a legacy unconfirmed library, then recover", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.library.noId = true;
    const first = await h.push(D1);
    h.library.noId = false;

    // Act
    const second = await h.push(D1);

    // Assert
    expect(first).toEqual({
      kind: "failed",
      reason: "library-id-unknown",
      retryable: true,
    });
    expect(second).toEqual({ kind: "scheduled" });
    expect(h.library.pushes).toBe(2);
    expect(h.calendar.count("schedule")).toBe(1);
  });
});

describe("a 2xx without an id (AC-33)", () => {
  it("should store unconfirmed, and a later move adds an entry with no DELETE as duplicate-left", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.scripts.schedule.push({ noId: true });
    const first = await h.push(D1);
    const stored = (await h.row())?.placement;

    // Act
    const moved = await h.push(D2);

    // Assert
    expect(first).toEqual({ kind: "scheduled" });
    expect(stored).toEqual({
      kind: "unconfirmed",
      workoutId: "1700000",
      date: D1,
      supersedes: [],
    });
    expect(moved).toEqual({ kind: "duplicate-left", dates: [D1] });
    expect(h.calendar.count("unschedule")).toBe(0);
    expect(h.calendar.items).toHaveLength(2);
  });

  it("should copy the claim's supersedes into an id-less commit", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const known = (await h.row())?.removalQueue?.map(
      (e) => e.workoutScheduleId
    );
    h.calendar.scripts.schedule.push({ noId: true });

    // Act
    await h.push(D2);

    // Assert
    expect((await h.row())?.placement).toMatchObject({
      kind: "unconfirmed",
      date: D2,
      supersedes: known,
    });
  });
});
