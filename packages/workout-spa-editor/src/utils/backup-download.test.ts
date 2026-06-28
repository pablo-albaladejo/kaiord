/**
 * Backup Download Utility Tests
 *
 * Tests for backup download functionality.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { setupDownloadMock } from "../test-utils/mock-download";
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
    const { anchor } = setupDownloadMock();

    // Act
    downloadBackup(mockWorkout);

    // Assert
    expect(anchor.click).toHaveBeenCalled();
    expect(anchor.download).toMatch(/^workout-backup-/);
    expect(anchor.download).toMatch(/\.krd$/);
  });

  it("should use custom filename when provided", () => {
    // Arrange
    const mockWorkout: KRD = {
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
    const { anchor } = setupDownloadMock();

    // Act
    downloadBackup(mockWorkout, "custom-backup.krd");

    // Assert
    expect(anchor.download).toBe("custom-backup.krd");
  });
});

describe("promptBackupDownload", () => {
  beforeEach(() => {
    // Mock URL APIs
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    setupDownloadMock();

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

  it("should not proceed when user declines backup and declines proceeding", async () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockShowModal = vi.fn((config) => {
      // Simulate user declining download, then declining to proceed
      if (config.title === "Download Backup?") {
        config.onCancel();
      } else if (config.title === "Proceed Without Backup?") {
        config.onCancel();
      }
    });

    // Act
    const result = await promptBackupDownload(
      mockWorkout,
      "Delete All Steps",
      mockShowModal
    );

    // Assert
    expect(result).toBe(false);
    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Proceed Without Backup?",
        variant: "destructive",
      })
    );

    vi.useRealTimers();
  });

  it("should never call window.alert, confirm, or prompt (uses the modal system)", async () => {
    // Arrange
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => false);
    const promptSpy = vi.spyOn(window, "prompt").mockImplementation(() => null);
    const mockWorkout: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
      extensions: {
        structured_workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };
    const mockShowModal = vi.fn((config) => {
      config.onCancel();
    });

    // Act
    await promptBackupDownload(mockWorkout, "Delete All Steps", mockShowModal);

    // Assert
    expect(alertSpy).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(promptSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
    promptSpy.mockRestore();
  });
});
