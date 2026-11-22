/**
 * Safe writes to Garmin, at the message contract between the App and Kaiord
 * for Garmin, against a fake Garmin that holds state. What the athlete can
 * observe: how many entries Garmin holds for the Workout, on which date, and
 * that nothing Kaiord did not create is deleted or overwritten.
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
const MINUTE_MS = 60_000;

let db: KaiordDatabase;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db = new KaiordDatabase(`kaiord-test-safe-writes-${Math.random()}`);
  await db.open();
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  db.close();
  await Dexie.delete(db.name);
});

const datesOf = (c: ReturnType<typeof createMessageSeamConnector>) =>
  c.garmin
    .entriesOf("Tempo")
    .map((e) => e.date)
    .sort();

describe("sending the same Workout twice", () => {
  it("should leave one entry on Garmin", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");

    // Act
    const second = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(second.kind).toBe("unchanged");
    expect(datesOf(c)).toEqual([D1]);
    expect(c.garmin.library).toHaveLength(1);
  });

  it("should leave one entry after the tab died between created and recorded", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    c.garmin.state.crashOn = "schedule";
    void c.send(TEMPO, D1, "Tempo");
    await vi.waitFor(() => expect(c.garmin.count("schedule")).toBe(1));
    c.restartTab();
    vi.setSystemTime(Date.now() + MINUTE_MS);

    // Act
    const next = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(next.kind).toBe("scheduled");
    expect(datesOf(c)).toEqual([D1]);
    expect(c.garmin.count("schedule")).toBe(1);
  });

  it("should not push the library workout again while the push that died may still land", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    c.garmin.state.crashOn = "push";
    void c.send(TEMPO, D1, "Tempo");
    await vi.waitFor(() => expect(c.garmin.count("push")).toBe(1));
    c.restartTab();
    vi.setSystemTime(Date.now() + MINUTE_MS);

    // Act
    const next = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(next).toMatchObject({ kind: "failed", reason: "busy" });
    expect(c.garmin.library).toHaveLength(1);
    expect(c.garmin.count("schedule")).toBe(0);
  });

  it("should put it back once when the athlete deleted the entry by hand", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    c.garmin.athlete.deleteEntry(c.garmin.entriesOf("Tempo")[0].id);

    // Act
    const again = await c.send(TEMPO, D1, "Tempo");
    const third = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(again.kind).toBe("scheduled");
    expect(third.kind).toBe("unchanged");
    expect(datesOf(c)).toEqual([D1]);
  });

  it("should put it back once when the athlete deleted the workout by hand", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    c.garmin.athlete.deleteWorkout(c.garmin.library[0].workoutId);

    // Act
    const again = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(again.kind).toBe("scheduled");
    expect(datesOf(c)).toEqual([D1]);
    expect(c.garmin.library).toHaveLength(1);
  });

  it("should not add a second entry when Garmin already holds the Workout on that date", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");
    const { workoutId } = c.garmin.library[0];
    // The record of the placement is lost (an older snapshot restored),
    // while Garmin still holds the entry.
    await db
      .table("exportLedger")
      .toCollection()
      .modify((row) => {
        delete row.placement;
        delete row.removalQueue;
      });

    // Act
    const again = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(again.kind).toBe("scheduled");
    expect(datesOf(c)).toEqual([D1]);
    expect(c.garmin.entriesOf("Tempo")[0].workoutId).toBe(workoutId);
  });
});

describe("deciding a write from the live state", () => {
  it("should send nothing when Garmin's calendar cannot be read first", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    c.garmin.state.calendarDown = true;

    // Act
    const result = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(result).toMatchObject({
      kind: "failed",
      reason: "calendar-unreadable",
      retryable: true,
    });
    expect(c.garmin.count("schedule")).toBe(0);
    expect(c.garmin.calendar).toEqual([]);
  });

  it("should place it once Garmin answers again", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    c.garmin.state.calendarDown = true;
    await c.send(TEMPO, D1, "Tempo");
    c.garmin.state.calendarDown = false;

    // Act
    const result = await c.send(TEMPO, D1, "Tempo");

    // Assert
    expect(result.kind).toBe("scheduled");
    expect(datesOf(c)).toEqual([D1]);
  });
});

describe("changing a Workout after it was sent", () => {
  it("should leave one entry on the new date after a move", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");

    // Act
    const moved = await c.send(TEMPO, D2, "Tempo");

    // Assert
    expect(moved.kind).toBe("moved");
    expect(datesOf(c)).toEqual([D2]);
  });

  it("should leave one calendar entry after an edit", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    await c.send(TEMPO, D1, "Tempo");

    // Act
    const edited = await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(edited.kind).toBe("moved");
    expect(c.garmin.calendar.filter((i) => i.date === D1)).toHaveLength(1);
  });
});

describe("what Kaiord did not create", () => {
  it("should stay untouched through sends, moves and edits", async () => {
    // Arrange
    const c = createMessageSeamConnector(db);
    const own = c.garmin.athlete.addOwnWorkout("Tempo", D1);
    c.garmin.athlete.addActivity(D1, "Morning run");
    c.garmin.athlete.addOwnWorkout("Long run", D2);
    const foreign = structuredClone(c.garmin.calendar);
    const library = structuredClone(c.garmin.library);

    // Act
    await c.send(TEMPO, D1, "Tempo");
    await c.send(TEMPO, D1, "Tempo");
    await c.send(TEMPO, D2, "Tempo");
    await c.send(TEMPO, D2, "Tempo", "v2");
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(c.garmin.calendar).toEqual(expect.arrayContaining(foreign));
    expect(c.garmin.library).toEqual(expect.arrayContaining(library));
    const kaiord = c.garmin.calendar.filter(
      (i) => !foreign.some((f) => f.id === i.id)
    );
    expect(kaiord.map((i) => i.date)).toEqual([D1]);
    expect(kaiord[0].workoutId).not.toBe(own.workoutId);
    const deleted = c.garmin.log
      .filter((m) => m.action === "unschedule")
      .map((m) => Number(m.scheduleId));
    expect(deleted.length).toBeGreaterThan(0);
    expect(deleted.filter((id) => foreign.some((f) => f.id === id))).toEqual(
      []
    );
  });
});
