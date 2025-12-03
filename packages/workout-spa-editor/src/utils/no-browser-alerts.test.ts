/**
 * Property Test: No Browser Alerts for Confirmations
 *
 * **Property 13: No browser alerts for confirmations**
 * **Validates: Requirements 6.1**
 *
 * For any user action requiring confirmation, the system should display
 * a modal dialog and should never call window.alert(), window.confirm(),
 * or window.prompt()
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD } from "../types/krd";
import { promptBackupDownload } from "./backup-download";

describe("Property 13: No browser alerts for confirmations", () => {
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

    // Mock setTimeout
    vi.useFakeTimers();

    // Spy on browser alert methods
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockImplementation(() => false);
    vi.spyOn(window, "prompt").mockImplementation(() => null);
  });

  it("should never call window.alert when showing confirmations", async () => {
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
      // Simulate user confirming
      config.onConfirm();
      if (config.title === "Download Backup?") {
        vi.advanceTimersByTime(500);
      }
    });

    // Act
    await promptBackupDownload(mockWorkout, "Delete All Steps", mockShowModal);

    // Assert - No browser alerts should be called
    expect(window.alert).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(window.prompt).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should never call window.confirm when showing confirmations", async () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const mockShowModal = vi.fn((config) => {
      // Simulate user canceling
      config.onCancel();
    });

    // Act
    await promptBackupDownload(mockWorkout, "Clear Workout", mockShowModal);

    // Assert - No browser alerts should be called
    expect(window.alert).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(window.prompt).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should never call window.prompt when showing confirmations", async () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "swimming",
      },
      extensions: {
        workout: {
          name: "Swimming Workout",
          sport: "swimming",
          steps: [],
        },
      },
    };

    const mockShowModal = vi.fn((config) => {
      // Simulate various user interactions
      if (config.title === "Download Backup?") {
        config.onCancel();
      } else if (config.title === "Proceed Without Backup?") {
        config.onConfirm();
      }
    });

    // Act
    await promptBackupDownload(mockWorkout, "Import Workout", mockShowModal);

    // Assert - No browser alerts should be called
    expect(window.alert).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(window.prompt).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should use modal system for all confirmation scenarios", async () => {
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
      // Track that modal is being used
      expect(config).toHaveProperty("title");
      expect(config).toHaveProperty("message");
      expect(config).toHaveProperty("confirmLabel");
      expect(config).toHaveProperty("cancelLabel");
      expect(config).toHaveProperty("onConfirm");
      expect(config).toHaveProperty("onCancel");
      expect(config).toHaveProperty("variant");

      // Simulate user interaction
      if (config.title === "Download Backup?") {
        config.onConfirm();
        vi.advanceTimersByTime(500);
      } else {
        config.onCancel();
      }
    });

    // Act
    await promptBackupDownload(mockWorkout, "Delete All Steps", mockShowModal);

    // Assert - Modal system should be used, not browser alerts
    expect(mockShowModal).toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(window.prompt).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
