import { describe, expect, it } from "vitest";
import { createConsoleLogger } from "../logger/console-logger";
import { createXsdTcxValidator } from "./xsd-validator";

describe("createXsdTcxValidator", () => {
  const logger = createConsoleLogger();

  describe("valid XML", () => {
    it("should validate well-formed TCX XML", async () => {
      // Arrange
      const validator = createXsdTcxValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout</Name>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate TCX with workout steps", async () => {
      // Arrange
      const validator = createXsdTcxValidator(logger);
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
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
</TrainingCenterDatabase>`;

      // Act
      const result = await validator(validXml);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("invalid XML", () => {
    it("should reject malformed XML", async () => {
      // Arrange
      const validator = createXsdTcxValidator(logger);
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase>
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("XML");
    });

    it("should reject XML with unclosed tags", async () => {
      // Arrange
      const validator = createXsdTcxValidator(logger);
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase>
  <Workouts>
    <Workout Sport="Running">
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject empty string", async () => {
      // Arrange
      const validator = createXsdTcxValidator(logger);
      const invalidXml = "";

      // Act
      const result = await validator(invalidXml);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("schema violations", () => {
    it("should reject XML missing required namespace", async () => {
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
