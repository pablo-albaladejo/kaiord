/**
 * Backup Download Utility Tests
 *
 * Tests for backup download functionality.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { setupDownloadMock } from "../test-utils/mock-download";
import type { KRD } from "../types/krd";
import { downloadBackup } from "./backup-download";

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
