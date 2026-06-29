import { describe, expect, it, vi } from "vitest";

import { DirectoryCreateError } from "./cli-errors";
import { createOutputDirectory } from "./directory-handler";
import { mapErrorToExitCode } from "./error-exit-code";
import { ExitCode } from "./exit-codes";

vi.mock("fs/promises", () => ({
  mkdir: vi.fn(),
}));

describe("createOutputDirectory", () => {
  it("should create the parent directory recursively", async () => {
    // Arrange
    const { mkdir } = await import("fs/promises");
    vi.mocked(mkdir).mockResolvedValue(undefined);

    // Act
    await createOutputDirectory("/output/subdir/file.tcx");

    // Assert
    expect(mkdir).toHaveBeenCalledWith("/output/subdir", { recursive: true });
  });

  it("should throw permission denied error for EACCES", async () => {
    // Arrange
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("EACCES"), { code: "EACCES" });

    // Act
    vi.mocked(mkdir).mockRejectedValue(error);

    // Assert
    await expect(createOutputDirectory("/restricted/file.tcx")).rejects.toThrow(
      "Permission denied creating directory: /restricted"
    );
  });

  it.each(["ENOTDIR", "EEXIST"])(
    "should throw path-exists-as-file error for %s",
    async (code) => {
      // Arrange
      const { mkdir } = await import("fs/promises");
      const error = Object.assign(new Error(code), { code });

      // Act
      vi.mocked(mkdir).mockRejectedValue(error);

      // Assert
      await expect(
        createOutputDirectory("/existing-file/out.tcx")
      ).rejects.toThrow("Cannot create directory (path exists as file)");
    }
  );

  it("should throw generic directory creation error for other errors", async () => {
    // Arrange
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("UNKNOWN"), { code: "UNKNOWN" });

    // Act
    vi.mocked(mkdir).mockRejectedValue(error);

    // Assert
    await expect(createOutputDirectory("/bad/out.tcx")).rejects.toThrow(
      "Failed to create directory"
    );
  });

  it("should throw generic error for non-system errors", async () => {
    // Arrange
    const { mkdir } = await import("fs/promises");

    // Act
    vi.mocked(mkdir).mockRejectedValue(new Error("something else"));

    // Assert
    await expect(createOutputDirectory("/bad/out.tcx")).rejects.toThrow(
      "Failed to create directory"
    );
  });

  it("should throw a DirectoryCreateError that maps to its exit code", async () => {
    // Arrange
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("EACCES"), { code: "EACCES" });
    vi.mocked(mkdir).mockRejectedValue(error);

    // Act
    const thrown = await createOutputDirectory("/restricted/file.tcx").catch(
      (e: unknown) => e
    );

    // Assert
    expect(thrown).toBeInstanceOf(DirectoryCreateError);
    expect(mapErrorToExitCode(thrown)).toBe(ExitCode.DIRECTORY_CREATE_ERROR);
  });
});
