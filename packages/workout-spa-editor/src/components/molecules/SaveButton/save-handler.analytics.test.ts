import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PaceZonesUnavailableError } from "../../../types/pace-zones-unavailable-error";
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

    // Act
    const result = handler();

    // Assert
    await expect(result).resolves.toBeUndefined();
  });

  it("should pass the profile read at click time to the export so a GCN file resolves its pace zones", async () => {
    // Arrange
    const profile = { id: "p1" };
    const handler = createSaveHandler(
      fakeWorkout as never,
      "gcn",
      noop,
      noop,
      noop,
      noop,
      noop,
      undefined,
      (key) => key,
      async () => profile as never
    );

    // Act
    await handler();

    // Assert
    expect(mockExportWorkout).toHaveBeenCalledWith(
      fakeWorkout,
      "gcn",
      expect.any(Function),
      profile
    );
  });

  it.each([
    "missing-pace-zones",
    "incomplete-pace-zones",
    "unsupported-pace-zone-sport",
  ] as const)(
    "should explain a pace zone workout that fails with %s",
    async (reason) => {
      // Arrange
      const cause = new PaceZonesUnavailableError(reason);
      mockExportWorkout.mockRejectedValue(
        Object.assign(new Error("Failed to export workout as GCN"), { cause })
      );
      const showError = vi.fn();
      const handler = createSaveHandler(
        fakeWorkout as never,
        "gcn",
        noop,
        noop,
        noop,
        noop,
        showError,
        undefined,
        (key) => key
      );

      // Act
      await handler();

      // Assert
      expect(showError).toHaveBeenCalledWith(
        "save.exportFailedTitle",
        `save.paceZones.${reason}`
      );
    }
  );
});
