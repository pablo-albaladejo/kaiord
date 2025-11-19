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

    vi.spyOn(window, "confirm")
      .mockReturnValueOnce(true) // Download backup
      .mockReturnValueOnce(true); // Proceed

    // Act
    const result = await promptBackupDownload(mockWorkout, "Delete All Steps");

    // Assert
    expect(result).toBe(true);
    expect(window.confirm).toHaveBeenCalledTimes(2);
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

    vi.spyOn(window, "confirm")
      .mockReturnValueOnce(true) // Download backup
      .mockReturnValueOnce(false); // Don't proceed

    // Act
    const result = await promptBackupDownload(mockWorkout, "Delete All Steps");

    // Assert
    expect(result).toBe(false);
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

    vi.spyOn(window, "confirm")
      .mockReturnValueOnce(false) // Don't download backup
      .mockReturnValueOnce(true); // Proceed without backup

    // Act
    const result = await promptBackupDownload(mockWorkout, "Delete All Steps");

    // Assert
    expect(result).toBe(true);
    expect(window.confirm).toHaveBeenCalledTimes(2);
  });
});
