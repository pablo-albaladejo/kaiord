import { execa } from "execa";
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import stripAnsi from "strip-ansi";
import { dir } from "tmp-promise";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ExitCode } from "../utils/exit-codes";

const FTP_W = "250";
const SWEET_SPOT_W = 213;
const ENDURANCE_W = 125;

const ZWO = `<workout_file><name>ftp test</name><sportType>bike</sportType><workout>
<SteadyState Duration="600" Power="0.85"/>
<SteadyState Duration="300" Power="0.50"/>
</workout></workout_file>`;

type GcnStep = {
  targetType: { workoutTargetTypeKey: string };
  targetValueOne: number | null;
  targetValueTwo: number | null;
};

const cliPath = resolve(__dirname, "../bin/kaiord.ts");

describe("convert --ftp (ZWO to GCN)", () => {
  let tempDir: { path: string; cleanup: () => Promise<void> };
  let inputPath: string;

  beforeEach(async () => {
    tempDir = await dir({ unsafeCleanup: true });
    inputPath = join(tempDir.path, "t.zwo");
    await writeFile(inputPath, ZWO);
  });

  afterEach(async () => {
    await tempDir.cleanup();
  });

  it(
    "should write %FTP power targets as watts resolved with --ftp",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const outputPath = join(tempDir.path, "t.gcn");
      const args = ["convert", "-i", inputPath, "-o", outputPath];

      // Act
      const result = await execa("tsx", [cliPath, ...args, "--ftp", FTP_W], {
        reject: false,
      });

      // Assert
      expect(result.exitCode, result.stderr).toBe(ExitCode.SUCCESS);
      const gcn = JSON.parse(await readFile(outputPath, "utf-8")) as {
        workoutSegments: [{ workoutSteps: GcnStep[] }];
      };
      const [steady, easy] = gcn.workoutSegments[0].workoutSteps;
      expect(steady.targetType.workoutTargetTypeKey).toBe("power.zone");
      expect([steady.targetValueOne, steady.targetValueTwo]).toEqual([
        SWEET_SPOT_W,
        SWEET_SPOT_W,
      ]);
      expect([easy.targetValueOne, easy.targetValueTwo]).toEqual([
        ENDURANCE_W,
        ENDURANCE_W,
      ]);
    }
  );

  it(
    "should fail with an actionable --ftp hint when %FTP targets have no FTP",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const outputPath = join(tempDir.path, "t.gcn");
      const args = ["convert", "-i", inputPath, "-o", outputPath];

      // Act
      const result = await execa("tsx", [cliPath, ...args], { reject: false });

      // Assert
      expect(result.exitCode).toBe(ExitCode.INVALID_ARGUMENT);
      expect(stripAnsi(result.stderr)).toContain("--ftp");
      await expect(readFile(outputPath, "utf-8")).rejects.toThrow();
    }
  );
});
