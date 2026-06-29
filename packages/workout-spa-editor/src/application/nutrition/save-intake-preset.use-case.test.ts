import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { listIntakePresets } from "./list-intake-presets.use-case";
import { saveIntakePreset } from "./save-intake-preset.use-case";

const PROFILE_ID = "p1";

const presetDeps = (
  persistence = createInMemoryPersistence(),
  id = "preset-1"
) => ({
  persistence,
  profileId: PROFILE_ID,
  newId: () => id,
  now: () => "2026-06-01T00:00:00.000Z",
});

describe("saveIntakePreset / listIntakePresets", () => {
  it("should persist a preset and list it for the profile", async () => {
    // Arrange
    const d = presetDeps();

    // Act
    const preset = await saveIntakePreset(d, {
      label: "my usual breakfast",
      kcal: 400,
      proteinG: 20,
      carbG: 50,
      fatG: 10,
      defaultMealSlot: "breakfast",
    });

    // Assert
    const listed = await listIntakePresets(d);
    expect(preset?.id).toBe("preset-1");
    expect(listed).toHaveLength(1);
    expect(listed[0]?.label).toBe("my usual breakfast");
  });

  it("should reject a preset with a negative macro and persist nothing", async () => {
    // Arrange
    const d = presetDeps();

    // Act
    const preset = await saveIntakePreset(d, {
      label: "bad",
      kcal: 100,
      proteinG: -1,
      carbG: 0,
      fatG: 0,
    });

    // Assert
    const listed = await listIntakePresets(d);
    expect(preset).toBeUndefined();
    expect(listed).toHaveLength(0);
  });
});
