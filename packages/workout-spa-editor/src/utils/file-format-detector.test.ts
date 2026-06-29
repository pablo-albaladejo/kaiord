/**
 * File Format Detector Tests
 *
 * Tests for workout file format detection and validation.
 */

import { describe, expect, it } from "vitest";

import {
  detectFormat,
  getMimeType,
  isValidFormat,
  type WorkoutFileFormat,
} from "./file-format-detector";
import {
  getFileExtension,
  getFormatDescription,
  getFormatName,
} from "./file-format-metadata";

const NON_STRING_FILENAME_SENTINEL = 123;

describe("file-format-detector", () => {
  describe("detectFormat", () => {
    it.each<{ filename: string; expected: WorkoutFileFormat }>([
      { filename: "workout.fit", expected: "fit" },
      { filename: "workout.tcx", expected: "tcx" },
      { filename: "workout.zwo", expected: "zwo" },
      { filename: "workout.gcn", expected: "gcn" },
      { filename: "workout.krd", expected: "krd" },
      { filename: "workout.json", expected: "krd" },
      { filename: "workout.FIT", expected: "fit" },
      { filename: "workout.TcX", expected: "tcx" },
      { filename: "my.workout.file.zwo", expected: "zwo" },
      { filename: "/path/to/workout.fit", expected: "fit" },
      { filename: ".fit", expected: "fit" },
    ])(
      "should detect $expected format from $filename",
      ({ filename, expected }) => {
        // Arrange

        // Act
        const result = detectFormat(filename);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.format).toBe(expected);
        }
      }
    );

    it.each<{
      scenario: string;
      filename: unknown;
      expectedErrors: ReadonlyArray<string>;
    }>([
      {
        scenario: "unsupported extension",
        filename: "workout.txt",
        expectedErrors: [
          "Unsupported file format",
          ".txt",
          ".fit",
          ".tcx",
          ".zwo",
          ".krd",
        ],
      },
      {
        scenario: "filename without extension",
        filename: "workout",
        expectedErrors: ["Unsupported file format"],
      },
      {
        scenario: "empty filename",
        filename: "",
        expectedErrors: ["Invalid filename", "non-empty string"],
      },
      {
        scenario: "whitespace-only filename",
        filename: "   ",
        expectedErrors: ["Invalid filename", "cannot be empty"],
      },
      {
        scenario: "null filename",
        filename: null,
        expectedErrors: ["Invalid filename", "non-empty string"],
      },
      {
        scenario: "undefined filename",
        filename: undefined,
        expectedErrors: ["Invalid filename", "non-empty string"],
      },
      {
        scenario: "non-string filename",
        filename: NON_STRING_FILENAME_SENTINEL,
        expectedErrors: ["Invalid filename", "non-empty string"],
      },
    ])("should return error for $scenario", ({ filename, expectedErrors }) => {
      // Arrange

      // Act
      const result = detectFormat(filename as string);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expectedErrors.forEach((expectedError) => {
          expect(result.error).toContain(expectedError);
        });
      }
    });
  });

  describe("isValidFormat", () => {
    it.each<{ format: string }>([
      { format: "fit" },
      { format: "tcx" },
      { format: "zwo" },
      { format: "gcn" },
      { format: "krd" },
    ])("should return true for $format format", ({ format }) => {
      // Arrange

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(true);
    });

    it.each<{ scenario: string; format: string }>([
      { scenario: "invalid format", format: "txt" },
      { scenario: "empty string", format: "" },
    ])("should return false for $scenario", ({ format }) => {
      // Arrange

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getMimeType", () => {
    it.each<{ format: WorkoutFileFormat; mimeType: string }>([
      { format: "fit", mimeType: "application/octet-stream" },
      { format: "tcx", mimeType: "application/xml" },
      { format: "zwo", mimeType: "application/xml" },
      { format: "krd", mimeType: "application/json" },
      { format: "gcn", mimeType: "application/json" },
    ])(
      "should return $mimeType MIME type for $format",
      ({ format, mimeType }) => {
        // Arrange

        // Act
        const result = getMimeType(format);

        // Assert
        expect(result).toBe(mimeType);
      }
    );
  });

  describe("getFileExtension", () => {
    it.each<{ format: WorkoutFileFormat; extension: string }>([
      { format: "fit", extension: "fit" },
      { format: "tcx", extension: "tcx" },
      { format: "zwo", extension: "zwo" },
      { format: "krd", extension: "krd" },
      { format: "gcn", extension: "gcn" },
    ])(
      "should return $extension extension for $format",
      ({ format, extension }) => {
        // Arrange

        // Act
        const result = getFileExtension(format);

        // Assert
        expect(result).toBe(extension);
      }
    );
  });

  describe("getFormatName", () => {
    it.each<{ format: WorkoutFileFormat; name: string }>([
      { format: "fit", name: "FIT" },
      { format: "tcx", name: "TCX" },
      { format: "zwo", name: "ZWO" },
      { format: "krd", name: "KRD" },
      { format: "gcn", name: "GCN" },
    ])("should return $name name for $format", ({ format, name }) => {
      // Arrange

      // Act
      const result = getFormatName(format);

      // Assert
      expect(result).toBe(name);
    });
  });

  describe("getFormatDescription", () => {
    it.each<{
      format: WorkoutFileFormat;
      descriptionParts: ReadonlyArray<string>;
      compatibilityParts: ReadonlyArray<string>;
    }>([
      {
        format: "fit",
        descriptionParts: ["Garmin FIT", "Binary"],
        compatibilityParts: [
          "Garmin devices",
          "Garmin Connect",
          "TrainingPeaks",
        ],
      },
      {
        format: "tcx",
        descriptionParts: ["Training Center XML", "XML"],
        compatibilityParts: ["Garmin Connect", "TrainingPeaks", "Strava"],
      },
      {
        format: "zwo",
        descriptionParts: ["Zwift", "XML"],
        compatibilityParts: ["Zwift"],
      },
      {
        format: "krd",
        descriptionParts: ["Kaiord", "JSON"],
        compatibilityParts: ["Kaiord tools", "Web editors"],
      },
      {
        format: "gcn",
        descriptionParts: ["Garmin Connect", "JSON"],
        compatibilityParts: ["Garmin Connect", "Garmin devices"],
      },
    ])(
      "should return description and compatibility for $format",
      ({ format, descriptionParts, compatibilityParts }) => {
        // Arrange

        // Act
        const result = getFormatDescription(format);

        // Assert
        descriptionParts.forEach((part) => {
          expect(result.description).toContain(part);
        });
        compatibilityParts.forEach((part) => {
          expect(result.compatibility).toContain(part);
        });
      }
    );
  });
});
