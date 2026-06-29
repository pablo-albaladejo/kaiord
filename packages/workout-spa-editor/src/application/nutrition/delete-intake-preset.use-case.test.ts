import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { deleteIntakePreset } from "./delete-intake-preset.use-case";
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

describe("deleteIntakePreset", () => {
  it("should remove the preset from the profile list", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await saveIntakePreset(presetDeps(persistence, "preset-1"), {
      label: "to delete",
      kcal: 100,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    });

    // Act
    await deleteIntakePreset({ persistence }, "preset-1");

    // Assert
    const listed = await listIntakePresets({
      persistence,
      profileId: PROFILE_ID,
    });
    expect(listed).toHaveLength(0);
  });
});
