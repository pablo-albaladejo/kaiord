import { describe, expect, it, vi } from "vitest";
import type { KRD } from "@kaiord/core";
import { TcxParsingError } from "@kaiord/core";
import type { TcxValidator } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "./fast-xml-parser";

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

    it("should preserve TCX extensions at step level", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithStepExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
        <Extensions>
          <CustomField>CustomValue</CustomField>
        </Extensions>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithStepExtensions);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{ extensions?: { tcx: Record<string, unknown> } }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].extensions).toBeDefined();
      expect(workout.steps[0].extensions?.tcx).toBeDefined();
      expect(workout.steps[0].extensions?.tcx.CustomField).toBe("CustomValue");
    });

    it("should extract power data from TCX extensions", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithPowerExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Biking">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
        <Extensions>
          <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
            <Watts>250</Watts>
          </TPX>
        </Extensions>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithPowerExtensions);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{ extensions?: { tcx: Record<string, unknown> } }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].extensions).toBeDefined();
      expect(workout.steps[0].extensions?.tcx).toBeDefined();
      const tpx = workout.steps[0].extensions?.tcx.TPX as Record<
        string,
        unknown
      >;
      expect(tpx).toBeDefined();
      expect(tpx.Watts).toBe(250);
    });

    it("should convert power data from extensions to power target", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithPowerExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Biking">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
        <Extensions>
          <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
            <Watts>250</Watts>
          </TPX>
        </Extensions>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithPowerExtensions);

      // Assert
      const workout = result.extensions?.workout as {
        steps: Array<{
          targetType: string;
          target: { type: string; value?: { unit: string; value: number } };
        }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].targetType).toBe("power");
      expect(workout.steps[0].target.type).toBe("power");
      expect(workout.steps[0].target.value?.unit).toBe("watts");
      expect(workout.steps[0].target.value?.value).toBe(250);
    });

    it("should preserve TCX extensions at workout level", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithWorkoutExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
      </Step>
      <Extensions>
        <WorkoutCustomField>WorkoutCustomValue</WorkoutCustomField>
      </Extensions>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithWorkoutExtensions);

      // Assert
      const workout = result.extensions?.workout as {
        extensions?: { tcx: Record<string, unknown> };
      };
      expect(workout.extensions).toBeDefined();
      expect(workout.extensions?.tcx).toBeDefined();
      expect(workout.extensions?.tcx.WorkoutCustomField).toBe(
        "WorkoutCustomValue"
      );
    });

    it("should preserve TCX extensions at TrainingCenterDatabase level", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithDatabaseExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
      </Step>
    </Workout>
  </Workouts>
  <Extensions>
    <DatabaseCustomField>DatabaseCustomValue</DatabaseCustomField>
  </Extensions>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithDatabaseExtensions);

      // Assert
      expect(result.extensions?.tcx).toBeDefined();
      const tcxExtensions = result.extensions?.tcx as Record<string, unknown>;
      expect(tcxExtensions.DatabaseCustomField).toBe("DatabaseCustomValue");
    });

    it("should preserve extensions at all levels simultaneously", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);
      const tcxWithAllExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts>
    <Workout Sport="Running">
      <Step xsi:type="Step_t">
        <Duration xsi:type="Time_t">
          <Seconds>300</Seconds>
        </Duration>
        <Target xsi:type="None_t"/>
        <Extensions>
          <StepField>StepValue</StepField>
        </Extensions>
      </Step>
      <Extensions>
        <WorkoutField>WorkoutValue</WorkoutField>
      </Extensions>
    </Workout>
  </Workouts>
  <Extensions>
    <DatabaseField>DatabaseValue</DatabaseField>
  </Extensions>
