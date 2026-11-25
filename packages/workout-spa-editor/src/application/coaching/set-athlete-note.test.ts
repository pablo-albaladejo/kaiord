import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { readAthleteNoteText } from "./coaching-prompt-text";
import { setAthleteNote } from "./set-athlete-note";

const ACTIVITY = "p1:train2go:42";
const T1 = "2026-11-25T10:00:00.000Z";
const T2 = "2026-11-25T11:00:00.000Z";

const depsAt = (
  persistence: ReturnType<typeof createInMemoryPersistence>,
  now: string
) => ({
  athleteNotes: persistence.athleteNotes,
  clock: () => now,
});

describe("setAthleteNote", () => {
  it("should add a note the assistant then reads", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await setAthleteNote(depsAt(persistence, T1), {
      profileId: "p1",
      coachingActivityId: ACTIVITY,
      text: "  on the trainer, skip the single-leg part ",
    });

    // Assert
    expect(await readAthleteNoteText(persistence.athleteNotes, ACTIVITY)).toBe(
      "on the trainer, skip the single-leg part"
    );
  });

  it("should replace the note when the athlete edits it", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const input = { profileId: "p1", coachingActivityId: ACTIVITY };
    await setAthleteNote(depsAt(persistence, T1), { ...input, text: "first" });

    // Act
    await setAthleteNote(depsAt(persistence, T2), { ...input, text: "second" });

    // Assert
    expect(await persistence.athleteNotes.getById(ACTIVITY)).toEqual({
      id: ACTIVITY,
      profileId: "p1",
      text: "second",
      updatedAt: T2,
    });
  });

  it("should keep a cleared note as an empty, newer row so the clearing syncs", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const input = { profileId: "p1", coachingActivityId: ACTIVITY };
    await setAthleteNote(depsAt(persistence, T1), { ...input, text: "first" });

    // Act
    await setAthleteNote(depsAt(persistence, T2), { ...input, text: "  " });

    // Assert
    expect(await persistence.athleteNotes.getById(ACTIVITY)).toMatchObject({
      text: "",
      updatedAt: T2,
    });
    expect(
      await readAthleteNoteText(persistence.athleteNotes, ACTIVITY)
    ).toBeUndefined();
  });
});
