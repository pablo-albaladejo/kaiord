/**
 * Garmin's library at the message contract, against a fake Garmin that
 * holds state behind the current extension (protocol 2): an edit makes a
 * new library workout, and Kaiord deletes the version it replaced only
 * when its record holds it as created by Kaiord and no calendar entry uses
 * it. What the athlete can observe: how many library workouts Kaiord left,
 * that their own workouts and every entry still on a date stay.
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
const NOV = "2026-11-10";
const TWO_OF_THE_ATHLETES_AND_ONE_OF_KAIORDS = 3;

let db: KaiordDatabase;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db = new KaiordDatabase(`kaiord-test-library-${Math.random()}`);
  await db.open();
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  db.close();
  await Dexie.delete(db.name);
});

type Seam = ReturnType<typeof createMessageSeamConnector>;
const current = () => createMessageSeamConnector(db, { protocol: 2 });
const tempoIds = (c: Seam) =>
  c.garmin.library
    .filter((w) => w.workoutName === "Tempo")
    .map((w) => w.workoutId);
const deletes = (c: Seam) =>
  c.garmin.log
    .filter((m) => m.action === "delete-workout")
    .map((m) => Number(m.workoutId));

describe("editing a Workout Kaiord sent", () => {
  it("should leave one library workout and one calendar entry", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);

    // Act
    const edited = await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(edited.kind).toBe("moved");
    const [v2] = tempoIds(c);
    expect(tempoIds(c)).toHaveLength(1);
    expect(v2).not.toBe(v1);
    expect(c.garmin.entriesOf("Tempo").map((e) => e.workoutId)).toEqual([v2]);
    expect(deletes(c)).toEqual([v1]);
  });

  it("should leave one library workout after several edits", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");
    await c.send(TEMPO, D2, "Tempo", "v3");
    await c.send(TEMPO, D2, "Tempo", "v3");

    // Assert
    expect(tempoIds(c)).toHaveLength(1);
    expect(c.garmin.entriesOf("Tempo").map((e) => e.date)).toEqual([D2]);
    expect(new Set(deletes(c)).size).toBe(deletes(c).length);
  });

  it("should never delete the athlete's own workout of the same name", async () => {
    // Arrange
    const c = current();
    const own = c.garmin.athlete.addOwnWorkout("Tempo", D1);
    const unscheduled = c.garmin.athlete.addOwnWorkout("Tempo");

    // Act
    await c.send(TEMPO, D1, "Tempo");
    await c.send(TEMPO, D1, "Tempo", "v2");
    await c.send(TEMPO, D2, "Tempo", "v3");

    // Assert
    expect(tempoIds(c)).toEqual(
      expect.arrayContaining([own.workoutId, unscheduled.workoutId])
    );
    expect(tempoIds(c)).toHaveLength(TWO_OF_THE_ATHLETES_AND_ONE_OF_KAIORDS);
    expect(deletes(c)).not.toContain(own.workoutId);
    expect(deletes(c)).not.toContain(unscheduled.workoutId);
    expect(
      c.garmin.calendar.some(
        (i) => i.workoutId === own.workoutId && i.date === D1
      )
    ).toBe(true);
  });

  it("should keep the earlier version while the athlete has it on another date", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);
    const athletes = c.garmin.athlete.placeLibraryWorkout(v1, D2);

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(tempoIds(c)).toContain(v1);
    expect(c.garmin.calendar.some((i) => i.id === athletes)).toBe(true);
    expect(deletes(c)).toEqual([]);
  });

  it("should keep the earlier version while its entry Kaiord replaced is still on the calendar", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);
    c.garmin.state.failNext.set("unschedule", 500);

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(tempoIds(c)).toContain(v1);
    expect(deletes(c)).toEqual([]);
    expect(c.garmin.calendar.filter((i) => i.workoutId === v1)).toHaveLength(1);
  });

  it("should delete the earlier version once its entry is removed on a later send", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);
    c.garmin.state.failNext.set("unschedule", 500);
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(tempoIds(c)).toHaveLength(1);
    expect(tempoIds(c)).not.toContain(v1);
    expect(c.garmin.entriesOf("Tempo")).toHaveLength(1);
  });

  it("should keep a version until Garmin answers the read of its month", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, NOV, "Tempo");
    const [v1] = tempoIds(c);
    c.garmin.state.downMonths.add("2026-11");
    await c.send(TEMPO, D1, "Tempo", "v2");
    const kept = tempoIds(c);
    c.garmin.state.downMonths.clear();

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(kept).toContain(v1);
    expect(tempoIds(c)).toHaveLength(1);
    expect(tempoIds(c)).not.toContain(v1);
  });
});

describe("a delete of the earlier version that fails", () => {
  it("should leave Garmin and the record as they were", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);
    c.garmin.state.failNext.set("delete-workout", 500);

    // Act
    const edited = await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(edited.kind).toBe("moved");
    expect(tempoIds(c)).toContain(v1);
    expect(tempoIds(c)).toHaveLength(2);
    expect(c.garmin.entriesOf("Tempo")).toHaveLength(1);
    const row = await c.row(TEMPO);
    expect(row?.libraryVersions).toEqual([
      { workoutId: String(v1), created: true, state: "superseded" },
    ]);
  });

  it("should be tried again on the next send", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);
    c.garmin.state.failNext.set("delete-workout", 500);
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Act
    const again = await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(again.kind).toBe("unchanged");
    expect(tempoIds(c)).toHaveLength(1);
    expect(deletes(c)).toEqual([v1, v1]);
    const row = await c.row(TEMPO);
    expect(row?.libraryVersions).toEqual([
      { workoutId: String(v1), created: true, state: "deleted" },
    ]);
  });

  it("should not be sent again once Garmin confirmed the version gone", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    await c.send(TEMPO, D1, "Tempo", "v2");
    const sent = deletes(c).length;

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(deletes(c)).toHaveLength(sent);
  });
});

describe("two tabs sending the edit", () => {
  it("should leave one library workout, delete each version once, and never the current one", async () => {
    // Arrange
    const c = current();
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);
    const other = c.openTab();

    // Act
    const results = await Promise.all([
      c.send(TEMPO, D1, "Tempo", "v2"),
      other.send(TEMPO, D1, "Tempo", "v2"),
    ]);
    await other.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(results.map((r) => r.kind).sort()).toEqual(["failed", "moved"]);
    expect(tempoIds(c)).toHaveLength(1);
    expect(deletes(c)).toEqual([v1]);
    expect(c.garmin.entriesOf("Tempo")).toHaveLength(1);
    expect(c.garmin.entriesOf("Tempo")[0].workoutId).toBe(tempoIds(c)[0]);
  });
});

describe("the previous extension, which has no library delete", () => {
  it("should leave the earlier version in the library and delete nothing", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");

    // Act
    const edited = await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(edited.kind).toBe("moved");
    expect(tempoIds(c)).toHaveLength(2);
    expect(c.garmin.entriesOf("Tempo")).toHaveLength(1);
  });
});
