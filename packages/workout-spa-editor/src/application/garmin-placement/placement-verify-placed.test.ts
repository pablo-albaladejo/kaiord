/**
 * Verify before delete (design §3.5): a proof of absence counts only when a
 * second read `SETTLE_MS` later repeats it, the run's own fresh POST is
 * never judged dead, and every `unschedule` has its own verifying read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPlacementHarness,
  D1,
  D2,
  LEDGER_KEY,
  type PlacementHarness,
} from "../../test-utils/placement-harness";
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { PlacementRun } from "./placement-deps";
import { drainQueue } from "./placement-removal-step";
import { SETTLE_MS } from "./placement-timing";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const D3 = "2026-10-19";
const NEXT_MONTH = "2026-11-03";
const SERVER_ERROR = { ok: false, status: 500 } as const;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

const queueEntry = async (h: PlacementHarness, id: string) =>
  (await h.row())?.removalQueue?.find((e) => e.workoutScheduleId === id);

const idOn = (h: PlacementHarness, date: string) =>
  h.calendar.items.find((i) => i.date === date)!.id;

/** Every find after the first that shows `date`'s entry misses it. */
const missAfterFirstSight = (h: PlacementHarness, date: string) => {
  const find = h.calendar.port.find;
  let sighted = false;
  h.calendar.port.find = async (workoutId, at) => {
    const read = await find(workoutId, at);
    const id = h.calendar.items.find((i) => i.date === date)?.id;
    if (!read.ok || !id) return read;
    const shows = read.entries.some((e) => e.workoutScheduleId === id);
    if (shows && !sighted) {
      sighted = true;
      return read;
    }
    const entries = read.entries.filter((e) => e.workoutScheduleId !== id);
    return { ok: true, entries };
  };
};

describe("a proof of absence is read twice (N1)", () => {
  it("should drain behind a fresh POST that a lagging first read misses", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const oldId = idOn(h, D1);
    h.calendar.state.lagMs = SETTLE_MS;

    // Act
    const result = await h.push(D2);

    // Assert
    const placedId = idOn(h, D2);
    expect(result).toEqual({ kind: "moved" });
    expect(h.calendar.items.map((i) => i.id)).toEqual([placedId]);
    expect(await queueEntry(h, placedId)).toMatchObject({ state: "keep" });
    expect(await queueEntry(h, oldId)).toMatchObject({ state: "gone" });
    expect((await h.row())?.placement).toMatchObject({ kind: "scheduled" });
  });

  it("should turn an adopted Placed gone and uncertain when both reads miss it", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const oldId = idOn(h, D1);
    h.calendar.scripts.schedule.push({ answer: SERVER_ERROR, create: true });
    missAfterFirstSight(h, D2);

    // Act
    const result = await h.push(D2);

    // Assert
    const adoptedId = idOn(h, D2);
    expect(result).toMatchObject({ kind: "uncertain", date: D2 });
    expect(h.calendar.count("unschedule")).toBe(0);
    expect(await queueEntry(h, adoptedId)).toMatchObject({ state: "gone" });
    expect(await queueEntry(h, oldId)).toMatchObject({ state: "retire" });
    expect((await h.row())?.placement).toMatchObject({
      kind: "uncertain",
      date: D2,
    });
  });

  it("should never write its own fresh POST gone, even when both reads miss it", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const oldId = idOn(h, D1);
    h.calendar.port.find = async () => ({ ok: true, entries: [] });

    // Act
    const result = await h.push(D2);

    // Assert
    const placedId = idOn(h, D2);
    expect(result).toEqual({ kind: "duplicate-left", dates: [D1] });
    expect(h.calendar.count("unschedule")).toBe(0);
    expect(await queueEntry(h, placedId)).toMatchObject({ state: "keep" });
    expect(await queueEntry(h, oldId)).toMatchObject({
      state: "retire",
      attempts: 0,
    });
    expect((await h.row())?.placement).toMatchObject({
      kind: "scheduled",
      workoutScheduleId: placedId,
    });
  });
});

describe("a placement moved inside Garmin (N3, documented behaviour)", () => {
  it("should read a Placed dragged to another month as deleted and send nothing", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    h.calendar.scripts.unschedule.push(SERVER_ERROR);
    await h.push(D2);
    const placedId = idOn(h, D2);
    const unschedules = h.calendar.count("unschedule");
    h.calendar.items.find((i) => i.id === placedId)!.date = NEXT_MONTH;

    // Act
    const result = await h.push(D2);

    // Assert
    expect(result).toMatchObject({ kind: "uncertain", date: D2 });
    expect(h.calendar.count("unschedule")).toBe(unschedules);
    expect(await queueEntry(h, placedId)).toMatchObject({ state: "gone" });
    expect(h.calendar.items).toHaveLength(2);
  });
});

describe("a verifying read before each delete (N2)", () => {
  it("should read the Placed again before every unschedule", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    h.calendar.scripts.unschedule.push(SERVER_ERROR);
    await h.push(D2);
    h.calendar.scripts.unschedule.push(SERVER_ERROR, SERVER_ERROR);
    await h.push(D3);
    const from = h.calendar.calls.length;

    // Act
    await h.push(D3);

    // Assert
    const ops = h.calendar.calls.slice(from).map((c) => c.op);
    expect(ops).toEqual(["find", "unschedule", "find", "unschedule"]);
    expect(h.calendar.items.map((i) => i.date)).toEqual([D3]);
  });

  it("should still let two concurrent drains of a crossed pair empty the calendar (known residual L2, until conditional sync lands; design §3.9)", async () => {
    // Arrange
    // A holds Placed Y with X retire; B holds Placed X with Y retire. A
    // crossed pair forms only through the sync residuals of §3.9;
    // the conditional-sync follow-up (import only after an accepted push)
    // closes this. Until then the read and the delete are two calls.
    const a = createPlacementHarness();
    await a.push(D1);
    a.calendar.scripts.unschedule.push(SERVER_ERROR);
    await a.push(D2);
    const rowA = (await a.row())!;
    const placedA = rowA.placement as GarminPlaced & { kind: "scheduled" };
    const x = idOn(a, D1);
    const b = createPlacementHarness();
    const placedB = { ...placedA, workoutScheduleId: x, date: D1 };
    await b.ledgerRepo.mutateByKey(LEDGER_KEY, () => ({
      ...rowA,
      placement: placedB,
      removalQueue: rowA.removalQueue!.map((e) => ({
        ...e,
        state: e.workoutScheduleId === x ? "keep" : "retire",
      })),
    }));
    const shared = a.calendar.port;
    let finds = 0;
    let release!: () => void;
    const bothRead = new Promise<void>((resolve) => (release = resolve));
    const gated = {
      ...shared,
      find: async (...args: Parameters<typeof shared.find>) => {
        const read = await shared.find(...args);
        if (++finds === 2) release();
        return read;
      },
      unschedule: async (id: Parameters<typeof shared.unschedule>[0]) => {
        await bothRead;
        return shared.unschedule(id);
      },
    };
    const runOf = (h: PlacementHarness, placed: GarminPlaced) =>
      ({
        deps: { ...h.deps, calendar: gated, canFind: true },
        key: LEDGER_KEY,
        desired: { workoutId: placed.workoutId, date: placed.date },
        minted: false,
        sendAnyway: false,
      }) as PlacementRun;

    // Act
    await Promise.all([
      drainQueue(runOf(a, placedA), placedA),
      drainQueue(runOf(b, placedB), placedB),
    ]);

    // Assert
    expect(a.calendar.items).toEqual([]);
  });
});