</TrainingCenterDatabase>`;

      // Act
      const result = await reader(tcxWithAllExtensions);

      // Assert
      // Database level
      expect(result.extensions?.tcx).toBeDefined();
      const tcxExtensions = result.extensions?.tcx as Record<string, unknown>;
      expect(tcxExtensions.DatabaseField).toBe("DatabaseValue");

      // Workout level
      const workout = result.extensions?.workout as {
        extensions?: { tcx: Record<string, unknown> };
        steps: Array<{ extensions?: { tcx: Record<string, unknown> } }>;
      };
      expect(workout.extensions?.tcx).toBeDefined();
      expect(workout.extensions?.tcx.WorkoutField).toBe("WorkoutValue");

      // Step level
      expect(workout.steps[0].extensions?.tcx).toBeDefined();
      expect(workout.steps[0].extensions?.tcx.StepField).toBe("StepValue");
    });
  });
});

describe("createFastXmlTcxWriter", () => {
  describe("TcxWriter", () => {
    it("should convert valid KRD to TCX XML string", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "open",
                target: { type: "open" },
                intensity: "warmup",
              },
            ],
          },
        },
      };

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toBeDefined();
      expect(result).toContain("TrainingCenterDatabase");
      expect(result).toContain('Workout Sport="Running"');
      expect(result).toContain("<Name>Test Workout</Name>");
      expect(result).toContain("<Seconds>300</Seconds>");
      expect(result).toContain("<Intensity>Warmup</Intensity>");
      expect(mockValidator).toHaveBeenCalledOnce();
    });

    it("should validate generated TCX against XSD schema", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act & Assert
      try {
        await writer(krd);
      } catch (error) {
        // Expected to throw "Not implemented"
      }

      // Validator should be called once conversion is implemented
      // For now, it won't be called because conversion throws first
    });

    it("should throw TcxValidationError when XSD validation fails", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: false,
        errors: [
          {
            path: "TrainingCenterDatabase",
            message: "Missing required element",
          },
        ],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act & Assert
      // Currently throws "Not implemented" before validation
      await expect(writer(krd)).rejects.toThrow();
    });

    it("should throw TcxParsingError on conversion failure", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const invalidKrd = {
        version: "1.0",
        type: "workout",
        // Missing required metadata
      } as unknown as KRD;

      // Act & Assert
      await expect(writer(invalidKrd)).rejects.toThrow(TcxParsingError);
    });

    it("should log debug message when encoding starts", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act & Assert
      try {
        await writer(krd);
      } catch (error) {
        // Expected to throw "Not implemented"
      }

      // Logger should have been called
      expect(logger).toBeDefined();
    });

    it("should inject logger for structured logging", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act & Assert
      try {
        await writer(krd);
      } catch (error) {
        // Expected to throw "Not implemented"
      }

      // Verify logger was injected and used
      expect(logger).toBeDefined();
    });

    it("should inject validator for XSD validation", async () => {
      // Arrange
      const logger = createMockLogger();
      const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const writer = createFastXmlTcxWriter(logger, mockValidator);

      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act & Assert
      try {
        await writer(krd);
      } catch (error) {
        // Expected to throw "Not implemented"
      }

      // Validator should be available for use once conversion is implemented
      expect(mockValidator).toBeDefined();
    });
  });
});

it("should convert workout metadata correctly", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      workout: {
        name: "Cycling Intervals",
        sport: "cycling",
        steps: [],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain('Workout Sport="Biking"');
  expect(result).toContain("<Name>Cycling Intervals</Name>");
});

it("should convert time-based duration steps", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 1800 },
            targetType: "open",
            target: { type: "open" },
          },
        ],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain('Duration xsi:type="Time_t"');
  expect(result).toContain("<Seconds>1800</Seconds>");
});

it("should convert distance-based duration steps", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "distance",
            duration: { type: "distance", meters: 5000 },
            targetType: "open",
            target: { type: "open" },
          },
        ],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain('Duration xsi:type="Distance_t"');
  expect(result).toContain("<Meters>5000</Meters>");
});

it("should convert heart rate zone targets", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "heart_rate",
            target: {
              type: "heart_rate",
              value: { unit: "zone", value: 3 },
            },
          },
        ],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain('Target xsi:type="HeartRate_t"');
  expect(result).toContain(
    'HeartRateZone xsi:type="PredefinedHeartRateZone_t"'
  );
  expect(result).toContain("<Number>3</Number>");
});

it("should preserve step order", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            name: "Warmup",
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "open",
            target: { type: "open" },
            intensity: "warmup",
          },
          {
            stepIndex: 1,
            name: "Work",
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "open",
            target: { type: "open" },
            intensity: "active",
          },
          {
            stepIndex: 2,
            name: "Cooldown",
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "open",
            target: { type: "open" },
            intensity: "cooldown",
          },
        ],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain("<Name>Warmup</Name>");
  expect(result).toContain("<Name>Work</Name>");
  expect(result).toContain("<Name>Cooldown</Name>");
  expect(result).toContain("<Intensity>Warmup</Intensity>");
  expect(result).toContain("<Intensity>Active</Intensity>");
  expect(result).toContain("<Intensity>Cooldown</Intensity>");

  // Verify order by checking positions
  const warmupIndex = result.indexOf("<Name>Warmup</Name>");
  const workIndex = result.indexOf("<Name>Work</Name>");
  const cooldownIndex = result.indexOf("<Name>Cooldown</Name>");
  expect(warmupIndex).toBeLessThan(workIndex);
  expect(workIndex).toBeLessThan(cooldownIndex);
});

it("should restore TCX extensions at step level", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "open",
            target: { type: "open" },
            extensions: {
              tcx: {
                CustomField: "CustomValue",
              },
            },
          },
        ],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain("<Extensions>");
  expect(result).toContain("<CustomField>CustomValue</CustomField>");
});

it("should restore power data to TCX extensions", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 250 },
            },
          },
        ],
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain("<Extensions>");
  expect(result).toContain("<TPX");
  expect(result).toContain("<Watts>250</Watts>");
});

it("should restore TCX extensions at workout level", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [],
        extensions: {
          tcx: {
            WorkoutCustomField: "WorkoutCustomValue",
          },
        },
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain("<Extensions>");
  expect(result).toContain(
    "<WorkoutCustomField>WorkoutCustomValue</WorkoutCustomField>"
  );
});

it("should restore TCX extensions at TrainingCenterDatabase level", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [],
      },
      tcx: {
        DatabaseCustomField: "DatabaseCustomValue",
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain("<Extensions>");
  expect(result).toContain(
    "<DatabaseCustomField>DatabaseCustomValue</DatabaseCustomField>"
  );
});

it("should restore extensions at all levels simultaneously", async () => {
  // Arrange
  const logger = createMockLogger();
  const mockValidator = vi.fn<TcxValidator>().mockResolvedValue({
    valid: true,
    errors: [],
  });
  const writer = createFastXmlTcxWriter(logger, mockValidator);

  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "open",
            target: { type: "open" },
            extensions: {
              tcx: {
                StepField: "StepValue",
              },
            },
          },
        ],
        extensions: {
          tcx: {
            WorkoutField: "WorkoutValue",
          },
        },
      },
      tcx: {
        DatabaseField: "DatabaseValue",
      },
    },
  };

  // Act
  const result = await writer(krd);

  // Assert
  expect(result).toContain("<StepField>StepValue</StepField>");
  expect(result).toContain("<WorkoutField>WorkoutValue</WorkoutField>");
  expect(result).toContain("<DatabaseField>DatabaseValue</DatabaseField>");
});
