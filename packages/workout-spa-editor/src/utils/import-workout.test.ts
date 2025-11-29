/**
 * Import Workout Tests
 *
 * Unit tests for the import-workout utility.
 */

import type { KRD } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";
import { ImportError, importWorkout } from "./import-workout";

/**
 * Creates a mock File object with arrayBuffer support for testing
 */
const createMockFile = (
  content: string | Uint8Array,
  filename: string
): File => {
  const buffer =
    typeof content === "string" ? new TextEncoder().encode(content) : content;

  const file = new File([buffer as BlobPart], filename, {
    type: "application/json",
  });

  // Mock arrayBuffer method for jsdom environment
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => buffer.buffer,
    writable: false,
  });

  return file;
};

describe("importWorkout", () => {
  describe("KRD file import", () => {
    it("should import valid KRD JSON file", async () => {
      // Arrange
      const mockKrd: KRD = {
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

      const jsonContent = JSON.stringify(mockKrd);
      const file = createMockFile(jsonContent, "workout.krd");

      // Act
      const result = await importWorkout(file);

      // Assert
      expect(result).toStrictEqual(mockKrd);
    });

    it("should import KRD file with .json extension", async () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            name: "Cycling Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const jsonContent = JSON.stringify(mockKrd);
      const file = createMockFile(jsonContent, "workout.json");

      // Act
      const result = await importWorkout(file);

      // Assert
      expect(result.type).toBe("workout");
      expect(result.metadata.sport).toBe("cycling");
    });

    it("should throw ImportError for invalid JSON", async () => {
      // Arrange
      const invalidJson = "{ invalid json }";
      const file = createMockFile(invalidJson, "invalid.krd");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(
        /Failed to parse KRD file/
      );
    });

    it("should provide useful error message for invalid JSON", async () => {
      // Arrange
      const invalidJson = '{\n  "name": "test",\n  "value": invalid\n}';
      const file = createMockFile(invalidJson, "invalid.krd");

      // Act & Assert
      try {
        await importWorkout(file);
        expect.fail("Should have thrown ImportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImportError);
        // Error message should be useful even without line/column
        expect((error as ImportError).message).toContain("Invalid JSON");
        expect((error as ImportError).message.length).toBeGreaterThan(20);
      }
    });

    it("should throw ValidationError for missing required fields", async () => {
      // Arrange
      const invalidKrd = JSON.stringify({
        version: "1.0",
        // missing type and metadata
      });
      const file = createMockFile(invalidKrd, "invalid.krd");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(/Validation failed/);
    });

    it("should list all missing fields in validation error", async () => {
      // Arrange
      const invalidKrd = JSON.stringify({
        version: "1.0",
        type: "workout",
        metadata: {
          // missing created and sport
        },
      });
      const file = createMockFile(invalidKrd, "invalid.krd");

      // Act & Assert
      try {
        await importWorkout(file);
        expect.fail("Should have thrown ImportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImportError);
        expect((error as ImportError).message).toContain("metadata.created");
        expect((error as ImportError).message).toContain("metadata.sport");
      }
    });

    it("should call progress callback during KRD import", async () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test",
            sport: "running",
            steps: [],
          },
        },
      };

      const jsonContent = JSON.stringify(mockKrd);
      const file = createMockFile(jsonContent, "workout.krd");

      const onProgress = vi.fn();

      // Act
      await importWorkout(file, onProgress);

      // Assert
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(40);
      expect(onProgress).toHaveBeenCalledWith(70);
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe("format detection errors", () => {
    it("should throw ImportError for unsupported file extension", async () => {
      // Arrange
      const buffer = new Uint8Array([1, 2, 3]);
      const file = createMockFile(buffer, "workout.txt");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(
        /Unsupported file format/
      );
    });

    it("should throw ImportError for empty filename", async () => {
      // Arrange
      const buffer = new Uint8Array([1, 2, 3]);
      const file = createMockFile(buffer, "");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(/Invalid filename/);
    });

    it("should throw ImportError for filename without extension", async () => {
      // Arrange
      const buffer = new Uint8Array([1, 2, 3]);
      const file = createMockFile(buffer, "workout");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(
        /Unsupported file format/
      );
    });
  });

  describe("error handling", () => {
    it("should preserve format in ImportError", async () => {
      // Arrange
      const invalidJson = "not json";
      const file = createMockFile(invalidJson, "workout.krd");

      // Act & Assert
      try {
        await importWorkout(file);
        expect.fail("Should have thrown ImportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImportError);
        expect((error as ImportError).format).toBe("krd");
      }
    });

    it("should include cause in ImportError", async () => {
      // Arrange
      const invalidJson = "{ invalid }";
      const file = createMockFile(invalidJson, "workout.krd");

      // Act & Assert
      try {
        await importWorkout(file);
        expect.fail("Should have thrown ImportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImportError);
        expect((error as ImportError).cause).toBeDefined();
      }
    });
  });

  describe("FIT file import", () => {
    it("should throw ImportError for invalid FIT file", async () => {
      // Arrange
      const invalidFitData = new Uint8Array([0, 0, 0, 0]);
      const file = createMockFile(invalidFitData, "workout.fit");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(
        /Failed to parse FIT file/
      );
    });

    it("should call progress callback during FIT import", async () => {
      // Arrange
      const invalidFitData = new Uint8Array([0, 0, 0, 0]);
      const file = createMockFile(invalidFitData, "workout.fit");
      const onProgress = vi.fn();

      // Act & Assert
      try {
        await importWorkout(file, onProgress);
      } catch {
        // Expected to fail, but progress should still be called
      }

      // Assert
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });

  describe("TCX file import", () => {
    it("should throw ImportError for invalid TCX file", async () => {
      // Arrange
      const invalidTcxData = new TextEncoder().encode("<invalid>xml</invalid>");
      const file = createMockFile(invalidTcxData, "workout.tcx");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(
        /Failed to parse TCX file/
      );
    });

    it("should call progress callback during TCX import", async () => {
      // Arrange
      const invalidTcxData = new TextEncoder().encode("<invalid>xml</invalid>");
      const file = createMockFile(invalidTcxData, "workout.tcx");
      const onProgress = vi.fn();

      // Act & Assert
      try {
        await importWorkout(file, onProgress);
      } catch {
        // Expected to fail, but progress should still be called
      }

      // Assert
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });

  describe("ZWO file import", () => {
    it("should throw ImportError for invalid ZWO file", async () => {
      // Arrange
      const invalidZwoData = new TextEncoder().encode("<invalid>xml</invalid>");
      const file = createMockFile(invalidZwoData, "workout.zwo");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(ImportError);
      await expect(importWorkout(file)).rejects.toThrow(
        /Failed to parse ZWO file/
      );
    });

    it("should call progress callback during ZWO import", async () => {
      // Arrange
      const invalidZwoData = new TextEncoder().encode("<invalid>xml</invalid>");
      const file = createMockFile(invalidZwoData, "workout.zwo");
      const onProgress = vi.fn();

      // Act & Assert
      try {
        await importWorkout(file, onProgress);
      } catch {
        // Expected to fail, but progress should still be called
      }

      // Assert
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });
});
