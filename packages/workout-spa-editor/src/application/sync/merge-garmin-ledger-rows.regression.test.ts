/**
 * Review round 2 regressions, replayed through the `exportLedger` hook (its
 * `normalize` included) exactly as a cloud sync runs it. The rows are the
 * architect's probes verbatim, in the shape the round-1 model wrote (queue
 * entries with no `state`), so each history also runs against that model:
 * its drain sent every entry that was not `held` and dequeued it; this
 * model's drain sends only `retire` entries and writes `gone`.
 */
import { describe, expect, it } from "vitest";

import { mergeTableRows } from "./merge-table-rows";

type Row = Record<string, unknown>;
type Entry = { workoutScheduleId: string; state?: string; held?: true };
type Device = { row: Row; calendar: Set<string> };

const W = "1707805999";
const D1 = "2026-09-29";
const D2 = "2026-09-30";
const D0 = "2026-09-20";
const ROUNDS = 3;

const scheduled = (id: string, date: string) => ({
  kind: "scheduled",
  workoutScheduleId: id,
  workoutId: W,
  date,
});
const legacy = (id: string, date: string, held = false) => ({
  workoutScheduleId: id,
  workoutId: W,
  date,
  attempts: 0,
  abandoned: false,
  ...(held ? { held: true } : {}),
});
const row = (id: string, updatedAt: string, garmin: Row): Row => ({
  id,
  kaiordRecordId: "a0000000-0000-4000-8000-000000000001",
  dataType: "workout",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: W,
  contentHash: "hash",
  exportedAt: "2026-09-01T00:00:00.000Z",
  updatedAt,
  library: { kind: "confirmed", workoutId: W },
  ...garmin,
});

const merge = (x: Row, y: Row) =>
  mergeTableRows("exportLedger", [x, y], new Map())[0];

const queueOf = (r: Row) => (r.removalQueue as Entry[] | undefined) ?? [];

/** Whether the drain of the model that wrote `e` would send it. */
const drainable = (e: Entry) =>
  e.state === undefined ? !e.held : e.state === "retire";

/** Drains `device` against the shared Garmin `calendar`. */
const drain = (device: Device, calendar: Set<string>) => {
  const kept: Entry[] = [];
  for (const e of queueOf(device.row)) {
    if (!drainable(e)) kept.push(e);
    else {
      calendar.delete(e.workoutScheduleId);
      if (e.state) kept.push({ ...e, state: "gone" });
    }
  }
  device.row = { ...device.row, removalQueue: kept };
};

/** One `syncWithCloud`: snapshot merge, then the live merge. */
const sync = (device: Device, cloud: { row?: Row }) => {
  const snapshot = cloud.row ? merge(device.row, cloud.row) : device.row;
  device.row = merge(device.row, snapshot);
  cloud.row = snapshot;
};

const placedId = (r: Row) =>
  (r.placement as { workoutScheduleId?: string } | undefined)
    ?.workoutScheduleId;

describe("mergeGarminLedgerRows round-2 regressions", () => {
  it("should keep an adoption through every device's sync (probe2, H2)", () => {
    // Arrange
    const calendar = new Set(["1", "2"]);
    const stale = row("id-b", "2026-09-28T08:00:00.000Z", {
      placement: { kind: "uncertain", workoutId: W, date: D2 },
      removalQueue: [legacy("1", D1, true), legacy("2", D2, true)],
    });
    const adopter: Device = {
      row: row("id-b", "2026-09-29T08:00:00.000Z", {
        placement: scheduled("2", D2),
        removalQueue: [legacy("1", D1)],
      }),
      calendar,
    };
    const other: Device = { row: stale, calendar };
    const cloud = { row: stale };

    // Act
    for (let round = 0; round < ROUNDS; round++)
      for (const device of [adopter, other]) {
        sync(device, cloud);
        drain(device, calendar);
      }

    // Assert
    expect(placedId(adopter.row)).toBe("2");
    expect(other.row).toStrictEqual(adopter.row);
    expect([...calendar]).toContain("2");
  });

  it("should never let a stale Placed release held ids to the drain (probe3, H1)", () => {
    // Arrange
    const calendar = new Set(["1", "2"]);
    const offline: Device = {
      row: row("id-c", "2026-09-10T00:00:00.000Z", {
        placement: scheduled("100", D0),
        removalQueue: [],
      }),
      calendar,
    };
    const cloud = {
      row: row("id-b", "2026-09-28T08:00:00.000Z", {
        placement: { kind: "uncertain", workoutId: W, date: D2 },
        removalQueue: [legacy("1", D1, true), legacy("2", D2, true)],
      }),
    };

    // Act
    sync(offline, cloud);
    drain(offline, calendar);

    // Assert
    expect(calendar.size).toBeGreaterThan(0);
  });

  it("should never drain an unverified legacy entry before a newer live Placed wins (normal<keep repro)", () => {
    // Arrange
    const calendar = new Set(["1", "2"]);
    const a: Device = {
      row: row("id-a", "2026-09-27T08:00:00.000Z", {
        placement: scheduled("2", D2),
        removalQueue: [legacy("1", D1)],
      }),
      calendar,
    };
    const b: Device = {
      row: row("id-b", "2026-09-28T08:00:00.000Z", {
        placement: scheduled("1", D1),
      }),
      calendar,
    };
    const cloud: { row?: Row } = {};
    const live: boolean[] = [];

    // Act
    for (const device of [a, b, a, b]) {
      sync(device, cloud);
      drain(device, calendar);
      live.push(calendar.size > 0);
    }

    // Assert
    expect(live).toEqual([true, true, true, true]);
    expect(a.row).toStrictEqual(b.row);
    expect(calendar).toContain(placedId(a.row));
  });

  it("should keep a device's own id-less placement back at an earlier date (L)", () => {
    // Arrange
    const x = row("id-a", "2026-09-28T08:00:00.000Z", {
      placement: {
        kind: "unconfirmed",
        workoutId: W,
        date: D1,
        supersedes: ["1", "2"],
      },
      removalQueue: [
        { ...legacy("1", D1), state: "gone" },
        { ...legacy("2", D2), state: "retire" },
      ],
    });

    // Act
    const self = merge(x, x);
    const again = merge(x, self);

    // Assert
    expect(self).toStrictEqual(x);
    expect(again).toStrictEqual(x);
  });
});
