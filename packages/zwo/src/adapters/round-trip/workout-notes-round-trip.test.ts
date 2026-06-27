import { createMockLogger, loadZwoFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "../fast-xml-parser";
import { createXsdZwiftValidator } from "../xsd-validator";

describe("Zwift Round-trip: workout-level notes", () => {
  it(
    "should preserve workout-level notes as the ZWO description",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const logger = createMockLogger();
      const validator = createXsdZwiftValidator(logger);
      const reader = createFastXmlZwiftReader(logger, validator);
      const writer = createFastXmlZwiftWriter(logger, validator);
      const notes = "Endurance ride — see [video](https://youtu.be/abc)";
      const krd = await reader(loadZwoFixture("WorkoutIndividualSteps.zwo"));
      const workout = krd.extensions?.structured_workout as Record<
        string,
        unknown
      >;
      workout.notes = notes;

      // Act
      const xml = await writer(krd);
      const krd2 = await reader(xml);

      // Assert
      const workout2 = krd2.extensions?.structured_workout as Record<
        string,
        unknown
      >;
      expect(xml).toContain(`<description>${notes}</description>`);
      expect(workout2.notes).toBe(notes);
    }
  );
});
