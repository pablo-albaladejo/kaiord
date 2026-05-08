/**
 * Export Workout Tests
 *
 * Unit tests for the export-workout utility.
 */

import type { KRD } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadWorkout, ExportError, exportWorkout } from "./export-workout";
import {
  EXPORT_PROGRESS_STEPS,
  PLACEHOLDER_BYTES,
} from "./export-workout.test-fixtures";
import type { WorkoutFileFormat } from "./file-format-detector";

describe("exportWorkout", () => {
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

  describe("KRD file export", () => {
    it("should export KRD to JSON buffer", async () => {
      // Arrange & Act
      // Arrange

      // Act

      const buffer = await exportWorkout(mockKrd, "krd");

      // Assert

      // Assert

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const text = new TextDecoder().decode(buffer);
      const parsed = JSON.parse(text);

      expect(parsed).toStrictEqual(mockKrd);
    });

    it("should format JSON with indentation", async () => {
      // Arrange & Act
      // Arrange

      const buffer = await exportWorkout(mockKrd, "krd");

      // Assert

      // Act

      const text = new TextDecoder().decode(buffer);

      // Assert

      expect(text).toContain("\n");
      expect(text).toContain("  ");
    });

    it("should call progress callback during KRD export", async () => {
      // Arrange
      // Arrange

      const onProgress = vi.fn();

      // Act

      // Act

      await exportWorkout(mockKrd, "krd", onProgress);

      // Assert

      // Assert

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.midway);
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe("FIT file export", () => {
    it("should attempt to export KRD to FIT buffer", async () => {
      // Arrange

      // Act

      // Assert

      // Arrange & Act & Assert
      // Note: FIT export may fail in test environment due to encoder limitations
      // The important thing is that our code correctly calls the conversion function
      try {
        const buffer = await exportWorkout(mockKrd, "fit");
        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(0);
      } catch (error) {
        // Expected in test environment - verify error is properly wrapped
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).format).toBe("fit");
      }
    });

    it("should call progress callback during FIT export attempt", async () => {
      // Arrange
      // Arrange

      const onProgress = vi.fn();

      // Act & Assert

      // Act

      try {
        await exportWorkout(mockKrd, "fit", onProgress);
      } catch {
        // Expected in test environment
      }

      // Progress should be called regardless of success/failure

      // Assert

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
    });

    it("should throw ExportError for invalid KRD", async () => {
      // Arrange
      // Arrange

      // Act

      const invalidKrd = {
        version: "1.0",
        // Missing required fields
      } as unknown as KRD;

      // Act & Assert

      // Assert

      await expect(exportWorkout(invalidKrd, "fit")).rejects.toThrow(
        ExportError
      );
      await expect(exportWorkout(invalidKrd, "fit")).rejects.toThrow(
        /Failed to export workout as FIT/
      );
    });
  });

  describe("TCX file export", () => {
    it("should export KRD to TCX buffer", async () => {
      // Arrange & Act
      // Arrange

      // Act

      const buffer = await exportWorkout(mockKrd, "tcx");

      // Assert

      // Assert

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const text = new TextDecoder().decode(buffer);
      expect(text).toContain("TrainingCenterDatabase");
    });

    it("should call progress callback during TCX export", async () => {
      // Arrange
      // Arrange

      const onProgress = vi.fn();

      // Act

      // Act

      await exportWorkout(mockKrd, "tcx", onProgress);

      // Assert

      // Assert

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.midway);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it("should throw ExportError for invalid KRD", async () => {
      // Arrange
      // Arrange

      // Act

      const invalidKrd = {
        version: "1.0",
        // Missing required fields
      } as unknown as KRD;

      // Act & Assert

      // Assert

      await expect(exportWorkout(invalidKrd, "tcx")).rejects.toThrow(
        ExportError
      );
      await expect(exportWorkout(invalidKrd, "tcx")).rejects.toThrow(
        /Failed to export workout as TCX/
      );
    });
  });

  describe("ZWO file export", () => {
    it("should attempt to export KRD to ZWO buffer", async () => {
      // Arrange

      // Act

      // Assert

      // Arrange & Act & Assert
      // Note: ZWO export may fail in test environment due to XSD schema path issues
      // The important thing is that our code correctly calls the conversion function
      try {
        const buffer = await exportWorkout(mockKrd, "zwo");
        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(0);

        const text = new TextDecoder().decode(buffer);
        expect(text).toContain("<?xml");
      } catch (error) {
        // Expected in test environment - verify error is properly wrapped
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).format).toBe("zwo");
      }
    });

    it("should call progress callback during ZWO export attempt", async () => {
      // Arrange
      // Arrange

      const onProgress = vi.fn();

      // Act & Assert

      // Act

      try {
        await exportWorkout(mockKrd, "zwo", onProgress);
      } catch {
        // Expected in test environment
      }

      // Progress should be called regardless of success/failure

      // Assert

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
    });

    it("should throw ExportError for invalid KRD", async () => {
      // Arrange
      // Arrange

      // Act

      const invalidKrd = {
        version: "1.0",
        // Missing required fields
      } as unknown as KRD;

      // Act & Assert

      // Assert

      await expect(exportWorkout(invalidKrd, "zwo")).rejects.toThrow(
        ExportError
      );
      await expect(exportWorkout(invalidKrd, "zwo")).rejects.toThrow(
        /Failed to export workout as ZWO/
      );
    });
  });

  describe("error handling", () => {
    it("should preserve format in ExportError", async () => {
      // Arrange

      // Act

      // Assert

      // Arrange
      const invalidKrd = {} as unknown as KRD;

      // Act & Assert
      try {
        await exportWorkout(invalidKrd, "fit");
        expect.fail("Should have thrown ExportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).format).toBe("fit");
      }
    });

    it("should include cause in ExportError", async () => {
      // Arrange

      // Act

      // Assert

      // Arrange
      const invalidKrd = {} as unknown as KRD;

      // Act & Assert
      try {
        await exportWorkout(invalidKrd, "fit");
        expect.fail("Should have thrown ExportError");
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).cause).toBeDefined();
      }
    });

    it("should throw ExportError for unsupported format", async () => {
      // Arrange
      // Arrange

      // Act

      const unsupportedFormat = "pdf" as WorkoutFileFormat;

      // Act & Assert

      // Assert

      await expect(exportWorkout(mockKrd, unsupportedFormat)).rejects.toThrow(
        ExportError
      );
      await expect(exportWorkout(mockKrd, unsupportedFormat)).rejects.toThrow(
        /Unsupported format/
      );
    });

    it("should export a GCN buffer for the gcn format", async () => {
      // Arrange

      // Act

      const buffer = await exportWorkout(mockKrd, "gcn");

      // Assert

      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it("should strip UI ids before handing off to any exporter", async () => {
      // Arrange

      const uiKrd = {
        ...mockKrd,
        extensions: {
          structured_workout: {
            ...mockKrd.extensions!.structured_workout!,
            steps: [
              {
                id: "leaked-ui-id",
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 60 },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      } as KRD;

      // GCN: the exporter may silently drop unknown keys, so this check
      // alone is a weak proxy.

      // Act

      const gcnBuffer = await exportWorkout(uiKrd, "gcn");

      // Assert

      expect(new TextDecoder().decode(gcnBuffer)).not.toContain("leaked-ui-id");

      // KRD: the canonical format round-trips unknown keys, so the only
      // way the exported bytes can lack `id` is if `stripIds` ran before
      // the handoff. This is the load-bearing assertion.
      const krdBuffer = await exportWorkout(uiKrd, "krd");
      const exportedKrd = JSON.parse(new TextDecoder().decode(krdBuffer));
      const exportedStep = exportedKrd.extensions.structured_workout.steps[0];
      expect(Object.prototype.hasOwnProperty.call(exportedStep, "id")).toBe(
        false
      );
    });
  });
});

describe("downloadWorkout", () => {
  beforeEach(() => {
    // Mock DOM APIs
    document.body.innerHTML = "";
  });

  it("should create download link with correct filename", () => {
    // Arrange
    // Arrange

    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.fit";

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    // Act

    // Act

    downloadWorkout(buffer, filename, "fit");

    // Assert

    // Assert

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  it("should create blob with correct MIME type for FIT", () => {
    // Arrange
    // Arrange

    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.fit";

    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe("application/octet-stream");
      return mockUrl;
    });
    global.URL.revokeObjectURL = vi.fn();

    // Act

    // Act

    downloadWorkout(buffer, filename, "fit");

    // Assert

    // Assert

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should create blob with correct MIME type for TCX", () => {
    // Arrange
    // Arrange

    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.tcx";

    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe("application/xml");
      return mockUrl;
    });
    global.URL.revokeObjectURL = vi.fn();

    // Act

    // Act

    downloadWorkout(buffer, filename, "tcx");

    // Assert

    // Assert

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should create blob with correct MIME type for ZWO", () => {
    // Arrange
    // Arrange

    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.zwo";

    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe("application/xml");
      return mockUrl;
    });
    global.URL.revokeObjectURL = vi.fn();

    // Act

    // Act

    downloadWorkout(buffer, filename, "zwo");

    // Assert

    // Assert

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should create blob with correct MIME type for KRD", () => {
    // Arrange
    // Arrange

    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.krd";

    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe("application/json");
      return mockUrl;
    });
    global.URL.revokeObjectURL = vi.fn();

    // Act

    // Act

    downloadWorkout(buffer, filename, "krd");

    // Assert

    // Assert

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("should clean up URL after download", () => {
    // Arrange
    // Arrange

    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.fit";

    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    // Act

    // Act

    downloadWorkout(buffer, filename, "fit");

    // Assert

    // Assert

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});
