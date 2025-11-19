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

describe("file-format-detector", () => {
  describe("detectFormat", () => {
    it("should detect FIT format", () => {
      // Arrange
      const filename = "workout.fit";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("fit");
      }
    });

    it("should detect TCX format", () => {
      // Arrange
      const filename = "workout.tcx";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("tcx");
      }
    });

    it("should detect ZWO format", () => {
      // Arrange
      const filename = "workout.zwo";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("zwo");
      }
    });

    it("should detect KRD format from .krd extension", () => {
      // Arrange
      const filename = "workout.krd";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("krd");
      }
    });

    it("should detect KRD format from .json extension", () => {
      // Arrange
      const filename = "workout.json";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("krd");
      }
    });

    it("should handle uppercase extensions", () => {
      // Arrange
      const filename = "workout.FIT";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("fit");
      }
    });

    it("should handle mixed case extensions", () => {
      // Arrange
      const filename = "workout.TcX";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("tcx");
      }
    });

    it("should handle filenames with multiple dots", () => {
      // Arrange
      const filename = "my.workout.file.zwo";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("zwo");
      }
    });

    it("should handle filenames with paths", () => {
      // Arrange
      const filename = "/path/to/workout.fit";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("fit");
      }
    });

    it("should return error for unsupported format", () => {
      // Arrange
      const filename = "workout.txt";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unsupported file format");
        expect(result.error).toContain(".txt");
        expect(result.error).toContain(".fit");
        expect(result.error).toContain(".tcx");
        expect(result.error).toContain(".zwo");
        expect(result.error).toContain(".krd");
      }
    });

    it("should return error for filename without extension", () => {
      // Arrange
      const filename = "workout";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unsupported file format");
      }
    });

    it("should return error for empty filename", () => {
      // Arrange
      const filename = "";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid filename");
        expect(result.error).toContain("non-empty string");
      }
    });

    it("should return error for whitespace-only filename", () => {
      // Arrange
      const filename = "   ";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid filename");
        expect(result.error).toContain("cannot be empty");
      }
    });

    it("should return error for null filename", () => {
      // Arrange
      const filename = null as unknown as string;

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid filename");
        expect(result.error).toContain("non-empty string");
      }
    });

    it("should return error for undefined filename", () => {
      // Arrange
      const filename = undefined as unknown as string;

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid filename");
        expect(result.error).toContain("non-empty string");
      }
    });

    it("should return error for non-string filename", () => {
      // Arrange
      const filename = 123 as unknown as string;

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid filename");
        expect(result.error).toContain("non-empty string");
      }
    });

    it("should handle filename with only extension", () => {
      // Arrange
      const filename = ".fit";

      // Act
      const result = detectFormat(filename);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.format).toBe("fit");
      }
    });
  });

  describe("isValidFormat", () => {
    it("should return true for fit format", () => {
      // Arrange
      const format = "fit";

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for tcx format", () => {
      // Arrange
      const format = "tcx";

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for zwo format", () => {
      // Arrange
      const format = "zwo";

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for krd format", () => {
      // Arrange
      const format = "krd";

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for invalid format", () => {
      // Arrange
      const format = "txt";

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      // Arrange
      const format = "";

      // Act
      const result = isValidFormat(format);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getMimeType", () => {
    it("should return correct MIME type for FIT", () => {
      // Arrange
      const format: WorkoutFileFormat = "fit";

      // Act
      const result = getMimeType(format);

      // Assert
      expect(result).toBe("application/octet-stream");
    });

    it("should return correct MIME type for TCX", () => {
      // Arrange
      const format: WorkoutFileFormat = "tcx";

      // Act
      const result = getMimeType(format);

      // Assert
      expect(result).toBe("application/xml");
    });

    it("should return correct MIME type for ZWO", () => {
      // Arrange
      const format: WorkoutFileFormat = "zwo";

      // Act
      const result = getMimeType(format);

      // Assert
      expect(result).toBe("application/xml");
    });

    it("should return correct MIME type for KRD", () => {
      // Arrange
      const format: WorkoutFileFormat = "krd";

      // Act
      const result = getMimeType(format);

      // Assert
      expect(result).toBe("application/json");
    });
  });

  describe("getFileExtension", () => {
    it("should return correct extension for FIT", () => {
      // Arrange
      const format: WorkoutFileFormat = "fit";

      // Act
      const result = getFileExtension(format);

      // Assert
      expect(result).toBe("fit");
    });

    it("should return correct extension for TCX", () => {
      // Arrange
      const format: WorkoutFileFormat = "tcx";

      // Act
      const result = getFileExtension(format);

      // Assert
      expect(result).toBe("tcx");
    });

    it("should return correct extension for ZWO", () => {
      // Arrange
      const format: WorkoutFileFormat = "zwo";

      // Act
      const result = getFileExtension(format);

      // Assert
      expect(result).toBe("zwo");
    });

    it("should return correct extension for KRD", () => {
      // Arrange
      const format: WorkoutFileFormat = "krd";

      // Act
      const result = getFileExtension(format);

      // Assert
      expect(result).toBe("krd");
    });
  });

  describe("getFormatName", () => {
    it("should return correct name for FIT", () => {
      // Arrange
      const format: WorkoutFileFormat = "fit";

      // Act
      const result = getFormatName(format);

      // Assert
      expect(result).toBe("FIT");
    });

    it("should return correct name for TCX", () => {
      // Arrange
      const format: WorkoutFileFormat = "tcx";

      // Act
      const result = getFormatName(format);

      // Assert
      expect(result).toBe("TCX");
    });

    it("should return correct name for ZWO", () => {
      // Arrange
      const format: WorkoutFileFormat = "zwo";

      // Act
      const result = getFormatName(format);

      // Assert
      expect(result).toBe("ZWO");
    });

    it("should return correct name for KRD", () => {
      // Arrange
      const format: WorkoutFileFormat = "krd";

      // Act
      const result = getFormatName(format);

      // Assert
      expect(result).toBe("KRD");
    });
  });

  describe("getFormatDescription", () => {
    it("should return description and compatibility for FIT", () => {
      // Arrange
      const format: WorkoutFileFormat = "fit";

      // Act
      const result = getFormatDescription(format);

      // Assert
      expect(result.description).toContain("Garmin FIT");
      expect(result.description).toContain("Binary");
      expect(result.compatibility).toContain("Garmin devices");
      expect(result.compatibility).toContain("Garmin Connect");
      expect(result.compatibility).toContain("TrainingPeaks");
    });

    it("should return description and compatibility for TCX", () => {
      // Arrange
      const format: WorkoutFileFormat = "tcx";

      // Act
      const result = getFormatDescription(format);

      // Assert
      expect(result.description).toContain("Training Center XML");
      expect(result.description).toContain("XML");
      expect(result.compatibility).toContain("Garmin Connect");
      expect(result.compatibility).toContain("TrainingPeaks");
      expect(result.compatibility).toContain("Strava");
    });

    it("should return description and compatibility for ZWO", () => {
      // Arrange
      const format: WorkoutFileFormat = "zwo";

      // Act
      const result = getFormatDescription(format);

      // Assert
      expect(result.description).toContain("Zwift");
      expect(result.description).toContain("XML");
      expect(result.compatibility).toContain("Zwift");
    });

    it("should return description and compatibility for KRD", () => {
      // Arrange
      const format: WorkoutFileFormat = "krd";

      // Act
      const result = getFormatDescription(format);

      // Assert
      expect(result.description).toContain("Kaiord");
      expect(result.description).toContain("JSON");
      expect(result.compatibility).toContain("Kaiord tools");
      expect(result.compatibility).toContain("Web editors");
    });
  });
});
