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
import { POST_GATE_MS, SETTLE_MS } from "./placement-timing";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const D3 = "2026-10-19";
const PATHS: PushPath[] = ["C", "U", "S"];
const AMBIGUOUS: Array<[string, BridgeFailure]> = [
  [
    "delivered:false",
    { ok: false, delivered: false, error: "Extension did not respond" },
  ],
  ["deadline-exceeded", { ok: false, error: "deadline-exceeded" }],
  ["500", { ok: false, status: 500 }],
  ["502", { ok: false, status: 502 }],
  ["503", { ok: false, status: 503 }],
  ["504", { ok: false, status: 504 }],
];
const CASES = PATHS.flatMap((path) =>
  AMBIGUOUS.map(([name, answer]) => [path, name, answer] as const)
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

const expectedKind = (path: PushPath) => (path === "C" ? "scheduled" : "moved");

describe("ambiguous schedule, A3 true (AC-25)", () => {
  it.each(CASES)(
    "should adopt only the unknown entry [%s, %s]",
    async (path, _name, answer) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      const schedules = h.calendar.count("schedule");
      h.calendar.scripts.schedule.push({ answer, create: true });

      // Act
      const result = await h.push(date, content);

      // Assert
      const row = await h.row();
      const created = h.calendar.items.find(
        (i) => i.date === date && i.workoutId === row?.library?.workoutId
      );
      expect(result).toEqual({ kind: expectedKind(path) });
      expect(h.calendar.count("schedule")).toBe(schedules + 1);
      expect(row?.placement).toMatchObject({
        kind: "scheduled",
        workoutScheduleId: created?.id,
      });
      expect(h.calendar.items).toHaveLength(1);
    }
  );

  it.each(PATHS)(
    "should adopt the lowest of two unknown entries as duplicate-left, with no DELETE [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      const workoutId = path === "U" ? "1700001" : "1700000";
      const stray = h.calendar.mint(workoutId as never, date);
      const unschedules = h.calendar.count("unschedule");
      h.calendar.scripts.schedule.push({
        answer: { ok: false, status: 503 },
        create: true,
      });

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toEqual({ kind: "duplicate-left", dates: [date] });
      expect((await h.row())?.placement).toMatchObject({
        workoutScheduleId: stray,
      });
      expect(h.calendar.count("unschedule")).toBe(
        unschedules + (path === "C" ? 0 : 1)
      );
      expect(h.calendar.items.filter((i) => i.date === date)).toHaveLength(2);
    }
  );

  it("should never adopt a known entry the ledger retired at the date", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const retired = h.calendar.items[0]!.id;
    h.calendar.scripts.unschedule.push({ ok: false, status: 500 });
    await h.push(D2);
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 500 } });

    // Act
    const result = await h.push(D1);

    // Assert
    expect(result).toMatchObject({ kind: "failed", reason: "settling" });
    expect((await h.row())?.placement).toMatchObject({
      kind: "attempting",
      date: D1,
      posted: true,
    });
    expect(h.calendar.items.map((i) => i.id)).toContain(retired);
  });
});

describe("ambiguous schedule, A3 false (AC-26)", () => {
  it.each(PATHS)(
    "should stay uncertain on a count of 0, with 1 schedule even after the gate [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness({ scheduleIdsInFind: false });
      const { date, content } = await preparePath(h, path);
      const schedules = h.calendar.count("schedule");
      h.calendar.scripts.schedule.push({ answer: { ok: false, status: 500 } });
      const first = await h.push(date, content);
      vi.setSystemTime(Date.now() + POST_GATE_MS);

      // Act
      const second = await h.push(date, content);

      // Assert
      expect(first).toMatchObject({
        kind: "uncertain",
        date,
        canConfirm: true,
      });
      expect(second).toMatchObject({ kind: "uncertain", date });
      expect(h.calendar.count("schedule")).toBe(schedules + 1);
    }
  );

  it.each(PATHS)(
    "should adopt one id-less entry as unconfirmed with supersedes [] and delete nothing behind it [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      h.calendar.state.hideIds = true;
      h.calendar.scripts.schedule.push({
        answer: { ok: false, status: 500 },
        create: true,
      });

      // Act
      const result = await h.push(date, content);

      // Assert: an unconfirmed Placed cannot be verified, so a previous
      // entry stays behind undeleted (verify before delete).
      expect(result).toEqual(
        path === "C"
          ? { kind: "scheduled" }
          : { kind: "duplicate-left", dates: [D1] }
      );
      expect(h.calendar.count("unschedule")).toBe(0);
      expect((await h.row())?.placement).toMatchObject({
        kind: "unconfirmed",
        date,
        supersedes: [],
      });
    }
  );

  it.each(PATHS)(
    "should adopt two id-less entries as duplicate-left [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      h.calendar.mint((path === "U" ? "1700001" : "1700000") as never, date);
      h.calendar.state.hideIds = true;
      h.calendar.scripts.schedule.push({
        answer: { ok: false, status: 500 },
        create: true,
      });

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toMatchObject({ kind: "duplicate-left" });
      expect((await h.row())?.placement).toMatchObject({
        kind: "unconfirmed",
        date,
      });
    }
  );

  it.each(PATHS)(
    "should stay uncertain when a queued non-keep entry shares workout and date [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      const workoutId = path === "U" ? "1700001" : "1700000";
      h.calendar.state.beforeAnswer = async () => {
        await h.ledgerRepo.mutateByKey(
          LEDGER_KEY,
          (row) =>
            row && {
              ...row,
              removalQueue: [
                ...(row.removalQueue ?? []),
                {
                  workoutScheduleId: "42" as never,
                  workoutId: workoutId as never,
                  date,
                  attempts: 0,
                  abandoned: false,
                  state: "held",
                },
              ],
            }
        );
      };
      h.calendar.state.hideIds = true;
      h.calendar.scripts.schedule.push({
        answer: { ok: false, status: 500 },
        create: true,
      });

      // Act
      const result = await h.push(date, content);

      // Assert
      expect(result).toMatchObject({
        kind: "uncertain",
        date,
        canConfirm: false,
      });
      expect((await h.row())?.placement).toMatchObject({
        kind: "attempting",
        posted: true,
      });
    }
  );
});

