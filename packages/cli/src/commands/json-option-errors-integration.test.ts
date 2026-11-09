import { execa } from "execa";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

import { getFixturePath } from "../tests/helpers/fixture-paths";
import { ExitCode } from "../utils/exit-codes";

const CLI_PATH = resolve(__dirname, "../bin/kaiord.ts");
const KRD = getFixturePath("krd", "WorkoutIndividualSteps.krd");

describe("--json with an option that fails validation", () => {
  it.each([
    ["inspect", ["inspect", "--input", KRD, "--input-format", "bogus"]],
    [
      "extract-workout",
      ["extract-workout", "--input", KRD, "--input-format", "bogus"],
    ],
    ["validate", ["validate", "--input", KRD, "--input", KRD]],
    ["diff", ["diff", "--file1", KRD, "--file1", KRD, "--file2", KRD]],
  ])(
    "should report %s's validation error as JSON with INVALID_ARGUMENT",
    { timeout: 30_000 },
    async (_command, args) => {
      // Arrange
      const argv = [CLI_PATH, ...args, "--json"];

      // Act
      const result = await execa("tsx", argv, { reject: false });

      // Assert
      expect(result.exitCode).toBe(ExitCode.INVALID_ARGUMENT);
      expect(JSON.parse(result.stdout).success).toBe(false);
    }
  );
});
