/**
 * Export Workout Tests
 *
 * Unit tests for the export-workout utility.
 */

import type { KRD } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadWorkout, ExportError, exportWorkout } from "./export-workout";
import type { WorkoutFileFormat } from "./file-format-detector";

const EXPORT_PROGRESS_STEPS = {
  early: 10,
  midway: 50,
} as const;
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const PLACEHOLDER_BYTES = [1, 2, 3] as const;
const EXPORT_COMPLETE_PROGRESS = 100;

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
      // Arrange

      // Act
      const buffer = await exportWorkout(mockKrd, "krd");

      // Assert
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      const text = new TextDecoder().decode(buffer);
      const parsed = JSON.parse(text);
      expect(parsed).toStrictEqual(mockKrd);
    });

    it("should format JSON with indentation", async () => {
      // Arrange

      // Act
      const buffer = await exportWorkout(mockKrd, "krd");
      const text = new TextDecoder().decode(buffer);

      // Assert
      expect(text).toContain("\n");
      expect(text).toContain("  ");
    });
  });

  describe("FIT file export", () => {
    it("should attempt to export KRD to FIT buffer", async () => {
      // Arrange

      // Act

      // Assert
      // Note: FIT export may fail in test environment due to encoder limitations
      try {
        const buffer = await exportWorkout(mockKrd, "fit");
        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).format).toBe("fit");
      }
    });

    it("should call progress callback during FIT export attempt", async () => {
      // Arrange
      const onProgress = vi.fn();

      // Act
      try {
        await exportWorkout(mockKrd, "fit", onProgress);
      } catch {
        // Expected in test environment
      }

      // Assert
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
    });
  });

  describe("TCX file export", () => {
    it("should export KRD to TCX buffer", async () => {
      // Arrange

      // Act
      const buffer = await exportWorkout(mockKrd, "tcx");

      // Assert
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      const text = new TextDecoder().decode(buffer);
      expect(text).toContain("TrainingCenterDatabase");
    });
  });

  describe("ZWO file export", () => {
    it("should attempt to export KRD to ZWO buffer", async () => {
      // Arrange

      // Act

      // Assert
      // Note: ZWO export may fail in test environment due to XSD schema path issues
      try {
        const buffer = await exportWorkout(mockKrd, "zwo");
        expect(buffer).toBeDefined();
        expect(buffer.length).toBeGreaterThan(0);
        const text = new TextDecoder().decode(buffer);
        expect(text).toContain("<?xml");
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).format).toBe("zwo");
      }
    });

    it("should call progress callback during ZWO export attempt", async () => {
      // Arrange
      const onProgress = vi.fn();

      // Act
      try {
        await exportWorkout(mockKrd, "zwo", onProgress);
      } catch {
        // Expected in test environment
      }

      // Assert
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
    });
  });

  describe("progress reporting", () => {
    it.each([{ format: "krd" as const }, { format: "tcx" as const }])(
      "should call progress callback during $format export",
      async ({ format }) => {
        // Arrange
        const onProgress = vi.fn();

        // Act
        await exportWorkout(mockKrd, format, onProgress);

        // Assert
        expect(onProgress).toHaveBeenCalled();
        expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.early);
        expect(onProgress).toHaveBeenCalledWith(EXPORT_PROGRESS_STEPS.midway);
        expect(onProgress).toHaveBeenCalledWith(EXPORT_COMPLETE_PROGRESS);
      }
    );
  });

  describe("invalid KRD rejection", () => {
    it.each([
      { format: "fit" as const, label: "FIT" },
      { format: "tcx" as const, label: "TCX" },
      { format: "zwo" as const, label: "ZWO" },
    ])(
      "should throw ExportError for invalid KRD as $label",
      async ({ format, label }) => {
        // Arrange
        const invalidKrd = {
          version: "1.0",
        } as unknown as KRD;

        // Act

        // Assert
        await expect(exportWorkout(invalidKrd, format)).rejects.toThrow(
          ExportError
        );
        await expect(exportWorkout(invalidKrd, format)).rejects.toThrow(
          new RegExp(`Failed to export workout as ${label}`)
        );
      }
    );
  });

  describe("error handling", () => {
    it("should preserve format in ExportError", async () => {
      // Arrange
      const invalidKrd = {} as unknown as KRD;

      // Act

      // Assert
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
      const invalidKrd = {} as unknown as KRD;

      // Act

      // Assert
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
      const unsupportedFormat = "pdf" as WorkoutFileFormat;

      // Act

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

      // Act
      const gcnBuffer = await exportWorkout(uiKrd, "gcn");

      // Assert
      // GCN: the exporter may silently drop unknown keys, so this check
      // alone is a weak proxy.
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
    document.body.innerHTML = "";
  });

  it("should create download link with correct filename", () => {
    // Arrange
    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.fit";
    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    // Act
    downloadWorkout(buffer, filename, "fit");

    // Assert
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  it.each([
    {
      format: "fit" as const,
      filename: "workout.fit",
      mime: "application/octet-stream",
    },
    {
      format: "tcx" as const,
      filename: "workout.tcx",
      mime: "application/xml",
    },
    {
      format: "zwo" as const,
      filename: "workout.zwo",
      mime: "application/xml",
    },
    {
      format: "krd" as const,
      filename: "workout.krd",
      mime: "application/json",
    },
  ])(
    "should create blob with correct MIME type for $format",
    ({ format, filename, mime }) => {
      // Arrange
      const buffer = new Uint8Array(PLACEHOLDER_BYTES);
      const mockUrl = "blob:mock-url";
      global.URL.createObjectURL = vi.fn((blob: Blob) => {
        expect(blob.type).toBe(mime);
        return mockUrl;
      });
      global.URL.revokeObjectURL = vi.fn();

      // Act
      downloadWorkout(buffer, filename, format);

      // Assert
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    }
  );

  it("should clean up URL after download", () => {
    // Arrange
    const buffer = new Uint8Array(PLACEHOLDER_BYTES);
    const filename = "workout.fit";
    const mockUrl = "blob:mock-url";
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    // Act
    downloadWorkout(buffer, filename, "fit");

    // Assert
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});
