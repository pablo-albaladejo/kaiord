import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { listIntakeForDate } from "./list-intake-for-date.use-case";
import { logIntakeEntry } from "./log-intake-entry.use-case";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const FIXED_ID = "i1";
const LOGGED_AT = "2026-06-21T12:00:00.000Z";
const LUNCH_KCAL = 600;
const LUNCH_PROTEIN_G = 40;
const LUNCH_CARB_G = 60;
const LUNCH_FAT_G = 20;

const deps = () => ({
  persistence: createInMemoryPersistence(),
  profileId: PROFILE_ID,
  newId: () => FIXED_ID,
  now: () => LOGGED_AT,
});

describe("logIntakeEntry", () => {
  it("should persist an entry and roll it into the day's intake", async () => {
    // Arrange
    const d = deps();

    // Act
    const entry = await logIntakeEntry(d, {
      date: DATE,
      kcal: LUNCH_KCAL,
      proteinG: LUNCH_PROTEIN_G,
      carbG: LUNCH_CARB_G,
      fatG: LUNCH_FAT_G,
      mealSlot: "lunch",
    });

    // Assert
    const stored = await listIntakeForDate(d, DATE);
    expect(entry?.id).toBe(FIXED_ID);
    expect(entry?.loggedAt).toBe(LOGGED_AT);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.kcal).toBe(LUNCH_KCAL);
  });

  it.each([
    { field: "kcal", kcal: -1, proteinG: 0 },
    { field: "proteinG", kcal: 100, proteinG: -5 },
  ])(
    "should reject an entry with a negative $field and persist nothing",
    async ({ kcal, proteinG }) => {
      // Arrange
      const d = deps();

      // Act
      const entry = await logIntakeEntry(d, {
        date: DATE,
        kcal,
        proteinG,
        carbG: 0,
        fatG: 0,
      });

      // Assert
      const stored = await listIntakeForDate(d, DATE);
      expect(entry).toBeUndefined();
      expect(stored).toHaveLength(0);
    }
  );
});
