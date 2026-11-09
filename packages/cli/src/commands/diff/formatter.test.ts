import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";

import { formatDiffPretty } from "./formatter";

describe("formatDiffPretty", () => {
  it("should say the files are identical when there is no difference", () => {
    // Arrange
    const result = { identical: true };

    // Act
    const output = stripAnsi(formatDiffPretty(result, "a.krd", "b.krd"));

    // Assert
    expect(output).toBe("Files are identical");
  });

  it("should render every non-empty section", () => {
    // Arrange
    const result = {
      identical: false,
      metadataDiff: [
        { field: "sport", file1Value: "cycling", file2Value: "running" },
      ],
      stepsDiff: {
        file1Count: 1,
        file2Count: 2,
        differences: [
          {
            stepIndex: 1,
            field: "step",
            file1Value: undefined,
            file2Value: { stepIndex: 1 },
          },
        ],
      },
      extensionsDiff: {
        file1Keys: ["a"],
        file2Keys: ["a", "b"],
        differences: [{ key: "b", file1Value: undefined, file2Value: 2 }],
      },
    };

    // Act
    const output = stripAnsi(formatDiffPretty(result, "a.krd", "b.krd"));

    // Assert
    expect(output).toContain("Comparing: a.krd vs b.krd");
    expect(output).toContain("Metadata Differences:");
    expect(output).toContain('    - "cycling"');
    expect(output).toContain('    + "running"');
    expect(output).toContain("Step count: 1 vs 2");
    expect(output).toContain("Step 1 - step:");
    expect(output).toContain("Keys in file1: a");
    expect(output).toContain("Keys in file2: a, b");
  });

  it("should leave out sections that are absent or empty", () => {
    // Arrange
    const result = {
      identical: false,
      metadataDiff: [],
      stepsDiff: { file1Count: 1, file2Count: 1, differences: [] },
      extensionsDiff: {
        file1Keys: ["x"],
        file2Keys: ["x"],
        differences: [{ key: "x", file1Value: 1, file2Value: 2 }],
      },
    };

    // Act
    const output = stripAnsi(formatDiffPretty(result, "a.krd", "b.krd"));

    // Assert
    expect(output).not.toContain("Metadata Differences:");
    expect(output).not.toContain("Workout Steps Differences:");
    expect(output).toContain("Extensions Differences:");
  });
});
