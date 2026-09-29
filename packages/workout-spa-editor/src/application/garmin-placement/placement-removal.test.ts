import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPlacementHarness,
  D1,
  D2,
  LEDGER_KEY,
  type PlacementHarness,
} from "../../test-utils/placement-harness";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import type { BridgeFailure } from "./garmin-calendar-port";
import { dismissGarminRemovalEntry } from "./garmin-placement-actions";
import { dismissableEntries, isDismissable } from "./placement-dismiss";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const D3 = "2026-10-19";
const MOVES = [
  ["S", D2, "v1"],
  ["U", D2, "v2"],
] as const;
const DELETE_FAILURES: Array<[string, BridgeFailure]> = [
  ["500", { ok: false, status: 500 }],
  ["403", { ok: false, status: 403 }],
  ["timeout", { ok: false, delivered: false }],
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

const queueEntry = async (h: PlacementHarness, id: string) =>
  (await h.row())?.removalQueue?.find((e) => e.workoutScheduleId === id);

/** Places D1, then moves with every DELETE failing: the old id abandoned. */
const abandonOld = async (h: PlacementHarness) => {
  await h.push(D1);
  const oldId = h.calendar.items[0]!.id;
  h.calendar.scripts.unschedule.push(
    { ok: false, status: 500 },
    { ok: false, status: 500 },
    { ok: false, status: 500 }
  );
  await h.push(D2);
  await h.push(D2);
  await h.push(D2);
  return oldId;
};

describe("a failed DELETE leaves a reported duplicate (AC-23)", () => {
  const cases = MOVES.flatMap(([path, date, content]) =>
    DELETE_FAILURES.map(
      ([name, failure]) => [path, name, date, content, failure] as const
    )
  );

  it.each(cases)(
    "should keep both entries and name the old date [%s, %s]",
    async (_path, _name, date, content, failure) => {
      // Arrange
      const h = createPlacementHarness();
      await h.push(D1);
      const oldId = h.calendar.items[0]!.id;
      h.calendar.scripts.unschedule.push(failure);

      // Act
      const result = await h.push(date, content);
      const afterFailure = await queueEntry(h, oldId);
      const schedules = h.calendar.count("schedule");
      const unschedules = h.calendar.count("unschedule");
      const next = await h.push(date, content);

      // Assert
      expect(result).toEqual({ kind: "duplicate-left", dates: [D1] });
      expect(afterFailure).toMatchObject({ state: "retire", attempts: 1 });
      expect(await queueEntry(h, oldId)).toMatchObject({
        state: "gone",
        attempts: 1,
      });
      expect(next).toEqual({ kind: "unchanged" });
      expect(h.calendar.count("schedule")).toBe(schedules);
      expect(h.calendar.count("unschedule")).toBe(unschedules + 1);
      expect(h.calendar.items).toHaveLength(1);
    }
  );
});

describe("removal queue (AC-24)", () => {
  it("should abandon an entry after 3 failed attempts and stop sending it", async () => {
    // Arrange
    const h = createPlacementHarness();
    const oldId = await abandonOld(h);
    const unschedules = h.calendar.count("unschedule");

    // Act
    const result = await h.push(D2);

    // Assert
    expect(await queueEntry(h, oldId)).toMatchObject({
      state: "retire",
      attempts: 3,
      abandoned: true,
    });
    expect(h.calendar.count("unschedule")).toBe(unschedules);
    expect(result).toEqual({ kind: "duplicate-left", dates: [D1] });
  });

  it("should write gone when the re-check finds an abandoned entry absent", async () => {
    // Arrange
    const h = createPlacementHarness();
    const oldId = await abandonOld(h);
    h.calendar.items.splice(
      h.calendar.items.findIndex((i) => i.id === oldId),
      1
    );

    // Act
    const result = await h.push(D2);

    // Assert
    expect(await queueEntry(h, oldId)).toMatchObject({ state: "gone" });
    expect(result).toEqual({ kind: "unchanged" });
  });

  it("should dismiss an abandoned entry with 0 calls", async () => {
    // Arrange
    const h = createPlacementHarness();
    const oldId = await abandonOld(h);
    const calls = h.calendar.calls.length;

    // Act
    const dismissed = await dismissGarminRemovalEntry(
      h.deps,
      LEDGER_KEY.kaiordRecordId,
      oldId
    );

    // Assert
    expect(dismissed).toBe(true);
    expect(await queueEntry(h, oldId)).toMatchObject({ state: "gone" });
    expect(h.calendar.calls.length).toBe(calls);
  });

  it.each([
    ["verified absent", false, "gone"],
    ["still present", true, "retire"],
  ] as const)(
    "should follow the find on a 404 with A3 [%s]",
    async (_name, present, state) => {
      // Arrange
      const h = createPlacementHarness();
      await h.push(D1);
      const oldId = h.calendar.items[0]!.id;
      h.calendar.scripts.unschedule.push({ ok: false, status: 404 });
      if (!present) h.calendar.items.splice(0, 1);

      // Act
      await h.push(D2);

      // Assert
      expect(await queueEntry(h, oldId)).toMatchObject({
        state,
        attempts: present ? 1 : 0,
      });
    }
  );

  it("should count a 404 without A3 as an attempt", async () => {
    // Arrange
    const h = createPlacementHarness({ scheduleIdsInFind: false });
    await h.push(D1);
    const oldId = h.calendar.items[0]!.id;
    h.calendar.items.splice(0, 1);

    // Act
    await h.push(D2);

    // Assert
    expect(await queueEntry(h, oldId)).toMatchObject({
      state: "retire",
      attempts: 1,
    });
  });

  it("should keep a 401 without counting it and stop draining", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const oldId = h.calendar.items[0]!.id;
    h.calendar.scripts.unschedule.push({
      ok: false,
      status: 401,
      needsReauth: true,
    });

    // Act
    const result = await h.push(D2);

    // Assert
    expect(await queueEntry(h, oldId)).toMatchObject({
      state: "retire",
      attempts: 0,
    });
    expect(result).toEqual({ kind: "duplicate-left", dates: [D1] });
  });

  it("should re-check no abandoned entry after a 401", async () => {
    // Arrange
    const h = createPlacementHarness();
    const oldId = await abandonOld(h);
    h.calendar.scripts.unschedule.push({
      ok: false,
      status: 401,
      needsReauth: true,
    });
    const calls = h.calendar.calls.length;

    // Act
    await h.push(D3);

    // Assert
    expect(h.calendar.calls.slice(calls).map((c) => c.op)).toEqual([
      "schedule",
      "unschedule",
    ]);
    expect(await queueEntry(h, oldId)).toMatchObject({
      state: "retire",
      abandoned: true,
    });
  });

  it("should never send the current Placed to unschedule, whatever its state", async () => {
    // Arrange
    const h = createPlacementHarness();
    await h.push(D1);
    const current = h.calendar.items[0]!;
    await h.ledgerRepo.mutateByKey(
      LEDGER_KEY,
      (row) =>
        row && {
          ...row,
          removalQueue: (row.removalQueue ?? []).map((e) => ({
            ...e,
            state: "retire" as const,
          })),
        }
    );

    // Act
    await h.push(D1);

    // Assert
    expect(
      h.calendar.calls.filter(
        (c) => c.op === "unschedule" && c.id === current.id
      )
    ).toEqual([]);
  });
});

