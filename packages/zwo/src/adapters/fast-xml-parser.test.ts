import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import type { ZwiftValidator } from "@kaiord/core";
import {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "./fast-xml-parser";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("createFastXmlZwiftReader", () => {
  describe("XSD validation", () => {
    it("should validate XML against XSD before parsing", async () => {
      // Arrange
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(validXml);

      // Assert
      expect(mockValidator).toHaveBeenCalledWith(validXml);
      expect(result).toBeDefined();
      expect(result.version).toBe("1.0");
      expect(result.type).toBe("structured_workout");
    });

    it("should throw ZwiftValidationError when XSD validation fails", async () => {
      // Arrange
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<invalid_root>
  <name>Test</name>
</invalid_root>`;

      const validationErrors = [
        { path: "root", message: "Expected workout_file element" },
      ];
      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: false,
        errors: validationErrors,
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act & Assert
      await expect(reader(invalidXml)).rejects.toThrow(
        "Zwift file does not conform to XSD schema"
      );
      expect(mockValidator).toHaveBeenCalledWith(invalidXml);
      expect(logger.error).toHaveBeenCalledWith(
        "Zwift file does not conform to XSD schema",
        { errors: validationErrors }
      );
    });
  });

  describe("XML parsing", () => {
    it("should parse valid XML successfully", async () => {
      // Arrange
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(validXml);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        "Zwift file parsed successfully"
      );
      expect(result).toBeDefined();
      expect(result.extensions?.structured_workout?.name).toBe("Test Workout");
    });

    it("should throw ZwiftParsingError when workout_file element is missing", async () => {
      // Arrange
      const xmlWithoutWorkoutFile = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <name>Test</name>
</root>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act & Assert
      await expect(reader(xmlWithoutWorkoutFile)).rejects.toThrow(
        "Invalid Zwift format: missing workout_file element"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Invalid Zwift structure",
        expect.objectContaining({ error: expect.anything() })
      );
    });
  });

  describe("logger integration", () => {
    it("should log debug messages during parsing", async () => {
      // Arrange
      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Test Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(validXml);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        "Validating Zwift file against XSD",
        { xmlLength: validXml.length }
      );
      expect(logger.debug).toHaveBeenCalledWith("Parsing Zwift file");
      expect(result).toBeDefined();
    });
  });

  describe("metadata extraction", () => {
    it("should extract workout name and author", async () => {
      // Arrange
      const xmlWithMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>John Doe</author>
  <name>FTP Test</name>
  <description>A challenging FTP test workout</description>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithMetadata);

      // Assert
      expect(result.extensions?.structured_workout).toMatchObject({
        name: "FTP Test",
        sport: "cycling",
      });
      expect(result.extensions?.zwift).toMatchObject({
        author: "John Doe",
        description: "A challenging FTP test workout",
      });
    });

    it("should preserve durationType in extensions", async () => {
      // Arrange
      const xmlWithDurationType = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Distance Workout</name>
  <sportType>run</sportType>
  <durationType>distance</durationType>
  <workout>
    <SteadyState Duration="5000" pace="240"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithDurationType);

      // Assert
      expect(result.extensions?.zwift?.durationType).toBe("distance");
    });

    it("should preserve thresholdSecPerKm in extensions", async () => {
      // Arrange
      const xmlWithThreshold = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Running Workout</name>
  <sportType>run</sportType>
  <thresholdSecPerKm>240</thresholdSecPerKm>
  <workout>
    <SteadyState Duration="300" pace="240"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithThreshold);

      // Assert
      expect(result.extensions?.zwift?.thresholdSecPerKm).toBe(240);
    });

    it("should map bike sportType to cycling", async () => {
      // Arrange
      const xmlWithBike = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Cycling Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithBike);

      // Assert
      expect(result.metadata.sport).toBe("cycling");
      expect(result.extensions?.structured_workout?.sport).toBe("cycling");
    });

    it("should map run sportType to running", async () => {
      // Arrange
      const xmlWithRun = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Running Workout</name>
  <sportType>run</sportType>
  <workout>
    <SteadyState Duration="300" pace="240"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithRun);

      // Assert
      expect(result.metadata.sport).toBe("running");
      expect(result.extensions?.structured_workout?.sport).toBe("running");
    });

    it("should extract tags from workout", async () => {
      // Arrange
      const xmlWithTags = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Tagged Workout</name>
  <sportType>bike</sportType>
  <tags>
    <tag name="FTP"/>
    <tag name="Intervals"/>
    <tag name="Hard"/>
  </tags>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithTags);

      // Assert
      expect(result.extensions?.zwift?.tags).toEqual([
        "FTP",
        "Intervals",
        "Hard",
      ]);
    });

    it("should handle workout without tags", async () => {
      // Arrange
      const xmlWithoutTags = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>Simple Workout</name>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="300" Power="1.0"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithoutTags);

      // Assert
      expect(result.extensions?.zwift?.tags).toEqual([]);
    });
  });

  describe("extension preservation", () => {
    it("should preserve FlatRoad attribute from FreeRide intervals", async () => {
      // Arrange
      const xmlWithFlatRoad = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <name>FreeRide Workout</name>
  <sportType>bike</sportType>
  <workout>
    <FreeRide Duration="600" Cadence="90" FlatRoad="1"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithFlatRoad);

      // Assert
      expect(result.extensions?.structured_workout?.steps).toHaveLength(1);
      expect(
        result.extensions?.structured_workout?.steps[0].extensions?.zwift
          ?.FlatRoad
      ).toBe(1);
    });

    it("should preserve all Zwift extensions together", async () => {
      // Arrange
      const xmlWithAllExtensions = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Test Author</author>
  <name>Complete Workout</name>
  <description>Workout with all extensions</description>
  <sportType>run</sportType>
  <durationType>distance</durationType>
  <thresholdSecPerKm>240</thresholdSecPerKm>
  <tags>
    <tag name="Test"/>
    <tag name="Extensions"/>
  </tags>
  <workout>
    <SteadyState Duration="5000" pace="240"/>
  </workout>
</workout_file>`;

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const reader = createFastXmlZwiftReader(logger, mockValidator);

      // Act
      const result = await reader(xmlWithAllExtensions);

      // Assert
      expect(result.extensions?.zwift).toMatchObject({
        author: "Test Author",
        description: "Workout with all extensions",
        tags: ["Test", "Extensions"],
        durationType: "distance",
        thresholdSecPerKm: 240,
      });
    });
  });
});

describe("createFastXmlZwiftWriter", () => {
  describe("XSD validation", () => {
    it("should validate generated XML against XSD", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(mockValidator).toHaveBeenCalledWith(expect.any(String));
      expect(result).toContain("<?xml");
      expect(result).toContain("workout_file");
    });

    it("should throw ZwiftValidationError when generated XML fails XSD validation", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const validationErrors = [
        { path: "workout_file", message: "Invalid structure" },
      ];
      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: false,
        errors: validationErrors,
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act & Assert
      await expect(writer(krd)).rejects.toThrow(
        "Generated Zwift XML does not conform to XSD schema"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Generated Zwift XML does not conform to XSD schema",
        { errors: validationErrors }
      );
    });
  });

  describe("error handling", () => {
    it("should throw ZwiftParsingError when KRD is missing workout extensions", async () => {
      // Arrange
      const invalidKrd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act & Assert
      await expect(writer(invalidKrd)).rejects.toThrow(
        "Failed to convert KRD to Zwift"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to convert KRD to Zwift",
        expect.objectContaining({ error: expect.anything() })
      );
    });
  });

  describe("logger integration", () => {
    it("should log debug messages during conversion", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      await writer(krd);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        "Converting KRD to Zwift format"
      );
      expect(logger.debug).toHaveBeenCalledWith(
        "Building Zwift workout structure from KRD"
      );
      expect(logger.debug).toHaveBeenCalledWith(
        "Validating generated Zwift XML against XSD",
        expect.objectContaining({ xmlLength: expect.any(Number) })
      );
      expect(logger.info).toHaveBeenCalledWith(
        "KRD to Zwift conversion successful"
      );
    });
  });

  describe("metadata conversion", () => {
    it("should convert KRD metadata to Zwift format", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [],
          },
          zwift: {
            author: "John Doe",
            description: "A test workout",
            tags: ["FTP", "Intervals"],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("<name>Test Workout</name>");
      expect(result).toContain("<author>John Doe</author>");
      expect(result).toContain("<description>A test workout</description>");
      expect(result).toContain("<sportType>bike</sportType>");
      expect(result).toContain('name="FTP"');
      expect(result).toContain('name="Intervals"');
    });

    it("should map cycling sport to bike sportType", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Cycling Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("<sportType>bike</sportType>");
    });

    it("should map running sport to run sportType", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Running Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("<sportType>run</sportType>");
    });
  });

  describe("interval encoding", () => {
    it("should encode IntervalsT repetition blocks with power targets", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Intervals Workout",
            sport: "cycling",
            steps: [
              {
                repeatCount: 5,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 30 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 120 },
                    },
                    intensity: "active" as const,
                  },
                  {
                    stepIndex: 1,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 30 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 50 },
                    },
                    intensity: "recovery" as const,
                  },
                ],
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("IntervalsT");
      expect(result).toContain('Repeat="5"');
      expect(result).toContain('OnDuration="30"');
      expect(result).toContain('OffDuration="30"');
      expect(result).toContain('OnPower="1.2"');
      expect(result).toContain('OffPower="0.5"');
    });

    it("should encode IntervalsT with cadence targets", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Cadence Intervals",
            sport: "cycling",
            steps: [
              {
                repeatCount: 8,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 60 },
                    targetType: "cadence" as const,
                    target: {
                      type: "cadence" as const,
                      value: { unit: "rpm" as const, value: 95 },
                    },
                    intensity: "active" as const,
                  },
                  {
                    stepIndex: 1,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 60 },
                    targetType: "cadence" as const,
                    target: {
                      type: "cadence" as const,
                      value: { unit: "rpm" as const, value: 85 },
                    },
                    intensity: "recovery" as const,
                  },
                ],
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("IntervalsT");
      expect(result).toContain('Repeat="8"');
      expect(result).toContain('OnDuration="60"');
      expect(result).toContain('OffDuration="60"');
      expect(result).toContain('Cadence="95"');
      expect(result).toContain('CadenceResting="85"');
    });

    it("should encode IntervalsT with distance durations", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Distance Intervals",
            sport: "running",
            steps: [
              {
                repeatCount: 4,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "distance" as const,
                    duration: { type: "distance" as const, meters: 400 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 110 },
                    },
                    intensity: "active" as const,
                  },
                  {
                    stepIndex: 1,
                    durationType: "distance" as const,
                    duration: { type: "distance" as const, meters: 200 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 60 },
                    },
                    intensity: "recovery" as const,
                  },
                ],
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("IntervalsT");
      expect(result).toContain('Repeat="4"');
      expect(result).toContain('OnDuration="400"');
      expect(result).toContain('OffDuration="200"');
      expect(result).toContain('OnPower="1.1"');
      expect(result).toContain('OffPower="0.6"');
    });

    it("should encode multiple IntervalsT blocks", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Multiple Intervals",
            sport: "cycling",
            steps: [
              {
                repeatCount: 3,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 120 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 105 },
                    },
                    intensity: "active" as const,
                  },
                  {
                    stepIndex: 1,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 60 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 55 },
                    },
                    intensity: "recovery" as const,
                  },
                ],
              },
              {
                repeatCount: 5,
                steps: [
                  {
                    stepIndex: 2,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 30 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 120 },
                    },
                    intensity: "active" as const,
                  },
                  {
                    stepIndex: 3,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 30 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 50 },
                    },
                    intensity: "recovery" as const,
                  },
                ],
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("IntervalsT");
      expect(result).toContain('Repeat="3"');
      expect(result).toContain('Repeat="5"');
      expect(result).toContain('OnDuration="120"');
      expect(result).toContain('OnDuration="30"');
    });
  });

  describe("text event encoding", () => {
    it("should encode single text event from step notes", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Text Event Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 300 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
                notes: "Push hard!",
                extensions: {
                  zwift: {
                    textEvents: [
                      {
                        message: "Push hard!",
                        timeoffset: 0,
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("textevent");
      expect(result).toContain('message="Push hard!"');
      expect(result).toContain('timeoffset="0"');
    });

    it("should encode multiple text events", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Multiple Text Events",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 300 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
                notes: "Start strong",
                extensions: {
                  zwift: {
                    textEvents: [
                      {
                        message: "Start strong",
                        timeoffset: 0,
                      },
                      {
                        message: "Keep it up",
                        timeoffset: 150,
                      },
                      {
                        message: "Final push",
                        timeoffset: 270,
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain('message="Start strong"');
      expect(result).toContain('message="Keep it up"');
      expect(result).toContain('message="Final push"');
      expect(result).toContain('timeoffset="0"');
      expect(result).toContain('timeoffset="150"');
      expect(result).toContain('timeoffset="270"');
    });

    it("should encode text events with distance offsets", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Distance Text Events",
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "distance" as const,
                duration: { type: "distance" as const, meters: 5000 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
                notes: "Start",
                extensions: {
                  zwift: {
                    textEvents: [
                      {
                        message: "Start",
                        distoffset: 0,
                      },
                      {
                        message: "Halfway",
                        distoffset: 2500,
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain('message="Start"');
      expect(result).toContain('message="Halfway"');
      expect(result).toContain('distoffset="0"');
      expect(result).toContain('distoffset="2500"');
    });

    it("should encode text events in IntervalsT blocks", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "IntervalsT with Text Events",
            sport: "cycling",
            steps: [
              {
                repeatCount: 8,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 30 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 120 },
                    },
                    intensity: "active" as const,
                    notes: "Sprint intervals!",
                    extensions: {
                      zwift: {
                        textEvents: [
                          {
                            message: "Sprint intervals!",
                            timeoffset: 0,
                          },
                        ],
                      },
                    },
                  },
                  {
                    stepIndex: 1,
                    durationType: "time" as const,
                    duration: { type: "time" as const, seconds: 30 },
                    targetType: "power" as const,
                    target: {
                      type: "power" as const,
                      value: { unit: "percent_ftp" as const, value: 50 },
                    },
                    intensity: "recovery" as const,
                  },
                ],
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("IntervalsT");
      expect(result).toContain('message="Sprint intervals!"');
      expect(result).toContain('timeoffset="0"');
    });

    it("should not encode text events when none are present", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "No Text Events",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 300 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).not.toContain("textevent");
    });

    it("should encode text events for different interval types", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Mixed Intervals with Text Events",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 600 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "range" as const, min: 50, max: 75 },
                },
                intensity: "warmup" as const,
                notes: "Easy warmup",
                extensions: {
                  zwift: {
                    textEvents: [
                      {
                        message: "Easy warmup",
                        timeoffset: 0,
                      },
                    ],
                  },
                },
              },
              {
                stepIndex: 1,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 300 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
                notes: "Steady effort",
                extensions: {
                  zwift: {
                    textEvents: [
                      {
                        message: "Steady effort",
                        timeoffset: 0,
                      },
                    ],
                  },
                },
              },
              {
                stepIndex: 2,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 600 },
                targetType: "open" as const,
                target: { type: "open" as const },
                intensity: "recovery" as const,
                notes: "Free ride",
                extensions: {
                  zwift: {
                    textEvents: [
                      {
                        message: "Free ride",
                        timeoffset: 0,
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain('message="Easy warmup"');
      expect(result).toContain('message="Steady effort"');
      expect(result).toContain('message="Free ride"');
    });
  });

  describe("extension restoration", () => {
    it("should restore durationType from extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Distance Workout",
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "distance" as const,
                duration: { type: "distance" as const, meters: 5000 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
              },
            ],
          },
          zwift: {
            durationType: "distance",
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      // Note: durationType is not included in generated XML as it's not part of Zwift XSD schema
      // It's stored in extensions for round-trip preservation but not written to XML
      expect(result).not.toContain("<durationType>");
    });

    it("should restore thresholdSecPerKm from extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Running Workout",
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 300 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
              },
            ],
          },
          zwift: {
            thresholdSecPerKm: 240,
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("<thresholdSecPerKm>240</thresholdSecPerKm>");
    });

    it("should restore tags from extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Tagged Workout",
            sport: "cycling",
            steps: [],
          },
          zwift: {
            tags: ["FTP", "Intervals", "Hard"],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain('name="FTP"');
      expect(result).toContain('name="Intervals"');
      expect(result).toContain('name="Hard"');
    });

    it("should restore FlatRoad attribute from step extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "FreeRide Workout",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 600 },
                targetType: "open" as const,
                target: { type: "open" as const },
                intensity: "recovery" as const,
                extensions: {
                  zwift: {
                    FlatRoad: 1,
                  },
                },
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("FreeRide");
      expect(result).toContain('FlatRoad="1"');
    });

    it("should restore all Zwift extensions together", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Complete Workout",
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "distance" as const,
                duration: { type: "distance" as const, meters: 5000 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "percent_ftp" as const, value: 100 },
                },
                intensity: "active" as const,
                extensions: {
                  zwift: {
                    FlatRoad: 0,
                  },
                },
              },
            ],
          },
          zwift: {
            author: "Test Author",
            description: "Workout with all extensions",
            tags: ["Test", "Extensions"],
            durationType: "distance",
            thresholdSecPerKm: 240,
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("<author>Test Author</author>");
      expect(result).toContain(
        "<description>Workout with all extensions</description>"
      );
      expect(result).toContain('name="Test"');
      expect(result).toContain('name="Extensions"');
      // Note: durationType is not included in generated XML as it's not part of Zwift XSD schema
      expect(result).toContain("<thresholdSecPerKm>240</thresholdSecPerKm>");
    });

    it("should not include durationType when not present in extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Simple Workout",
            sport: "cycling",
            steps: [],
          },
          zwift: {},
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).not.toContain("<durationType>");
    });

    it("should not include thresholdSecPerKm when not present in extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Simple Workout",
            sport: "cycling",
            steps: [],
          },
          zwift: {},
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).not.toContain("<thresholdSecPerKm>");
    });

    it("should not include FlatRoad when not present in step extensions", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "FreeRide Without FlatRoad",
            sport: "cycling",
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 600 },
                targetType: "open" as const,
                target: { type: "open" as const },
                intensity: "recovery" as const,
              },
            ],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).toContain("FreeRide");
      expect(result).not.toContain('FlatRoad="');
    });

    it("should handle empty tags array", async () => {
      // Arrange
      const krd = {
        version: "1.0",
        type: "structured_workout" as const,
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "No Tags Workout",
            sport: "cycling",
            steps: [],
          },
          zwift: {
            tags: [],
          },
        },
      };

      const mockValidator = vi.fn<ZwiftValidator>().mockResolvedValue({
        valid: true,
        errors: [],
      });
      const logger = createMockLogger();
      const writer = createFastXmlZwiftWriter(logger, mockValidator);

      // Act
      const result = await writer(krd);

      // Assert
      expect(result).not.toContain("<tags>");
    });
  });
});
