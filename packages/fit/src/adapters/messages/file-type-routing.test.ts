import { describe, expect, it } from "vitest";
import { fileTypeSchema } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { buildKRD } from "@kaiord/core/test-utils";
import { buildKRDMetadata } from "@kaiord/core/test-utils";
import { createMockLogger } from "@kaiord/core/test-utils";
import { FIT_FILE_TYPE_TO_NUMBER } from "../schemas/fit-file-type";
import { createFitMessages } from "./messages.mapper";

describe("File type routing", () => {
  const logger = createMockLogger();

  describe("createFitMessages routing", () => {
    it("should route to createActivityMessages for activity type", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.recorded_activity,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          recorded_activity: {
            session: {
              sport: "cycling",
              totalDistance: 10000,
            },
            records: [
              {
                timestamp: 1000,
                distance: 100,
              },
            ],
            laps: [],
            events: [],
          },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.fileIdMesgs).toBeDefined();
      expect(messages.fileIdMesgs).toHaveLength(1);
      expect(messages.sessionMesgs).toBeDefined();
      expect(messages.recordMesgs).toBeDefined();
    });

    it("should route to createCourseMessages for course type", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.course,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          course: {
            name: "Test Course",
            sport: "cycling",
          },
          course_points: [
            {
              latitude: 40.7128,
              longitude: -74.006,
              type: "summit",
            },
          ],
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.fileIdMesgs).toBeDefined();
      expect(messages.fileIdMesgs).toHaveLength(1);
      expect(messages.courseMesgs).toBeDefined();
      expect(messages.coursePointMesgs).toBeDefined();
      expect(messages.coursePointMesgs).toHaveLength(1);
    });

    it("should route to convertKRDToMessages for workout type", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.structured_workout,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "cycling",
            steps: [],
          },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.fileIdMesgs).toBeDefined();
      expect(messages.workoutMesgs).toBeDefined();
    });

    it("should default to workout when fileType not specified", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.structured_workout,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert - Should route to workout handler
      expect(messages.fileIdMesgs).toBeDefined();
      expect(messages.workoutMesgs).toBeDefined();
    });

    it("should route structured_workout by default", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.structured_workout,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          structured_workout: {
            name: "Default Workout",
            sport: "cycling",
            steps: [],
          },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.fileIdMesgs).toBeDefined();
      expect(messages.workoutMesgs).toBeDefined();
    });
  });

  describe("FILE_ID message creation", () => {
    it("should create FILE_ID with correct type for activity", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.recorded_activity,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          recorded_activity: {
            session: { sport: "cycling" },
          },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      const fileId = messages.fileIdMesgs[0] as { type: number };
      expect(fileId.type).toBe(FIT_FILE_TYPE_TO_NUMBER.activity);
      expect(fileId.type).toBe(4);
    });

    it("should create FILE_ID with correct type for course", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.course,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          course: { name: "Test" },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      const fileId = messages.fileIdMesgs[0] as { type: number };
      expect(fileId.type).toBe(FIT_FILE_TYPE_TO_NUMBER.course);
      expect(fileId.type).toBe(6);
    });
  });

  describe("activity message structure", () => {
    it("should include all activity components when present", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.recorded_activity,
        metadata: buildKRDMetadata.build({}),
        sessions: [
          {
            sport: "running",
            totalDistance: 5000,
          },
        ],
        records: [{ timestamp: 1000 }, { timestamp: 2000 }],
        laps: [{ timestamp: 3000 }],
        events: [{ timestamp: 1000, event: "timer" }],
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.sessionMesgs).toHaveLength(1);
      expect(messages.recordMesgs).toHaveLength(2);
      expect(messages.lapMesgs).toHaveLength(1);
      expect(messages.eventMesgs).toHaveLength(1);
    });

    it("should handle activity with only session", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.recorded_activity,
        metadata: buildKRDMetadata.build({}),
        sessions: [
          {
            sport: "cycling",
          },
        ],
        records: undefined,
        laps: undefined,
        events: undefined,
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.sessionMesgs).toBeDefined();
      expect(messages.recordMesgs).toBeUndefined();
      expect(messages.lapMesgs).toBeUndefined();
      expect(messages.eventMesgs).toBeUndefined();
    });
  });

  describe("course message structure", () => {
    it("should include course and course points", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.course,
        metadata: buildKRDMetadata.build({}),
        extensions: {
          course: {
            name: "Mountain Loop",
            sport: "cycling",
          },
          course_points: [
            {
              latitude: 40.7128,
              longitude: -74.006,
              type: "summit",
              name: "Peak 1",
            },
            {
              latitude: 40.7129,
              longitude: -74.007,
              type: "water",
              name: "Water Stop",
            },
          ],
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.courseMesgs).toHaveLength(1);
      expect(messages.coursePointMesgs).toHaveLength(2);
    });

    it("should include optional records and laps for courses", () => {
      // Arrange
      const krd: KRD = buildKRD.build({
        type: fileTypeSchema.enum.course,
        metadata: buildKRDMetadata.build({}),
        records: [{ timestamp: 1000 }] as unknown as KRD["records"],
        laps: [{ timestamp: 2000 }] as unknown as KRD["laps"],
        extensions: {
          course: {
            name: "Route with track",
          },
        },
      });

      // Act
      const messages = createFitMessages(krd, logger);

      // Assert
      expect(messages.recordMesgs).toHaveLength(1);
      expect(messages.lapMesgs).toHaveLength(1);
    });
  });
});
