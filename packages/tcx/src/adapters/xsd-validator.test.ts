import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { createXsdTcxValidator } from "./xsd-validator";

describe("createXsdTcxValidator", () => {
  const logger = createMockLogger();

  describe("valid XML", () => {
    it.each([
      `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout</Name>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`,
      `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout</Name>
      <Step xsi:type="Step_t">
        <StepId>1</StepId>
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`,
    ])("should validate well-formed TCX XML", async (validXml) => {
      // Arrange
      const validator = createXsdTcxValidator(logger);

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("invalid XML", () => {
    it.each([
      `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase>
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`,
      `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase>
  <Workouts>
    <Workout Sport="Running">
  </Workouts>
</TrainingCenterDatabase>`,
      "",
    ])("should reject invalid XML", async (invalidXml) => {
      // Arrange
      const validator = createXsdTcxValidator(logger);

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("XML");
    });
  });

  describe("schema violations", () => {
    it("should accept XML missing required namespace (schema validation not enforced)", async () => {
      // Arrange
      const validator = createXsdTcxValidator(logger);
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase>
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout</Name>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
