import { KrdValidationError, ToleranceExceededError } from "@kaiord/core";
import stripAnsi from "strip-ansi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DirectoryCreateError, UnsupportedFormatError } from "./cli-errors.js";
import { loadConfigWithMetadata } from "./config-loader.js";
import { ExitCode } from "./exit-codes.js";
import { handleCommandError, resolveJsonFlag } from "./handle-command-error.js";

vi.mock("./config-loader.js", () => ({ loadConfigWithMetadata: vi.fn() }));

const withConfig = (json: boolean | undefined) => ({
  config: json === undefined ? {} : { json },
  loadedFrom: null,
  searchedPaths: [],
});

const enoent = (): Error =>
  Object.assign(new Error("open failed"), {
    code: "ENOENT",
    path: "/tmp/missing.krd",
  });

const ERROR_CLASSES: ReadonlyArray<{
  label: string;
  make: () => unknown;
  exitCode: number;
}> = [
  { label: "missing file", make: enoent, exitCode: ExitCode.FILE_NOT_FOUND },
  {
    label: "unsupported format",
    make: () => new UnsupportedFormatError("/tmp/x.txt"),
    exitCode: ExitCode.INVALID_ARGUMENT,
  },
  {
    label: "invalid KRD",
    make: () =>
      new KrdValidationError("bad", [{ field: "version", message: "x" }]),
    exitCode: ExitCode.VALIDATION_ERROR,
  },
  {
    label: "tolerance exceeded",
    make: () => new ToleranceExceededError("too far", []),
    exitCode: ExitCode.TOLERANCE_EXCEEDED,
  },
  {
    label: "directory create",
    make: () => new DirectoryCreateError("/tmp/out", new Error("denied")),
    exitCode: ExitCode.DIRECTORY_CREATE_ERROR,
  },
  {
    label: "unknown",
    make: () => new Error("boom"),
    exitCode: ExitCode.UNKNOWN_ERROR,
  },
];

describe("handleCommandError", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe.each(ERROR_CLASSES)("$label", ({ make, exitCode }) => {
    it("should print text to stderr and return the mapped exit code", () => {
      // Arrange
      const error = make();

      // Act
      const code = handleCommandError(error, { json: false });

      // Assert
      expect(code).toBe(exitCode);
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(stripAnsi(String(errorSpy.mock.calls[0]?.[0]))).toContain("Error");
    });

    it("should print the JSON error to stdout without an envelope", () => {
      // Arrange
      const error = make();

      // Act
      const code = handleCommandError(error, { json: true });

      // Assert
      expect(code).toBe(exitCode);
      expect(errorSpy).not.toHaveBeenCalled();
      const printed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
      expect(printed.success).toBe(false);
      expect(printed.error.message).toBeTypeOf("string");
    });

    it("should wrap the JSON error in a second envelope when asked", () => {
      // Arrange
      const error = make();

      // Act
      const code = handleCommandError(error, { json: true, envelope: true });

      // Assert
      expect(code).toBe(exitCode);
      const printed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
      expect(printed.success).toBe(false);
      expect(printed.error.success).toBe(false);
      expect(printed.error.error.message).toBeTypeOf("string");
    });
  });
});

describe("resolveJsonFlag", () => {
  afterEach(() => {
    vi.mocked(loadConfigWithMetadata).mockReset();
  });

  it("should return true when json is set and other options are invalid", async () => {
    // Arrange
    const options = { input: ["a.krd", "b.krd"], json: true };

    // Act
    const json = await resolveJsonFlag(options);

    // Assert
    expect(json).toBe(true);
  });

  it("should prefer an explicit json false over the config default", async () => {
    // Arrange
    vi.mocked(loadConfigWithMetadata).mockResolvedValue(withConfig(true));

    // Act
    const json = await resolveJsonFlag({ json: false });

    // Assert
    expect(json).toBe(false);
  });

  it("should fall back to the config json default when the flag is absent", async () => {
    // Arrange
    vi.mocked(loadConfigWithMetadata).mockResolvedValue(withConfig(true));

    // Act
    const json = await resolveJsonFlag({ input: "a.krd" });

    // Assert
    expect(json).toBe(true);
  });

  it("should return false when neither the flag nor the config sets json", async () => {
    // Arrange
    vi.mocked(loadConfigWithMetadata).mockResolvedValue(withConfig(undefined));

    // Act
    const json = await resolveJsonFlag(undefined);

    // Assert
    expect(json).toBe(false);
  });
});

describe("handleCommandError golden output", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print the exact double-envelope JSON for validate and inspect", () => {
    // Arrange
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = new UnsupportedFormatError("Unsupported: a.txt");

    // Act
    handleCommandError(error, { json: true, envelope: true });

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      [
        "{",
        '  "success": false,',
        '  "error": {',
        '    "success": false,',
        '    "error": {',
        '      "type": "UnsupportedFormatError",',
        '      "message": "Unsupported: a.txt"',
        "    }",
        "  }",
        "}",
      ].join("\n")
    );
  });
});
