import type { KRD } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { importWorkout } from "./import-workout";

// Mock @kaiord/core
vi.mock("@kaiord/core", () => ({
  createDefaultProviders: vi.fn(() => ({
    convertFitToKrd: vi.fn(),
  })),
}));

// Helper to create a mock File with arrayBuffer support
const createMockFile = (
  content: string | Uint8Array,
  filename: string,
  type: string
): File => {
  const buffer =
    typeof content === "string" ? new TextEncoder().encode(content) : content;

  // Create a proper Blob part from the buffer
  const blobPart = new Uint8Array(buffer);
  const file = new File([blobPart], filename, { type });

  // Mock arrayBuffer method for Node.js environment
  file.arrayBuffer = vi.fn().mockResolvedValue(buffer.buffer as ArrayBuffer);

  return file;
};

describe("importWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("format detection", () => {
    it("should throw error for unsupported file format", async () => {
      // Arrange
      const file = createMockFile(
        "content",
        "workout.xyz",
        "application/octet-stream"
      );

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        "Unsupported file format"
      );
    });

    it("should throw error for file without extension", async () => {
      // Arrange
      const file = createMockFile(
        "content",
        "workout",
        "application/octet-stream"
      );

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        "Unsupported file format"
      );
    });
  });

  describe("KRD file import", () => {
    it("should parse valid KRD JSON file", async () => {
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
      const file = createMockFile(
        jsonContent,
        "workout.krd",
        "application/json"
      );

      // Act
      const result = await importWorkout(file);

      // Assert
      expect(result).toStrictEqual(mockKrd);
    });

    it("should parse valid JSON file with .json extension", async () => {
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
      const file = createMockFile(
        jsonContent,
        "workout.json",
        "application/json"
      );

      // Act
      const result = await importWorkout(file);

      // Assert
      expect(result).toStrictEqual(mockKrd);
    });

    it("should throw error for invalid JSON", async () => {
      // Arrange
      const invalidJson = "{ invalid json }";
      const file = createMockFile(
        invalidJson,
        "workout.krd",
        "application/json"
      );

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        "Failed to parse KRD JSON"
      );
    });

    it("should call progress callback for KRD import", async () => {
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

      const file = createMockFile(
        JSON.stringify(mockKrd),
        "workout.krd",
        "application/json"
      );
      const onProgress = vi.fn();

      // Act
      await importWorkout(file, onProgress);

      // Assert
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe("FIT file import", () => {
    it("should convert FIT file using @kaiord/core", async () => {
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
            name: "FIT Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertFitToKrd = vi.fn().mockResolvedValue(mockKrd);
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertFitToKrd: mockConvertFitToKrd,
      } as any);

      const fitBuffer = new Uint8Array([0x0e, 0x10, 0x43, 0x08]);
      const file = createMockFile(
        fitBuffer,
        "workout.fit",
        "application/octet-stream"
      );

      // Act
      const result = await importWorkout(file);

      // Assert
      expect(result).toStrictEqual(mockKrd);
      expect(mockConvertFitToKrd).toHaveBeenCalledWith({
        fitBuffer: expect.any(Uint8Array),
      });
    });

    it("should call progress callback for FIT import", async () => {
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

      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertFitToKrd = vi.fn().mockResolvedValue(mockKrd);
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertFitToKrd: mockConvertFitToKrd,
      } as any);

      const fitBuffer = new Uint8Array([0x0e, 0x10, 0x43, 0x08]);
      const file = createMockFile(
        fitBuffer,
        "workout.fit",
        "application/octet-stream"
      );
      const onProgress = vi.fn();

      // Act
      await importWorkout(file, onProgress);

      // Assert
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it("should throw error when FIT conversion fails", async () => {
      // Arrange
      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertFitToKrd = vi
        .fn()
        .mockRejectedValue(new Error("Invalid FIT file"));
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertFitToKrd: mockConvertFitToKrd,
      } as any);

      const fitBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const file = createMockFile(
        fitBuffer,
        "workout.fit",
        "application/octet-stream"
      );

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        "Failed to parse FIT file"
      );
    });
  });

  describe("TCX file import", () => {
    it("should throw not implemented error for TCX files", async () => {
      // Arrange
      const tcxContent = '<?xml version="1.0"?><TrainingCenterDatabase/>';
      const file = createMockFile(tcxContent, "workout.tcx", "application/xml");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        "TCX format conversion is not yet implemented"
      );
    });
  });

  describe("PWX file import", () => {
    it("should throw not implemented error for PWX files", async () => {
      // Arrange
      const pwxContent = '<?xml version="1.0"?><workout/>';
      const file = createMockFile(pwxContent, "workout.pwx", "application/xml");

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        "PWX format conversion is not yet implemented"
      );
    });
  });

  describe("error handling", () => {
    it("should include format-specific error message for FIT parsing errors", async () => {
      // Arrange
      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertFitToKrd = vi
        .fn()
        .mockRejectedValue(new Error("Corrupted file"));
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertFitToKrd: mockConvertFitToKrd,
      } as any);

      const fitBuffer = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
      const file = createMockFile(
        fitBuffer,
        "workout.fit",
        "application/octet-stream"
      );

      // Act & Assert
      await expect(importWorkout(file)).rejects.toThrow(
        /Failed to parse FIT file.*corrupted/i
      );
    });
  });
});