describe("absent in the same run, A3 true (AC-27, AC-28)", () => {
  it.each(PATHS)(
    "should settle without a second schedule, then re-POST only after the gate [%s]",
    async (path) => {
      // Arrange
      const h = createPlacementHarness();
      const { date, content } = await preparePath(h, path);
      const schedules = h.calendar.count("schedule");
      h.calendar.scripts.schedule.push({
        answer: { ok: false, delivered: false },
      });
      const postedAt = Date.now();

      // Act
      const first = await h.push(date, content);
      const early = await h.push(date, content);
      vi.setSystemTime(postedAt + POST_GATE_MS);
      const late = await h.push(date, content);

      // Assert
      const retry = {
        kind: "failed",
        reason: "settling",
        retryable: true,
        retryAfter: postedAt + POST_GATE_MS,
      };
      expect(first).toEqual(retry);
      expect(early).toEqual(retry);
      expect(late).toEqual({ kind: expectedKind(path) });
      expect(h.calendar.count("schedule")).toBe(schedules + 2);
      expect(h.calendar.items.filter((i) => i.date === date)).toHaveLength(1);
    }
  );

  it("should adopt a POST that Garmin committed after the bridge's abort", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.scripts.schedule.push({
      answer: { ok: false, error: "deadline-exceeded" },
    });
    const first = await h.push(D1);
    const late = h.calendar.mint("1700000" as never, D1);
    vi.setSystemTime(T0.getTime() + POST_GATE_MS);

    // Act
    const result = await h.push(D1);

    // Assert
    expect(first).toMatchObject({ kind: "failed", reason: "settling" });
    expect(result).toEqual({ kind: "scheduled" });
    expect((await h.row())?.placement).toMatchObject({
      workoutScheduleId: late,
    });
    expect(h.calendar.count("schedule")).toBe(1);
    expect(h.calendar.items).toHaveLength(1);
  });

  it("should read after SETTLE_MS in the same run", async () => {
    // Arrange
    const h = createPlacementHarness();
    const readAt: number[] = [];
    const find = h.calendar.port.find;
    h.calendar.port.find = (w, d) => {
      readAt.push(Date.now());
      return find(w, d);
    };
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 502 } });

    // Act
    await h.push(D1);

    // Assert
    expect(readAt).toEqual([T0.getTime() + SETTLE_MS]);
  });
});

describe("leftover attempting from a closed tab (AC-29)", () => {
  const leave = async (posted: boolean) => {
    const h = createPlacementHarness();
    await h.push(D1);
    await h.ledgerRepo.mutateByKey(
      LEDGER_KEY,
      (row) =>
        row && {
          ...row,
          placement: {
            kind: "attempting",
            workoutId: "1700000" as never,
            date: "2026-10-12",
            at: T0.toISOString(),
            posted,
            supersedes: [],
            previous: row.placement as never,
          },
        }
    );
    return h;
  };

  it("should re-claim a posted:false leftover with 1 schedule and no leftover read", async () => {
    // Arrange
    const h = await leave(false);
    const calls = h.calendar.calls.length;

    // Act
    const result = await h.push("2026-10-12");

    // Assert
    expect(result).toEqual({ kind: "moved" });
    expect(h.calendar.calls.slice(calls).map((c) => c.op)).toEqual([
      "schedule",
      "find",
      "unschedule",
    ]);
  });

  it("should read a posted:true leftover before any POST, gated", async () => {
    // Arrange
    const h = await leave(true);
    const calls = h.calendar.calls.length;

    // Act
    const early = await h.push("2026-10-12");
    vi.setSystemTime(T0.getTime() + POST_GATE_MS);
    const late = await h.push("2026-10-12");

    // Assert
    expect(early).toMatchObject({ kind: "failed", reason: "settling" });
    expect(late).toEqual({ kind: "moved" });
    expect(h.calendar.calls.slice(calls).map((c) => c.op)).toEqual([
      "find",
      "find",
      "schedule",
      "find",
      "unschedule",
    ]);
  });

  it.each([
    ["the same library workout", "v1", "1700000"],
    ["a re-created library workout", "v2", "1700001"],
  ])(
    "should place the desired date, not the leftover's, once absence is proven [%s]",
    async (_name, content, workoutId) => {
      // Arrange
      const h = await leave(true);
      const calls = h.calendar.calls.length;
      vi.setSystemTime(T0.getTime() + POST_GATE_MS);

      // Act
      const result = await h.push(D3, content);

      // Assert
      const schedules = h.calendar.calls
        .slice(calls)
        .filter((c) => c.op === "schedule");
      expect(result).toEqual({ kind: "moved" });
      expect(schedules).toEqual([{ op: "schedule", workoutId, date: D3 }]);
      expect((await h.row())?.placement).toMatchObject({
        kind: "scheduled",
        workoutId,
        date: D3,
      });
      expect(h.calendar.items).toMatchObject([{ workoutId, date: D3 }]);
    }
  );
});
