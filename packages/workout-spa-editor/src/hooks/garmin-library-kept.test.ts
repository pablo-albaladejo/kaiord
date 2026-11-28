/**
 * What the athlete's Garmin library holds while library deletes are off
 * (`GARMIN_LIBRARY_DELETES`): an edit makes a new library workout and the
 * earlier version stays. Production hands the pipeline no library port, and
 * the extension refuses the delete even if one were asked for. `garmin-library-cleanup.test.ts` keeps proving
 * the deletes for when the owner turns them on.
 */
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../adapters/dexie/dexie-database";
import { createMessageSeamConnector } from "../test-utils/message-seam-placement";

const T0 = new Date("2026-10-01T08:00:00.000Z");
const TEMPO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const D1 = "2026-10-06";

let db: KaiordDatabase;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
  db = new KaiordDatabase(`kaiord-test-library-kept-${Math.random()}`);
  await db.open();
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  db.close();
  await Dexie.delete(db.name);
});

type Seam = ReturnType<typeof createMessageSeamConnector>;
const tempoIds = (c: Seam) =>
  c.garmin.library
    .filter((w) => w.workoutName === "Tempo")
    .map((w) => w.workoutId);
const deletes = (c: Seam) =>
  c.garmin.log.filter((m) => m.action === "delete-workout");

describe("an edit while library deletes are off", () => {
  it("should leave the earlier version in the library as production wires the App", async () => {
    // Arrange
    const c = createMessageSeamConnector(db, {
      protocol: 2,
      libraryPort: false,
    });
    await c.send(TEMPO, D1, "Tempo");
    const [v1] = tempoIds(c);

    // Act
    const edited = await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(edited.kind).toBe("moved");
    expect(tempoIds(c)).toHaveLength(2);
    expect(tempoIds(c)).toContain(v1);
    expect(deletes(c)).toEqual([]);
    expect(c.garmin.entriesOf("Tempo")).toHaveLength(1);
  });

  it("should delete nothing through today's extension even with a library port", async () => {
    // Arrange
    const c = createMessageSeamConnector(db, {
      protocol: 2,
      libraryDelete: false,
    });
    await c.send(TEMPO, D1, "Tempo");

    // Act
    await c.send(TEMPO, D1, "Tempo", "v2");
    await c.send(TEMPO, D1, "Tempo", "v2");

    // Assert
    expect(tempoIds(c)).toHaveLength(2);
    expect(deletes(c)).toEqual([]);
    expect(c.garmin.entriesOf("Tempo")).toHaveLength(1);
  });
});
