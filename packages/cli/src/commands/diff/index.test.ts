import { afterEach, describe, expect, it, vi } from "vitest";

import type * as configLoader from "../../utils/config-loader.js";
import { loadConfigWithMetadata } from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes";
import { diffCommand, type DiffOptions } from "./index";

vi.mock("../../utils/config-loader.js", async (importOriginal) => {
  const actual = await importOriginal<typeof configLoader>();
  return {
    ...actual,
    loadConfigWithMetadata: vi.fn(actual.loadConfigWithMetadata),
  };
});

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

  it("should keep the original exit code when the config cannot be read", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cwdGone = Object.assign(new Error("uv_cwd"), { code: "ENOENT" });
    vi.mocked(loadConfigWithMetadata)
      .mockRejectedValueOnce(cwdGone)
      .mockRejectedValueOnce(cwdGone);
    const options = { file1: "a.krd", file2: "b.krd" } as DiffOptions;

    // Act
    const exitCode = await diffCommand(options);

    // Assert
    expect(exitCode).toBe(ExitCode.FILE_NOT_FOUND);
  });
});
