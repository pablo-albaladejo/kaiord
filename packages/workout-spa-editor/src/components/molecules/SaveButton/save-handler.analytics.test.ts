import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSaveHandler } from "./save-handler";

const mockDownloadWorkout = vi.fn();
const mockExportWorkout = vi.fn();
const mockGenerateWorkoutFilename = vi.fn(() => "workout.fit");

vi.mock("../../../utils/export-workout", () => ({
  downloadWorkout: (...args: unknown[]) => mockDownloadWorkout(...args),
  exportWorkout: (...args: unknown[]) => mockExportWorkout(...args) as unknown,
}));

vi.mock("./workout-filename", () => ({
  generateWorkoutFilename: (...args: unknown[]) =>
    mockGenerateWorkoutFilename(...args) as unknown,
}));

describe("createSaveHandler — analytics call-site", () => {
  const fakeWorkout = { extensions: { structured_workout: { name: "Test" } } };
  const noop = vi.fn();

  beforeEach(() => {
    mockExportWorkout.mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call onExported with format after successful export", async () => {
    // Arrange
    const onExported = vi.fn();
    const handler = createSaveHandler(
      fakeWorkout as never,
      "fit",
      noop,
      noop,
      noop,
      noop,
      noop,
      onExported
    );

    // Act
    await handler();

    // Assert
    expect(onExported).toHaveBeenCalledWith("fit");
  });

  it("should not call onExported when export throws", async () => {
    // Arrange
    mockExportWorkout.mockRejectedValue(new Error("Export failed"));
    const onExported = vi.fn();
    const handler = createSaveHandler(
      fakeWorkout as never,
      "tcx",
      noop,
      noop,
      noop,
      noop,
      noop,
      onExported
    );

    // Act
    await handler();

    // Assert
    expect(onExported).not.toHaveBeenCalled();
  });

  it("should work without onExported (optional callback)", async () => {
    // Arrange
    const handler = createSaveHandler(
      fakeWorkout as never,
      "krd",
      noop,
      noop,
      noop,
      noop,
      noop
    );

    // Act & Assert — no throw when callback is omitted
    await expect(handler()).resolves.toBeUndefined();
  });
});
