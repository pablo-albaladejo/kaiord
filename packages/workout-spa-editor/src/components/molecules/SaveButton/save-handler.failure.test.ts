import { afterEach, describe, expect, it, vi } from "vitest";

import { createSaveHandler } from "./save-handler";

const mockExportWorkout = vi.fn();

vi.mock("../../../utils/export-workout", () => ({
  downloadWorkout: vi.fn(),
  exportWorkout: (...args: unknown[]) => mockExportWorkout(...args) as unknown,
}));

describe("createSaveHandler — an export failure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("should word the failure from the dictionary, never the writer's text", async () => {
    // Arrange
    mockExportWorkout.mockRejectedValue(
      new Error("Failed to export workout as TCX: writer internal detail")
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const showError = vi.fn();
    const setSaveErrors = vi.fn();
    const noop = vi.fn();
    const handler = createSaveHandler(
      { extensions: {} } as never,
      "tcx",
      noop,
      setSaveErrors,
      noop,
      noop,
      showError
    );

    // Act
    await handler();

    // Assert
    const wording = "The workout was not exported. Try again.";
    expect(showError).toHaveBeenCalledWith("Export Failed", wording);
    expect(setSaveErrors).toHaveBeenLastCalledWith([
      { path: [], message: wording },
    ]);
  });
});
