/**
 * Backup Download Utility Tests
 *
 * Tests for backup download functionality.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD } from "../types/krd";
import { downloadBackup, promptBackupDownload } from "./backup-download";

describe("downloadBackup", () => {
  beforeEach(() => {
    // Mock URL APIs that don't exist in jsdom
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("should create download link with workout data", () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLElement
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockLink as unknown as Node
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockLink as unknown as Node
    );

    // Act
    downloadBackup(mockWorkout);

    // Assert
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toMatch(/^workout-backup-/);
    expect(mockLink.download).toMatch(/\.krd$/);
  });

  it("should use custom filename when provided", () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLElement
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockLink as unknown as Node
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockLink as unknown as Node
    );

    // Act
    downloadBackup(mockWorkout, "custom-backup.krd");

    // Assert
    expect(mockLink.download).toBe("custom-backup.krd");
  });
});

describe("promptBackupDownload", () => {
  beforeEach(() => {
    // Mock URL APIs
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock DOM methods
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLElement
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockLink as unknown as Node
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockLink as unknown as Node
    );

    // Mock setTimeout to execute immediately
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should download backup and proceed when user confirms", async () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockShowModal = vi.fn((config) => {
      // Simulate user confirming download
      if (config.title === "Download Backup?") {
        config.onConfirm();
        vi.advanceTimersByTime(500);
      }
      // Simulate user confirming proceed
      else if (config.title === "Proceed with Operation?") {
        config.onConfirm();
      }
    });

    // Act
    const resultPromise = promptBackupDownload(
      mockWorkout,
      "Delete All Steps",
      mockShowModal
    );
    const result = await resultPromise;

    // Assert
    expect(result).toBe(true);
    expect(mockShowModal).toHaveBeenCalledTimes(2);
    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Download Backup?",
        variant: "default",
      })
    );
    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Proceed with Operation?",
        variant: "default",
      })
    );

    vi.useRealTimers();
  });

  it("should not proceed when user cancels after download", async () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockShowModal = vi.fn((config) => {
      // Simulate user confirming download
      if (config.title === "Download Backup?") {
        config.onConfirm();
        vi.advanceTimersByTime(500);
      }
      // Simulate user canceling proceed
      else if (config.title === "Proceed with Operation?") {
        config.onCancel();
      }
    });

    // Act
    const resultPromise = promptBackupDownload(
      mockWorkout,
      "Delete All Steps",
      mockShowModal
    );
    const result = await resultPromise;

    // Assert
    expect(result).toBe(false);

    vi.useRealTimers();
  });

  it("should ask to proceed without backup when user declines download", async () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockShowModal = vi.fn((config) => {
      // Simulate user declining download
      if (config.title === "Download Backup?") {
        config.onCancel();
      }
      // Simulate user confirming proceed without backup
      else if (config.title === "Proceed Without Backup?") {
        config.onConfirm();
      }
    });

    // Act
    const resultPromise = promptBackupDownload(
      mockWorkout,
      "Delete All Steps",
      mockShowModal
    );
    const result = await resultPromise;

    // Assert
    expect(result).toBe(true);
    expect(mockShowModal).toHaveBeenCalledTimes(2);
    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Download Backup?",
        variant: "default",
      })
    );
    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Proceed Without Backup?",
        variant: "destructive",
      })
    );

    vi.useRealTimers();
  });
});
