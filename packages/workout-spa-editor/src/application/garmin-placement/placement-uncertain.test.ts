import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALL_FEATURES,
  createPlacementHarness,
  D1,
  D2,
  LEDGER_KEY,
  type PlacementHarness,
} from "../../test-utils/placement-harness";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { confirmGarminPlacement } from "./garmin-placement-actions";
import { CALENDAR_WRITE_FEATURE, POST_GATE_MS } from "./placement-timing";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const W = "1700000" as never;
const D3 = "2026-10-20";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

const held = (id: string, date: string): GarminRemovalEntry => ({
  workoutScheduleId: id as never,
  workoutId: W,
  date,
  attempts: 0,
  abandoned: false,
  state: "held",
});

/** A record whose row a merge left `uncertain` at D2, with `queue` added;
    its first entry (D1) is already gone from Garmin and the queue. */
const uncertainAt = async (
  h: PlacementHarness,
  queue: GarminRemovalEntry[],
  withPrevious = false
) => {
  await h.push(D1);
  const placed = (await h.row())?.placement;
  if (!withPrevious)
    h.calendar.items.splice(
      h.calendar.items.findIndex((i) => i.date === D1),
      1
    );
  await h.ledgerRepo.mutateByKey(
    LEDGER_KEY,
    (row) =>
      row && {
        ...row,
        placement: withPrevious
          ? {
              kind: "uncertain",
              workoutId: W,
              date: D2,
              previous: placed as never,
            }
          : { kind: "uncertain", workoutId: W, date: D2 },
        removalQueue: [
          ...(row.removalQueue ?? []).map((e) => ({
            ...e,
            state: withPrevious ? e.state : ("gone" as const),
          })),
          ...queue,
        ],
      }
  );
};

const states = async (h: PlacementHarness) =>
  Object.fromEntries(
    ((await h.row())?.removalQueue ?? []).map((e) => [
      e.workoutScheduleId,
      e.state,
    ])
  );

describe("resolving uncertain by reading the calendar (T5, spec 6.4)", () => {
  it("should adopt the one match, keep a seen held id, and write an unseen one gone", async () => {
    // Arrange
    const h = createPlacementHarness();
    const s1 = h.calendar.mint(W, D3);
    const s2 = h.calendar.mint(W, D2);
    await uncertainAt(h, [held(s1, D3), held(s2, D2), held("4", "2026-11-03")]);

    // Act
    const result = await h.push(D2);

    // Assert
    expect(result).toEqual({ kind: "scheduled" });
    expect((await h.row())?.placement).toEqual({
      kind: "scheduled",
      workoutScheduleId: s2,
      workoutId: W,
      date: D2,
    });
    expect(await states(h)).toMatchObject({
      [s1]: "held",
      [s2]: "keep",
      "4": "gone",
    });
    expect(h.calendar.count("unschedule")).toBe(0);
    expect(h.calendar.count("find")).toBe(2);
  });

  it("should retire and drain a scheduled previous of the uncertain", async () => {
    // Arrange
    const h = createPlacementHarness();
    const s2 = h.calendar.mint(W, D2);
    await uncertainAt(h, [], true);
    const previousId = h.calendar.items.find((i) => i.date === D1)!.id;

    // Act
    const result = await h.push(D2);

    // Assert
    expect(result).toEqual({ kind: "scheduled" });
    expect(await states(h)).toMatchObject({
      [s2]: "keep",
      [previousId]: "gone",
    });
    expect(h.calendar.items.map((i) => i.id)).toEqual([s2]);
  });

  it("should report several matches as duplicate-left with every state unchanged", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.mint(W, D2);
    h.calendar.mint(W, D2);
    await uncertainAt(h, []);
    const before = await h.row();

    // Act
    const result = await h.push(D2);

    // Assert
    expect(result).toEqual({ kind: "duplicate-left", dates: [D2] });
    expect(await h.row()).toStrictEqual(before);
  });

  it.each([
    ["no match", false],
    ["a failed read", true],
  ])(
    "should stay uncertain on %s with every state unchanged",
    async (_name, failRead) => {
      // Arrange
      const h = createPlacementHarness();
      await uncertainAt(h, [held("6", D2)]);
      if (failRead) h.calendar.scripts.find.push({ ok: false, status: 500 });
      const before = await h.row();

      // Act
      const result = await h.push(D2);

      // Assert
      expect(result).toEqual({
        kind: "uncertain",
        date: D2,
        canConfirm: false,
      });
      expect(await h.row()).toStrictEqual(before);
      expect(h.calendar.count("schedule")).toBe(1);
    }
  );

  it("should adopt a single id-less match as unconfirmed and write no held id gone", async () => {
    // Arrange
    const h = createPlacementHarness();
    h.calendar.mint(W, D2);
    await uncertainAt(h, [held("4", "2026-11-03")]);
    h.calendar.state.hideIds = true;

    // Act
    await h.push(D2);

    // Assert
    expect((await h.row())?.placement).toEqual({
      kind: "unconfirmed",
      workoutId: W,
      date: D2,
      supersedes: [],
    });
    expect(await states(h)).toMatchObject({ "4": "held" });
  });

  it("should claim at once on Send anyway for a merged uncertain", async () => {
    // Arrange
    const h = createPlacementHarness();
    await uncertainAt(h, [held("6", D2)]);

    // Act
    const result = await h.push(D2, "v1", { sendAnyway: true });

    // Assert
    expect(result).toEqual({ kind: "scheduled" });
    expect(h.calendar.count("schedule")).toBe(2);
    expect(await states(h)).toMatchObject({ "6": "held" });
  });
});

