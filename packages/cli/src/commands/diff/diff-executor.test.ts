import type { KRD, Logger } from "@kaiord/core";
import stripAnsi from "strip-ansi";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadFileAsKrd } from "../../utils/krd-converter.js";
import { computeDiff, printDiffResult } from "./diff-executor";

vi.mock("../../utils/krd-converter.js", () => ({ loadFileAsKrd: vi.fn() }));

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const krd = (sport: string, extensions?: Record<string, unknown>): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport },
    extensions,
  }) as KRD;

const OPTIONS = { file1: "a.krd", file2: "b.krd" };

describe("computeDiff", () => {
  afterEach(() => {
    vi.mocked(loadFileAsKrd).mockReset();
  });

  it("should report identical files with no diff sections", async () => {
    // Arrange
    vi.mocked(loadFileAsKrd).mockResolvedValue(krd("cycling"));

    // Act
    const result = await computeDiff(OPTIONS, logger);

    // Assert
    expect(result).toEqual({
      identical: true,
      metadataDiff: undefined,
      stepsDiff: undefined,
      extensionsDiff: undefined,
    });
  });

  it("should fill every section that has a difference", async () => {
    // Arrange
    const steps = (n: number) => ({
      structured_workout: {
        steps: Array.from({ length: n }, (_, i) => ({ stepIndex: i })),
      },
    });
    vi.mocked(loadFileAsKrd)
      .mockResolvedValueOnce(krd("cycling", steps(1)))
      .mockResolvedValueOnce(krd("running", steps(2)));

    // Act
    const result = await computeDiff(OPTIONS, logger);

    // Assert
    expect(result.identical).toBe(false);
    expect(result.metadataDiff).toHaveLength(1);
    expect(result.stepsDiff?.differences).toHaveLength(1);
    expect(result.extensionsDiff?.differences).toHaveLength(1);
  });
});

describe("printDiffResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print a JSON envelope when json is set", () => {
    // Arrange
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    // Act
    printDiffResult({ identical: true }, { ...OPTIONS, json: true });

    // Assert
    expect(JSON.parse(log.mock.calls[0][0] as string)).toEqual({
      success: true,
      file1: "a.krd",
      file2: "b.krd",
      identical: true,
    });
  });

  it("should print the pretty report when json is not set", () => {
    // Arrange
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    // Act
    printDiffResult({ identical: true }, OPTIONS);

    // Assert
    expect(stripAnsi(log.mock.calls[0][0] as string)).toBe(
      "Files are identical"
    );
  });
});
