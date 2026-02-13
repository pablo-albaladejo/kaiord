import { describe, expect, it, vi } from "vitest";
import { createOutputDirectory } from "./directory-handler";

vi.mock("fs/promises", () => ({
  mkdir: vi.fn(),
}));

describe("createOutputDirectory", () => {
  it("should create the parent directory recursively", async () => {
    const { mkdir } = await import("fs/promises");
    vi.mocked(mkdir).mockResolvedValue(undefined);

    await createOutputDirectory("/output/subdir/file.tcx");

    expect(mkdir).toHaveBeenCalledWith("/output/subdir", { recursive: true });
  });

  it("should throw permission denied error for EACCES", async () => {
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("EACCES"), { code: "EACCES" });
    vi.mocked(mkdir).mockRejectedValue(error);

    await expect(createOutputDirectory("/restricted/file.tcx")).rejects.toThrow(
      "Permission denied creating directory: /restricted"
    );
  });

  it("should throw path-exists-as-file error for ENOTDIR", async () => {
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("ENOTDIR"), { code: "ENOTDIR" });
    vi.mocked(mkdir).mockRejectedValue(error);

    await expect(
      createOutputDirectory("/existing-file/out.tcx")
    ).rejects.toThrow("Cannot create directory (path exists as file)");
  });

  it("should throw path-exists-as-file error for EEXIST", async () => {
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("EEXIST"), { code: "EEXIST" });
    vi.mocked(mkdir).mockRejectedValue(error);

    await expect(createOutputDirectory("/conflict/out.tcx")).rejects.toThrow(
      "Cannot create directory (path exists as file)"
    );
  });

  it("should throw generic directory creation error for other errors", async () => {
    const { mkdir } = await import("fs/promises");
    const error = Object.assign(new Error("UNKNOWN"), { code: "UNKNOWN" });
    vi.mocked(mkdir).mockRejectedValue(error);

    await expect(createOutputDirectory("/bad/out.tcx")).rejects.toThrow(
      "Failed to create directory"
    );
  });

  it("should throw generic error for non-system errors", async () => {
    const { mkdir } = await import("fs/promises");
    vi.mocked(mkdir).mockRejectedValue(new Error("something else"));

    await expect(createOutputDirectory("/bad/out.tcx")).rejects.toThrow(
      "Failed to create directory"
    );
  });

  it("should succeed when mkdir resolves", async () => {
    const { mkdir } = await import("fs/promises");
    vi.mocked(mkdir).mockResolvedValue(undefined);

    await expect(
      createOutputDirectory("/valid/path/file.tcx")
    ).resolves.toBeUndefined();
  });
});
