import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { applyPresetToDate } from "./apply-preset-to-date.use-case";
import { listIntakeForDate } from "./list-intake-for-date.use-case";
import { saveIntakePreset } from "./save-intake-preset.use-case";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";

const presetDeps = (
  persistence = createInMemoryPersistence(),
  id = "preset-1"
) => ({
  persistence,
  profileId: PROFILE_ID,
  newId: () => id,
  now: () => "2026-06-01T00:00:00.000Z",
});

describe("applyPresetToDate", () => {
  it("should create an intake entry from a saved preset's values", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await saveIntakePreset(presetDeps(persistence, "preset-1"), {
      label: "my usual breakfast",
      kcal: 400,
      proteinG: 20,
      carbG: 50,
      fatG: 10,
      defaultMealSlot: "breakfast",
    });

    // Act
    const entry = await applyPresetToDate(
      { persistence, profileId: PROFILE_ID, newId: () => "entry-1" },
      { presetId: "preset-1", date: DATE }
    );

    // Assert
    const day = await listIntakeForDate(
      { persistence, profileId: PROFILE_ID },
      DATE
    );
    expect(entry?.kcal).toBe(400);
    expect(entry?.mealSlot).toBe("breakfast");
    expect(day).toHaveLength(1);
  });

  it("should return undefined when the preset does not exist", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const entry = await applyPresetToDate(
      { persistence, profileId: PROFILE_ID },
      { presetId: "missing", date: DATE }
    );

    // Assert
    expect(entry).toBeUndefined();
  });
});
