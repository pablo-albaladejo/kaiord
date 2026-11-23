/**
 * Safe writes to Garmin at the message contract, for the entries Kaiord did
 * not create and for a calendar read that is not reliable: an entry the
 * athlete placed may be recognised but is never moved or deleted; a read
 * that leaves out a live entry never ends in two entries of one Workout.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../adapters/dexie/dexie-database";
import { createMessageSeamConnector } from "../test-utils/message-seam-placement";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const TEMPO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const D1 = "2026-10-06";
const D2 = "2026-10-13";
const D3 = "2026-10-20";
const OCT_LAST = "2026-10-31";
const NOV_FIRST = "2026-11-01";
/** Two settled reads leave the entry out: confirmed absent. */
const OMIT_UNTIL_CLAIM = 2;
/** The read before the POST leaves it out too: a second entry is posted. */
const OMIT_PAST_POST = 3;

let db: KaiordDatabase;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db = new KaiordDatabase(`kaiord-test-ownership-${Math.random()}`);
  await db.open();
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  db.close();
  await Dexie.delete(db.name);
});

type Connector = ReturnType<typeof createMessageSeamConnector>;

const entries = (c: Connector) =>
  c.garmin.calendar
    .filter((i) => i.itemType === "workout")
    .map((i) => ({ id: i.id, date: i.date }))
    .sort((x, y) => x.date.localeCompare(y.date) || x.id - y.id);

const unscheduled = (c: Connector) =>
  c.garmin.log
    .filter((m) => m.action === "unschedule")
    .map((m) => Number(m.scheduleId));

describe("an entry the athlete placed of the same library workout", () => {
  it("should never be moved or deleted when the Workout moves on", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const { workoutId } = c.garmin.library[0];
    const athletes = c.garmin.athlete.placeLibraryWorkout(workoutId, D2);

    // Act
    const toD2 = await c.send(TEMPO, D2, "Tempo");
    const toD3 = await c.send(TEMPO, D3, "Tempo");
    const again = await c.send(TEMPO, D3, "Tempo");

    // Assert
    expect(toD2.kind).toBe("moved");
    expect(toD3).toEqual({ kind: "foreign-left", dates: [D2] });
    expect(again.kind).toBe("unchanged");
    expect(entries(c).map((e) => e.date)).toEqual([D2, D3]);
    expect(entries(c).find((e) => e.date === D2)?.id).toBe(athletes);
    expect(unscheduled(c)).not.toContain(athletes);
  });

  it("should post no duplicate on the date it is recognised on", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const { workoutId } = c.garmin.library[0];
    c.garmin.athlete.placeLibraryWorkout(workoutId, D2);

    // Act
    await c.send(TEMPO, D2, "Tempo");

    // Assert
    expect(c.garmin.count("schedule")).toBe(1);
    expect(entries(c).map((e) => e.date)).toEqual([D2]);
  });

  it("should stay where it is when the Workout moves on across a month boundary", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const { workoutId } = c.garmin.library[0];
    const athletes = c.garmin.athlete.placeLibraryWorkout(workoutId, OCT_LAST);
    await c.send(TEMPO, OCT_LAST, "Tempo");

    // Act
    const moved = await c.send(TEMPO, NOV_FIRST, "Tempo");

    // Assert
    expect(moved).toEqual({ kind: "foreign-left", dates: [OCT_LAST] });
    expect(entries(c).map((e) => e.date)).toEqual([OCT_LAST, NOV_FIRST]);
    expect(unscheduled(c)).not.toContain(athletes);
  });
});

describe("a calendar read that leaves out a live entry", () => {
  it("should not post a second entry when the entry comes back before the post", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const [own] = entries(c);
    c.garmin.state.omitFromReads.set(own.id, OMIT_UNTIL_CLAIM);

    // Act
    await c.send(TEMPO, D1, "Tempo");
    const after = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(c.garmin.count("schedule")).toBe(1);
    expect(entries(c)).toEqual([own]);
    expect(after.kind).toBe("unchanged");
  });

  it("should remove Kaiord's surplus entry when the left-out entry comes back after the post", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const [first] = entries(c);
    c.garmin.state.omitFromReads.set(first.id, OMIT_PAST_POST);
    await c.send(TEMPO, D1, "Tempo");

    // Act
    const resend = await c.send(TEMPO, D1, "Tempo");
    const after = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(c.garmin.count("schedule")).toBe(2);
    expect(entries(c)).toHaveLength(1);
    expect(entries(c)[0].date).toBe(D1);
    expect(resend.kind).toBe("unchanged");
    expect(after.kind).toBe("unchanged");
  });

  it("should never remove the athlete's own entry as a surplus", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const [own] = entries(c);
    const { workoutId } = c.garmin.library[0];
    const athletes = c.garmin.athlete.placeLibraryWorkout(workoutId, D1);
    c.garmin.state.omitFromReads.set(own.id, OMIT_PAST_POST);

    // Act
    await c.send(TEMPO, D1, "Tempo");
    await c.send(TEMPO, D1, "Tempo");
    await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(unscheduled(c)).not.toContain(athletes);
    expect(entries(c).map((e) => e.id)).toContain(athletes);
  });
});

describe("sends that race", () => {
  it("should leave one entry after a double click", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);

    // Act
    const [a, b] = await Promise.all([
      c.send(TEMPO, D1, "Tempo"),
      c.send(TEMPO, D1, "Tempo"),
    ]);

    // Assert
    expect([a.kind, b.kind]).toEqual(["scheduled", "scheduled"]);
    expect(entries(c).map((e) => e.date)).toEqual([D1]);
  });

  it("should leave one entry when two tabs send at once", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    const other = c.openTab();

    // Act
    const results = await Promise.all([
      c.send(TEMPO, D1, "Tempo"),
      other.send(TEMPO, D1, "Tempo"),
    ]);
    const after = await other.send(TEMPO, D1, "Tempo");

    // Assert
    expect(results.map((r) => r.kind).sort()).toEqual(["failed", "scheduled"]);
    expect(after.kind).toBe("unchanged");
    expect(entries(c).map((e) => e.date)).toEqual([D1]);
  });
});

describe("a read of one month failing while the other answers", () => {
  it("should send nothing and delete nothing until both months read", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, OCT_LAST, "Tempo");
    const [october] = entries(c);
    c.garmin.state.downMonths.add("2026-11");

    // Act
    const blocked = await c.send(TEMPO, NOV_FIRST, "Tempo");
    c.garmin.state.downMonths.clear();
    const moved = await c.send(TEMPO, NOV_FIRST, "Tempo");

    // Assert
    expect(blocked).toMatchObject({ reason: "calendar-unreadable" });
    expect(unscheduled(c)).toEqual([october.id]);
    expect(moved.kind).toBe("moved");
    expect(entries(c).map((e) => e.date)).toEqual([NOV_FIRST]);
  });

  it("should keep the old month's entry while its read fails after the move", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, OCT_LAST, "Tempo");
    c.garmin.state.downMonths.add("2026-10");

    // Act
    const moved = await c.send(TEMPO, NOV_FIRST, "Tempo");
    c.garmin.state.downMonths.clear();
    const after = await c.send(TEMPO, NOV_FIRST, "Tempo");

    // Assert
    expect(moved.kind).toBe("moved");
    expect(after.kind).toBe("unchanged");
    expect(entries(c).map((e) => e.date)).toEqual([NOV_FIRST]);
  });
});
