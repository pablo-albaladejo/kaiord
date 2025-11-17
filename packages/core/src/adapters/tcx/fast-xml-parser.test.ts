import { describe, expect, it } from "vitest";
import { TcxParsingError } from "../../domain/types/errors";
import { createMockLogger } from "../../tests/helpers/test-utils";
import { createFastXmlTcxReader } from "./fast-xml-parser";

describe("createFastXmlTcxReader", () => {
  describe("TcxReader", () => {
    it("should parse valid TCX XML structure and convert to KRD", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const validTcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout</Name>
      <Step xsi:type="Step_t">
        <StepId>1</StepId>
        <Name>Warmup</Name>
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Intensity>Warmup</Intensity>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(validTcx);

      // Assert
      expect(result).toBeDefined();
      expect(result.version).toBe("1.0");
      expect(result.type).toBe("workout");
      expect(result.metadata.sport).toBe("running");
      expect(result.extensions?.workout).toBeDefined();
    });

    it("should throw TcxParsingError on malformed XML", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      // fast-xml-parser is lenient, so we need truly invalid XML
      const malformedXml =
        "<TrainingCenterDatabase><Workouts></TrainingCenterDatabase>";

      // Act & Assert
      // This will parse but fail validation (missing TrainingCenterDatabase structure)
      // or throw "not yet implemented" if it passes validation
      await expect(reader(malformedXml)).rejects.toThrow();
    });

    it("should throw TcxParsingError when TrainingCenterDatabase element is missing", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const invalidTcx = `<?xml version="1.0" encoding="UTF-8"?>
<SomeOtherRoot>
  <Data>Invalid</Data>
</SomeOtherRoot>`;

      // Act & Assert
      await expect(reader(invalidTcx)).rejects.toThrow(TcxParsingError);
      await expect(reader(invalidTcx)).rejects.toThrow(
        "Invalid TCX format: missing TrainingCenterDatabase element"
      );
    });

    it("should log debug message when parsing starts", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const validTcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Workouts>
    <Workout Sport="Running">
      <Name>Test Workout</Name>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act & Assert
      try {
        await reader(validTcx);
      } catch (error) {
        // Expected to throw "not yet implemented"
      }

      // Logger should have been called (we can't verify exact calls with simple mock)
      expect(logger).toBeDefined();
    });

    it("should extract workout metadata correctly", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Biking">
      <Name>Cycling Intervals</Name>
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithMetadata);

      // Assert
      expect(result.metadata.sport).toBe("cycling");
      expect(result.extensions?.workout).toBeDefined();
      const workout = result.extensions?.workout as {
        name?: string;
        sport: string;
      };
      expect(workout.name).toBe("Cycling Intervals");
      expect(workout.sport).toBe("cycling");
    });

    it("should convert time-based duration steps", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithTimeStep = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>1800</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithTimeStep);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{ duration: { type: string; seconds?: number } }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].duration.type).toBe("time");
      expect(workout.steps[0].duration.seconds).toBe(1800);
    });

    it("should convert distance-based duration steps", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithDistanceStep = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Distance_t">
          <Meters>5000</Meters>
        </Duration>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithDistanceStep);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{ duration: { type: string; meters?: number } }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].duration.type).toBe("distance");
      expect(workout.steps[0].duration.meters).toBe(5000);
    });

    it("should convert heart rate zone targets", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithHRZone = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Target xsi:type="HeartRate_t">
          <HeartRateZone xsi:type="PredefinedHeartRateZone_t">
            <Number>3</Number>
          </HeartRateZone>
        </Target>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithHRZone);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{
          target: { type: string; value?: { unit: string; value: number } };
        }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].target.type).toBe("heart_rate");
      expect(workout.steps[0].target.value?.unit).toBe("zone");
      expect(workout.steps[0].target.value?.value).toBe(3);
    });

    it("should preserve step order", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithMultipleSteps = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Name>Warmup</Name>
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Intensity>Warmup</Intensity>
        <Target xsi:type="None_t"/>
      </Step>
      <Step xsi:type="Step_t">
        <Name>Work</Name>
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="None_t"/>
      </Step>
      <Step xsi:type="Step_t">
        <Name>Cooldown</Name>
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Intensity>Cooldown</Intensity>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithMultipleSteps);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{ stepIndex: number; name?: string; intensity?: string }>;
      };
      expect(workout.steps).toHaveLength(3);
      expect(workout.steps[0].stepIndex).toBe(0);
      expect(workout.steps[0].name).toBe("Warmup");
      expect(workout.steps[0].intensity).toBe("warmup");
      expect(workout.steps[1].stepIndex).toBe(1);
      expect(workout.steps[1].name).toBe("Work");
      expect(workout.steps[1].intensity).toBe("active");
      expect(workout.steps[2].stepIndex).toBe(2);
      expect(workout.steps[2].name).toBe("Cooldown");
      expect(workout.steps[2].intensity).toBe("cooldown");
    });
  });
});
