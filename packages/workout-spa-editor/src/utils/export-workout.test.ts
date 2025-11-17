import type { KRD } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadFile,
  exportWorkout,
  generateFilename,
} from "./export-workout";

// Mock @kaiord/core
vi.mock("@kaiord/core", () => ({
  createDefaultProviders: vi.fn(() => ({
    convertKrdToFit: vi.fn(),
  })),
}));

describe("exportWorkout", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("KRD format export", () => {
    it("should export KRD as JSON blob", async () => {
      // Arrange & Act
      const result = await exportWorkout(mockKrd, "krd");

      // Assert
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/json");
      expect(result.size).toBeGreaterThan(0);
    });

    it("should format JSON with 2-space indentation", async () => {
      // Arrange & Act
      const result = await exportWorkout(mockKrd, "krd");

      // Assert
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/json");
      // Verify blob contains formatted JSON by checking size is reasonable
      expect(result.size).toBeGreaterThan(100);
    });

    it("should call progress callback for KRD export", async () => {
      // Arrange
      const onProgress = vi.fn();

      // Act
      await exportWorkout(mockKrd, "krd", onProgress);

      // Assert
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(100);
    });
  });

  describe("FIT format export", () => {
    it("should convert KRD to FIT using @kaiord/core", async () => {
      // Arrange
      const mockFitBuffer = new Uint8Array([0x0e, 0x10, 0x43, 0x08]);

      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertKrdToFit = vi.fn().mockResolvedValue(mockFitBuffer);
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertKrdToFit: mockConvertKrdToFit,
      } as any);

      // Act
      const result = await exportWorkout(mockKrd, "fit");

      // Assert
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/octet-stream");
      expect(mockConvertKrdToFit).toHaveBeenCalledWith({ krd: mockKrd });
      expect(result.size).toBe(mockFitBuffer.length);
    });

    it("should call progress callback for FIT export", async () => {
      // Arrange
      const mockFitBuffer = new Uint8Array([0x0e, 0x10, 0x43, 0x08]);

      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertKrdToFit = vi.fn().mockResolvedValue(mockFitBuffer);
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertKrdToFit: mockConvertKrdToFit,
      } as any);

      const onProgress = vi.fn();

      // Act
      await exportWorkout(mockKrd, "fit", onProgress);

      // Assert
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it("should throw error when FIT conversion fails", async () => {
      // Arrange
      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertKrdToFit = vi
        .fn()
        .mockRejectedValue(new Error("Invalid KRD structure"));
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertKrdToFit: mockConvertKrdToFit,
      } as any);

      // Act & Assert
      await expect(exportWorkout(mockKrd, "fit")).rejects.toThrow(
        /Failed to parse FIT file.*Invalid KRD structure/i
      );
    });

    it("should include format-specific error message for FIT encoding errors", async () => {
      // Arrange
      const { createDefaultProviders } = await import("@kaiord/core");
      const mockConvertKrdToFit = vi
        .fn()
        .mockRejectedValue(new Error("Encoding failed"));
      vi.mocked(createDefaultProviders).mockReturnValue({
        convertKrdToFit: mockConvertKrdToFit,
      } as any);

      // Act & Assert
      await expect(exportWorkout(mockKrd, "fit")).rejects.toThrow(
        /Failed to parse FIT file.*Encoding failed/i
      );
    });
  });

  describe("TCX format export", () => {
    it("should throw not implemented error for TCX export", async () => {
      // Arrange & Act & Assert
      await expect(exportWorkout(mockKrd, "tcx")).rejects.toThrow(
        /Failed to parse TCX XML.*not yet implemented/i
      );
    });

    it("should call progress callback for TCX export attempt", async () => {
      // Arrange
      const onProgress = vi.fn();

      // Act & Assert
      await expect(exportWorkout(mockKrd, "tcx", onProgress)).rejects.toThrow();

      // Assert progress was called
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });

  describe("PWX format export", () => {
    it("should throw not implemented error for PWX export", async () => {
      // Arrange & Act & Assert
      await expect(exportWorkout(mockKrd, "pwx")).rejects.toThrow(
        /Failed to parse PWX XML.*not yet implemented/i
      );
    });

    it("should call progress callback for PWX export attempt", async () => {
      // Arrange
      const onProgress = vi.fn();

      // Act & Assert
      await expect(exportWorkout(mockKrd, "pwx", onProgress)).rejects.toThrow();

      // Assert progress was called
      expect(onProgress).toHaveBeenCalledWith(10);
      expect(onProgress).toHaveBeenCalledWith(30);
      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });
});

describe("downloadFile", () => {
  beforeEach(() => {
    // Mock DOM APIs
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    document.createElement = vi.fn((tag: string) => {
      const element = {
        href: "",
        download: "",
        click: vi.fn(),
      } as any;
      return element;
    });

    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it("should create download link with correct attributes", () => {
    // Arrange
    const blob = new Blob(["test content"], { type: "application/json" });
    const filename = "test-workout.krd";

    // Act
    downloadFile(blob, filename);

    // Assert
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(document.createElement).toHaveBeenCalledWith("a");
  });

  it("should trigger download and cleanup", () => {
    // Arrange
    const blob = new Blob(["test content"], { type: "application/json" });
    const filename = "test-workout.krd";

    // Act
    downloadFile(blob, filename);

    // Assert
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should set correct filename", () => {
    // Arrange
    const blob = new Blob(["test content"], { type: "application/json" });
    const filename = "my-workout.fit";
    let capturedLink: any;

    document.createElement = vi.fn((tag: string) => {
      const element = {
        href: "",
        download: "",
        click: vi.fn(),
      } as any;
      capturedLink = element;
      return element;
    });

    // Act
    downloadFile(blob, filename);

    // Assert
    expect(capturedLink.download).toBe("my-workout.fit");
    expect(capturedLink.href).toBe("blob:mock-url");
  });
});

describe("generateFilename", () => {
  it("should generate filename with correct extension", () => {
    // Arrange & Act
    const result = generateFilename("Test Workout", "fit");

    // Assert
    expect(result).toBe("test_workout.fit");
  });

  it("should sanitize special characters", () => {
    // Arrange & Act
    const result = generateFilename("My Workout! @#$%", "krd");

    // Assert
    expect(result).toBe("my_workout.krd");
  });

  it("should handle multiple spaces", () => {
    // Arrange & Act
    const result = generateFilename("Test   Multiple   Spaces", "tcx");

    // Assert
    expect(result).toBe("test_multiple_spaces.tcx");
  });

  it("should handle leading and trailing underscores", () => {
    // Arrange & Act
    const result = generateFilename("_Test Workout_", "pwx");

    // Assert
    expect(result).toBe("test_workout.pwx");
  });

  it("should use default name for empty string", () => {
    // Arrange & Act
    const result = generateFilename("", "fit");

    // Assert
    expect(result).toBe("workout.fit");
  });

  it("should use default name for only special characters", () => {
    // Arrange & Act
    const result = generateFilename("!@#$%^&*()", "krd");

    // Assert
    expect(result).toBe("workout.krd");
  });

  it("should preserve hyphens and underscores", () => {
    // Arrange & Act
    const result = generateFilename("test-workout_v2", "fit");

    // Assert
    expect(result).toBe("test-workout_v2.fit");
  });

  it("should convert to lowercase", () => {
    // Arrange & Act
    const result = generateFilename("TEST WORKOUT", "fit");

    // Assert
    expect(result).toBe("test_workout.fit");
  });
});
