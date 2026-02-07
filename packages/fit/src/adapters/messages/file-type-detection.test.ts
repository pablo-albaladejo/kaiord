import { describe, expect, it } from "vitest";
import { fileTypeSchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";
import { mapMessagesToKRD } from "./messages.mapper";

describe("File type detection", () => {
  const logger = createMockLogger();

  // Helper to create valid session message
  const createValidSession = (overrides = {}) => ({
    sport: "cycling",
    timestamp: 1000,
    startTime: 500,
    totalTimerTime: 3600,
    totalElapsedTime: 3600,
    ...overrides,
  });

  describe("workout file detection", () => {
    it("should detect workout file when workoutMesgs present", () => {
      // Arrange
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 5,
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.workoutMesgs]: [
          {
            wktName: "Test Workout",
            sport: "cycling",
            numValidSteps: 1,
          },
        ],
        [fitMessageKeySchema.enum.workoutStepMesgs]: [
          {
            messageIndex: 0,
            durationType: "time",
            durationTime: 300,
            targetType: "power",
            targetValue: 200,
          },
        ],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.type).toBe(fileTypeSchema.enum.workout);
      expect(krd.metadata.fileType).toBe("workout");
      expect(krd.extensions?.workout).toBeDefined();
    });
  });

  describe("activity file detection", () => {
    it("should detect activity file when sessionMesgs present", () => {
      // Arrange
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 4,
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.sessionMesgs]: [
          createValidSession({
            totalDistance: 10000,
          }),
        ],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.type).toBe(fileTypeSchema.enum.activity);
      expect(krd.metadata.fileType).toBe("activity");
      expect(krd.extensions?.activity).toBeDefined();
    });

    it("should detect activity file when recordMesgs present", () => {
      // Arrange
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 4,
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.recordMesgs]: [
          {
            timestamp: 1000,
            positionLat: 40.7128,
            positionLong: -74.006,
            distance: 100,
          },
        ],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.type).toBe(fileTypeSchema.enum.activity);
      expect(krd.extensions?.activity).toBeDefined();
    });
  });

  describe("file type priority", () => {
    it("should prioritize workout over activity when both present", () => {
      // Arrange - Both workout and session messages
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 5,
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.workoutMesgs]: [
          {
            wktName: "Test",
            sport: "cycling",
            numValidSteps: 1,
          },
        ],
        [fitMessageKeySchema.enum.workoutStepMesgs]: [
          {
            messageIndex: 0,
            durationType: "time",
            durationTime: 300,
            targetType: "open",
          },
        ],
        [fitMessageKeySchema.enum.sessionMesgs]: [createValidSession()],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.type).toBe(fileTypeSchema.enum.workout);
    });
  });

  describe("FILE_ID type field mapping", () => {
    it("should map FILE_ID type 4 to activity", () => {
      // Arrange
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 4, // activity
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.sessionMesgs]: [createValidSession()],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.metadata.fileType).toBe("activity");
    });

    it("should map FILE_ID type 5 to workout", () => {
      // Arrange
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 5, // workout
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.workoutMesgs]: [
          {
            wktName: "Test",
            sport: "cycling",
            numValidSteps: 1,
          },
        ],
        [fitMessageKeySchema.enum.workoutStepMesgs]: [],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.metadata.fileType).toBe("workout");
    });

    it("should map FILE_ID type 6 to course in metadata", () => {
      // Arrange - FILE_ID type 6 but sessionMesgs present means detected as activity
      // However, metadata.fileType should reflect the FILE_ID type
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 6, // course
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.sessionMesgs]: [createValidSession()],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      // File is detected as activity (due to sessionMesgs)
      expect(krd.type).toBe(fileTypeSchema.enum.activity);
      // But fileType in metadata reflects FILE_ID (course)
      expect(krd.metadata.fileType).toBe("course");
    });

    it("should handle unknown FILE_ID types gracefully", () => {
      // Arrange
      const messages: FitMessages = {
        [fitMessageKeySchema.enum.fileIdMesgs]: [
          {
            type: 999, // unknown type
            timeCreated: new Date(),
            manufacturer: "garmin",
          },
        ],
        [fitMessageKeySchema.enum.sessionMesgs]: [createValidSession()],
      };

      // Act
      const krd = mapMessagesToKRD(messages, logger);

      // Assert
      expect(krd.metadata.fileType).toBeUndefined();
    });
  });
});
