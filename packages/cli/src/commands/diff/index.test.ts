import { afterEach, describe, expect, it, vi } from "vitest";

import { ExitCode } from "../../utils/exit-codes";
import { diffCommand, type DiffOptions } from "./index";

describe("diffCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should report options that fail their schema through the error handler", async () => {
    // Arrange
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    const options = {
      file1: "a.krd",
      file2: "b.krd",
      format1: "bogus",
    } as unknown as DiffOptions;

    // Act
    const exitCode = await diffCommand(options);

    // Assert
    expect(exitCode).toBe(ExitCode.INVALID_ARGUMENT);
    expect(stderr).toHaveBeenCalledTimes(1);
  });
});
