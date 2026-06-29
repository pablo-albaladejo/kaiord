import type { KRD } from "@kaiord/core";
import { TcxParsingError } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  DISTANCE_METERS_5000,
  HEART_RATE_ZONE_THREE,
  POWER_WATTS_250,
  STEP_COUNT_THREE,
  TIME_SECONDS_1800,
} from "../test-utils/constants";
import type { TcxValidator } from "../types";
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
      expect(result.type).toBe("structured_workout");
      expect(result.metadata.sport).toBe("running");
      expect(result.extensions?.structured_workout).toBeDefined();
    });

    it("should throw TcxParsingError on malformed XML", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);

      // Act
      const malformedXml =
        "<TrainingCenterDatabase><Workouts></TrainingCenterDatabase>";

      // Assert
      await expect(reader(malformedXml)).rejects.toThrow();
    });

    it("should throw TcxParsingError when TrainingCenterDatabase element is missing", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createFastXmlTcxReader(logger);

      // Act
      const invalidTcx = `<?xml version="1.0" encoding="UTF-8"?>
<SomeOtherRoot>
  <Data>Invalid</Data>
</SomeOtherRoot>`;

      // Assert
      await expect(reader(invalidTcx)).rejects.toThrow(TcxParsingError);
      await expect(reader(invalidTcx)).rejects.toThrow(
        "Invalid TCX format: missing TrainingCenterDatabase element"
      );
    });

    it("should parse a stepless workout into an empty steps array", async () => {
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

      // Act
      const result = await reader(validTcx);

      // Assert
      const workout = result.extensions?.structured_workout as {
        steps: unknown[];
      };
      expect(workout).toBeDefined();
      expect(workout.steps).toHaveLength(0);
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
      const result = await reader(tcxWithMetadata);
      expect(result.metadata.sport).toBe("cycling");
      expect(result.extensions?.structured_workout).toBeDefined();

      // Act
      const workout = result.extensions?.structured_workout as {
        name?: string;
        sport: string;
      };

      // Assert
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
      const result = await reader(tcxWithTimeStep);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ duration: { type: string; seconds?: number } }>;
      };

      // Assert
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].duration.type).toBe("time");
      expect(workout.steps[0].duration.seconds).toBe(TIME_SECONDS_1800);
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
      const result = await reader(tcxWithDistanceStep);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ duration: { type: string; meters?: number } }>;
      };

      // Assert
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].duration.type).toBe("distance");
      expect(workout.steps[0].duration.meters).toBe(DISTANCE_METERS_5000);
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
      const result = await reader(tcxWithHRZone);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{
          target: { type: string; value?: { unit: string; value: number } };
        }>;
      };

      // Assert
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].target.type).toBe("heart_rate");
      expect(workout.steps[0].target.value?.unit).toBe("zone");
      expect(workout.steps[0].target.value?.value).toBe(HEART_RATE_ZONE_THREE);
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
      const result = await reader(tcxWithMultipleSteps);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ stepIndex: number; name?: string; intensity?: string }>;
      };

      // Assert
      expect(workout.steps).toHaveLength(STEP_COUNT_THREE);
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
      const result = await reader(tcxWithStepExtensions);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ extensions?: { tcx: Record<string, unknown> } }>;
      };

      // Assert
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
      const result = await reader(tcxWithPowerExtensions);
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ extensions?: { tcx: Record<string, unknown> } }>;
      };
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].extensions).toBeDefined();
      expect(workout.steps[0].extensions?.tcx).toBeDefined();

      // Act
      const tpx = workout.steps[0].extensions?.tcx.TPX as Record<
        string,
        unknown
      >;

      // Assert
      expect(tpx).toBeDefined();
      expect(tpx.Watts).toBe(POWER_WATTS_250);
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
      const result = await reader(tcxWithPowerExtensions);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{
          targetType: string;
          target: { type: string; value?: { unit: string; value: number } };
        }>;
      };

      // Assert
      expect(workout.steps).toHaveLength(1);
      expect(workout.steps[0].targetType).toBe("power");
      expect(workout.steps[0].target.type).toBe("power");
      expect(workout.steps[0].target.value?.unit).toBe("watts");
      expect(workout.steps[0].target.value?.value).toBe(POWER_WATTS_250);
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
      const result = await reader(tcxWithWorkoutExtensions);

      // Act
      const workout = result.extensions?.structured_workout as {
        extensions?: { tcx: Record<string, unknown> };
      };

      // Assert
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
      const result = await reader(tcxWithDatabaseExtensions);
      expect(result.extensions?.tcx).toBeDefined();

      // Act
      const tcxExtensions = result.extensions?.tcx as Record<string, unknown>;

      // Assert
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
      const result = await reader(tcxWithAllExtensions);
      expect(result.extensions?.tcx).toBeDefined();
      const tcxExtensions = result.extensions?.tcx as Record<string, unknown>;
      expect(tcxExtensions.DatabaseField).toBe("DatabaseValue");

      // Act
      const workout = result.extensions?.structured_workout as {
        extensions?: { tcx: Record<string, unknown> };
        steps: Array<{ extensions?: { tcx: Record<string, unknown> } }>;
      };

      // Assert
      expect(workout.extensions?.tcx).toBeDefined();
      expect(workout.extensions?.tcx.WorkoutField).toBe("WorkoutValue");
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
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
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

      // Act
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Assert
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

      // Act
      const invalidKrd = {
        version: "1.0",
        type: "structured_workout",
        // Missing required metadata
      } as unknown as KRD;

      // Assert
      await expect(writer(invalidKrd)).rejects.toThrow(TcxParsingError);
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
  const result = await writer(krd);
  expect(result).toContain("<Name>Warmup</Name>");
  expect(result).toContain("<Name>Work</Name>");
  expect(result).toContain("<Name>Cooldown</Name>");
  expect(result).toContain("<Intensity>Warmup</Intensity>");
  expect(result).toContain("<Intensity>Active</Intensity>");
  expect(result).toContain("<Intensity>Cooldown</Intensity>");
  const warmupIndex = result.indexOf("<Name>Warmup</Name>");
  const workIndex = result.indexOf("<Name>Work</Name>");

  // Act
  const cooldownIndex = result.indexOf("<Name>Cooldown</Name>");

  // Assert
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
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