describe("dismiss eligibility (spec 6.2)", () => {
  const entry = (patch: Partial<GarminRemovalEntry>): GarminRemovalEntry => ({
    workoutScheduleId: "7" as never,
    workoutId: "9" as never,
    date: D1,
    attempts: 3,
    abandoned: true,
    state: "retire",
    ...patch,
  });
  const row = (queue: GarminRemovalEntry[], placement?: object) =>
    ({ removalQueue: queue, placement }) as never;

  it.each([
    ["an abandoned retire entry", entry({}), true],
    ["a held entry", entry({ state: "held" }), false],
    [
      "a held abandoned-flagged entry",
      entry({ state: "held", abandoned: true }),
      false,
    ],
    ["a gone entry", entry({ state: "gone" }), false],
    ["a retire entry still retrying", entry({ abandoned: false }), false],
  ])("should decide %s", (_name, e, expected) => {
    // Arrange
    const r = row([e]);

    // Act
    const eligible = isDismissable(r, e);

    // Assert
    expect(eligible).toBe(expected);
  });

  it("should never offer the current Placed or attempting.previous", () => {
    // Arrange
    const placed = {
      kind: "scheduled",
      workoutScheduleId: "7",
      workoutId: "9",
      date: D1,
    };
    const attempting = {
      kind: "attempting",
      workoutId: "9",
      date: D2,
      at: T0.toISOString(),
      posted: true,
      supersedes: [],
      previous: placed,
    };

    // Act
    const asPlaced = dismissableEntries(row([entry({})], placed));
    const asPrevious = dismissableEntries(row([entry({})], attempting));

    // Assert
    expect(asPlaced).toEqual([]);
    expect(asPrevious).toEqual([]);
  });
});