describe("a sync between the POST and the commit (spec 6.4)", () => {
  it("should leave another device's adoption of the new entry out of supersedes", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const listed = (await h.row())?.removalQueue?.map(
      (e) => e.workoutScheduleId
    );
    h.calendar.scripts.schedule.push({ noId: true });
    h.calendar.state.beforeAnswer = async () => {
      const minted = h.calendar.items.at(-1)!;
      await h.ledgerRepo.mutateByKey(
        LEDGER_KEY,
        (row) =>
          row && {
            ...row,
            removalQueue: [
              ...(row.removalQueue ?? []),
              { ...held(minted.id, minted.date), state: "keep" },
            ],
          }
      );
    };

    // Act
    await h.push(D2);

    // Assert
    const placement = (await h.row())?.placement;
    expect(placement).toMatchObject({
      kind: "unconfirmed",
      date: D2,
      supersedes: listed,
    });
    expect(
      placement?.kind === "unconfirmed" && placement.supersedes
    ).not.toContain(h.calendar.items.at(-1)!.id);
  });
});

describe("a bridge with calendar-write but no find (AC-34)", () => {
  const writeOnly = () =>
    createPlacementHarness({ features: [CALENDAR_WRITE_FEATURE] });

  it("should report an ambiguous POST as uncertain with the gate as sendAfter", async () => {
    // Arrange
    const h = writeOnly();
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 500 } });

    // Act
    const result = await h.push(D1);

    // Assert
    expect(result).toEqual({
      kind: "uncertain",
      date: D1,
      canConfirm: true,
      sendAfter: T0.getTime() + POST_GATE_MS,
    });
    expect(h.calendar.count("find")).toBe(0);
  });

  it("should store It's in Garmin as unconfirmed with supersedes []", async () => {
    // Arrange
    const h = writeOnly();
    h.calendar.scripts.schedule.push({
      answer: { ok: false, status: 500 },
      create: true,
    });
    await h.push(D1);
    const calls = h.calendar.calls.length;
    vi.setSystemTime(T0.getTime() + POST_GATE_MS);

    // Act
    const result = await confirmGarminPlacement(
      h.deps,
      LEDGER_KEY.kaiordRecordId
    );

    // Assert
    expect(result).toEqual({ kind: "scheduled" });
    expect((await h.row())?.placement).toEqual({
      kind: "unconfirmed",
      workoutId: W,
      date: D1,
      supersedes: [],
    });
    expect(h.calendar.calls.length).toBe(calls);
  });

  it("should refuse It's in Garmin before the gate of a posted attempt and write nothing", async () => {
    // Arrange
    const h = writeOnly();
    await h.push(D1);
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 500 } });
    const movedAt = Date.now();
    await h.push(D2);
    const before = await h.row();
    const calls = h.calendar.calls.length;

    // Act
    const result = await confirmGarminPlacement(
      h.deps,
      LEDGER_KEY.kaiordRecordId
    );

    // Assert
    expect(result).toEqual({
      kind: "failed",
      reason: "settling",
      retryable: true,
      retryAfter: movedAt + POST_GATE_MS,
    });
    expect(await h.row()).toEqual(before);
    expect(h.calendar.calls.length).toBe(calls);
    expect(h.calendar.items).toMatchObject([{ date: D1 }]);
  });

  it("should refuse It's in Garmin while a non-keep entry shares the workout and date", async () => {
    // Arrange
    const h = createPlacementHarness();
    await uncertainAt(h, [held("6", D2)]);

    // Act
    const result = await confirmGarminPlacement(
      h.deps,
      LEDGER_KEY.kaiordRecordId
    );

    // Assert
    expect(result).toEqual({ kind: "uncertain", date: D2, canConfirm: false });
    expect((await h.row())?.placement?.kind).toBe("uncertain");
  });

  it("should send anyway only after the gate, with 1 more schedule", async () => {
    // Arrange
    const h = writeOnly();
    h.calendar.scripts.schedule.push({ answer: { ok: false, status: 500 } });
    await h.push(D1);

    // Act
    const early = await h.push(D1, "v1", { sendAnyway: true });
    vi.setSystemTime(T0.getTime() + POST_GATE_MS);
    const late = await h.push(D1, "v1", { sendAnyway: true });

    // Assert
    expect(early).toMatchObject({ kind: "uncertain" });
    expect(late).toEqual({ kind: "scheduled" });
    expect(h.calendar.count("schedule")).toBe(2);
  });

  it("should delete nothing and count nothing without a find", async () => {
    // Arrange
    const h = writeOnly();
    await h.push(D1);
    const oldId = h.calendar.items[0]!.id;

    // Act
    await h.push(D2);

    // Assert
    expect(h.calendar.count("unschedule")).toBe(0);
    expect(
      (await h.row())?.removalQueue?.find((e) => e.workoutScheduleId === oldId)
    ).toMatchObject({ state: "retire", attempts: 0 });
    expect(h.calendar.count("find")).toBe(0);
    expect(ALL_FEATURES).toContain(CALENDAR_WRITE_FEATURE);
  });
});
