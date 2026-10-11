/**
 * Import Workout Tests
 *
 * Unit tests for the import-workout utility.
 */

import type { KRD } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { ImportError, importWorkout } from "./import-workout";
import {
  ERROR_MESSAGE_MIN_LENGTH,
  INVALID_FIT_BYTES_4,
  KRD_PROGRESS_STEPS,
  NON_KRD_FAILED_PROGRESS_STEPS,
  PLACEHOLDER_BYTES_3,
} from "./import-workout.test-fixtures";

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

const INVALID_XML = "<invalid>xml</invalid>";

describe("importWorkout", () => {
  describe("KRD file import", () => {
    it("should import valid KRD JSON file", async () => {
      // Arrange
      const mockKrd: KRD = {
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
        type: "structured_workout",
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

      const jsonContent = JSON.stringify(mockKrd);
      const file = createMockFile(jsonContent, "workout.json");

      // Act
      const result = await importWorkout(file);

      // Assert
      expect(result.type).toBe("structured_workout");
      expect(result.metadata.sport).toBe("cycling");
    });

    it("should throw ImportError for invalid JSON", async () => {
      // Arrange
      const invalidJson = "{ invalid json }";
      const file = createMockFile(invalidJson, "invalid.krd");

      // Act
      const rejection = importWorkout(file);

      // Assert
      await expect(rejection).rejects.toThrow(ImportError);
      await expect(rejection).rejects.toThrow(/Failed to parse KRD file/);
    });

    it("should provide useful error message for invalid JSON", async () => {
      // Arrange
      const invalidJson = '{\n  "name": "test",\n  "value": invalid\n}';
      const file = createMockFile(invalidJson, "invalid.krd");

      // Act

      // Assert
      try {
        await importWorkout(file);
        expect.fail("Should have thrown ImportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImportError);
        expect((error as ImportError).message).toContain("Invalid JSON");
        expect((error as ImportError).message.length).toBeGreaterThan(
          ERROR_MESSAGE_MIN_LENGTH
        );
      }
    });

    it("should throw ValidationError for missing required fields", async () => {
      // Arrange
      const invalidKrd = JSON.stringify({
        version: "1.0",
        // missing type and metadata
      });
      const file = createMockFile(invalidKrd, "invalid.krd");

      // Act
      const rejection = importWorkout(file);

      // Assert
      await expect(rejection).rejects.toThrow(ImportError);
      await expect(rejection).rejects.toThrow(/Validation failed/);
    });

    it("should list all missing fields in validation error", async () => {
      // Arrange
      const invalidKrd = JSON.stringify({
        version: "1.0",
        type: "structured_workout",
        metadata: {
          // missing created and sport
        },
      });
      const file = createMockFile(invalidKrd, "invalid.krd");

      // Act

      // Assert
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
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
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
      for (const step of KRD_PROGRESS_STEPS) {
        expect(onProgress).toHaveBeenCalledWith(step);
      }
    });
  });

  describe("format detection errors", () => {
    it("should throw ImportError for unsupported file extension", async () => {
      // Arrange
      const buffer = new Uint8Array(PLACEHOLDER_BYTES_3);
      const file = createMockFile(buffer, "workout.txt");

      // Act
      const rejection = importWorkout(file);

      // Assert
      await expect(rejection).rejects.toThrow(ImportError);
      await expect(rejection).rejects.toThrow(/Unsupported file format/);
    });

    it("should throw ImportError for empty filename", async () => {
      // Arrange
      const buffer = new Uint8Array(PLACEHOLDER_BYTES_3);
      const file = createMockFile(buffer, "");

      // Act
      const rejection = importWorkout(file);

      // Assert
      await expect(rejection).rejects.toThrow(ImportError);
      await expect(rejection).rejects.toThrow(/Invalid filename/);
    });

    it("should throw ImportError for filename without extension", async () => {
      // Arrange
      const buffer = new Uint8Array(PLACEHOLDER_BYTES_3);
      const file = createMockFile(buffer, "workout");

      // Act
      const rejection = importWorkout(file);

      // Assert
      await expect(rejection).rejects.toThrow(ImportError);
      await expect(rejection).rejects.toThrow(/Unsupported file format/);
    });
  });

  describe("error handling", () => {
    it("should preserve format in ImportError", async () => {
      // Arrange
      const invalidJson = "not json";
      const file = createMockFile(invalidJson, "workout.krd");

      // Act

      // Assert
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

      // Act

      // Assert
      try {
        await importWorkout(file);
        expect.fail("Should have thrown ImportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ImportError);
        expect((error as ImportError).cause).toBeDefined();
      }
    });
  });

  describe("non-KRD format imports", () => {
    it.each([
      {
        label: "FIT",
        filename: "workout.fit",
        data: new Uint8Array(INVALID_FIT_BYTES_4),
      },
      {
        label: "TCX",
        filename: "workout.tcx",
        data: new TextEncoder().encode(INVALID_XML),
      },
      {
        label: "ZWO",
        filename: "workout.zwo",
        data: new TextEncoder().encode(INVALID_XML),
      },
    ])(
      "should throw ImportError for invalid $label file",
      async ({ label, filename, data }) => {
        // Arrange
        const file = createMockFile(data, filename);

        // Act
        const rejection = importWorkout(file);

        // Assert
        await expect(rejection).rejects.toThrow(ImportError);
        await expect(rejection).rejects.toThrow(
          new RegExp(`Failed to parse ${label} file`)
        );
      }
    );

    it.each([
      {
        label: "FIT",
        filename: "workout.fit",
        data: new Uint8Array(INVALID_FIT_BYTES_4),
      },
      {
        label: "TCX",
        filename: "workout.tcx",
        data: new TextEncoder().encode(INVALID_XML),
      },
      {
        label: "ZWO",
        filename: "workout.zwo",
        data: new TextEncoder().encode(INVALID_XML),
      },
    ])(
      "should call progress callback during failed $label import",
      async ({ filename, data }) => {
        // Arrange
        const file = createMockFile(data, filename);
        const onProgress = vi.fn();

        // Act
        try {
          await importWorkout(file, onProgress);
        } catch {
          // Expected to fail, but progress should still be called
        }

        // Assert
        expect(onProgress).toHaveBeenCalled();
        for (const step of NON_KRD_FAILED_PROGRESS_STEPS) {
          expect(onProgress).toHaveBeenCalledWith(step);
        }
      }
    );
  });

  describe("TCX import warnings", () => {
    const tcxWorkout = (steps: string) =>
      `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Workouts><Workout Sport="Running"><Name>W</Name>${steps}</Workout></Workouts>
</TrainingCenterDatabase>`;
    const STEP_SECONDS = 60;
    const timeStep = (id: number, tag = "Step", seconds = STEP_SECONDS) =>
      `<${tag} xsi:type="Step_t"><StepId>${id}</StepId><Duration xsi:type="Time_t"><Seconds>${seconds}</Seconds></Duration><Intensity>Active</Intensity><Target xsi:type="None_t"/></${tag}>`;

    it("should import a TCX repeat as a repetition block without warnings", async () => {
      // Arrange
      const xml = tcxWorkout(
        `<Step xsi:type="Repeat_t"><StepId>1</StepId><Repetitions>4</Repetitions>${timeStep(2, "Child")}</Step>`
      );
      const onWarning = vi.fn();

      // Act
      const krd = await importWorkout(
        createMockFile(xml, "repeat.tcx"),
        undefined,
        undefined,
        onWarning
      );

      // Assert
      const steps = (
        krd.extensions?.structured_workout as { steps: Array<object> }
      ).steps;
      expect(steps).toStrictEqual([
        expect.objectContaining({ repeatCount: 4 }),
      ]);
      expect(onWarning).not.toHaveBeenCalled();
    });

    it("should report each step the TCX reader had to skip", async () => {
      // Arrange
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const skipped = `<Step xsi:type="Step_t"><StepId>2</StepId><Duration xsi:type="CaloriesBurned_t"><Calories>100</Calories></Duration><Intensity>Active</Intensity><Target xsi:type="None_t"/></Step>`;
      const xml = tcxWorkout(timeStep(1) + skipped);
      const onWarning = vi.fn();

      // Act
      const krd = await importWorkout(
        createMockFile(xml, "lossy.tcx"),
        undefined,
        undefined,
        onWarning
      );

      // Assert
      const steps = (
        krd.extensions?.structured_workout as { steps: Array<object> }
      ).steps;
      expect(steps).toHaveLength(1);
      expect(onWarning).toHaveBeenCalledWith(
        "Step has no valid duration, skipping"
      );
      warn.mockRestore();
    });
  });

  describe("abort signal support", () => {
    it("should abort KRD import when signal is aborted", async () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Test",
            sport: "running",
            steps: [],
          },
        },
      };

      const jsonContent = JSON.stringify(mockKrd);
      const file = createMockFile(jsonContent, "workout.krd");
      const controller = new AbortController();

      // Act
      controller.abort();

      // Assert
      await expect(
        importWorkout(file, undefined, controller.signal)
      ).rejects.toThrow();
    });
  });
});
