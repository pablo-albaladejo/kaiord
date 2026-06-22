import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { deleteIntakeEntry } from "./delete-intake-entry.use-case";
import { listIntakeForDate } from "./list-intake-for-date.use-case";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const OTHER_DATE = "2026-06-22";

const seedEntry = (
  persistence: ReturnType<typeof createInMemoryPersistence>,
  id: string,
  date: string,
  loggedAt: string
) =>
  persistence.intakeEntries.put({
    id,
    profileId: PROFILE_ID,
    date,
    loggedAt,
    kcal: 100,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
  });

describe("listIntakeForDate", () => {
  it("should return only the requested day's entries in logging order", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedEntry(persistence, "b", DATE, "2026-06-21T13:00:00.000Z");
    await seedEntry(persistence, "a", DATE, "2026-06-21T08:00:00.000Z");
    await seedEntry(persistence, "x", OTHER_DATE, "2026-06-22T08:00:00.000Z");

    // Act
    const entries = await listIntakeForDate(
      { persistence, profileId: PROFILE_ID },
      DATE
    );

    // Assert
    expect(entries.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("deleteIntakeEntry", () => {
  it("should remove the entry from the day's roll-up", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seedEntry(persistence, "a", DATE, "2026-06-21T08:00:00.000Z");

    // Act
    await deleteIntakeEntry({ persistence }, "a");

    // Assert
    const entries = await listIntakeForDate(
      { persistence, profileId: PROFILE_ID },
      DATE
    );
    expect(entries).toHaveLength(0);
  });
});
