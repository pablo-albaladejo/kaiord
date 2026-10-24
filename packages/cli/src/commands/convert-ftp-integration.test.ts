import { execa } from "execa";
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import stripAnsi from "strip-ansi";
import { dir } from "tmp-promise";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ExitCode } from "../utils/exit-codes";

const FTP_W = "250";
// 85 % of 250 W = 213 W; Garmin gets a single value as its ±5 % band.
const SWEET_SPOT_BAND_HIGH_W = 224;
const SWEET_SPOT_BAND_LOW_W = 202;
const ENDURANCE_W = 125;
// 125 W ± 6.25 W, rounded.
const ENDURANCE_BAND_HIGH_W = 131;
const ENDURANCE_BAND_LOW_W = 119;
const RAMP_TOP_W = 188;
const OVER_TOP_W = 263;
const OVER_BOTTOM_W = 200;

const ZWO = `<workout_file><name>ftp test</name><sportType>bike</sportType><workout>
<SteadyState Duration="600" Power="0.85"/>
<SteadyState Duration="300" Power="0.50"/>
<Warmup Duration="300" PowerLow="0.50" PowerHigh="0.75"/>
<Ramp Duration="300" PowerLow="1.05" PowerHigh="0.80"/>
<Cooldown Duration="300" PowerLow="0.75" PowerHigh="0.50"/>
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
    "should write %FTP power targets and ramps as watts resolved with --ftp",
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
      const [steady, easy, ramp, down, cooldown] =
        gcn.workoutSegments[0].workoutSteps;
      expect(steady.targetType.workoutTargetTypeKey).toBe("power.zone");
      expect([steady.targetValueOne, steady.targetValueTwo]).toEqual([
        SWEET_SPOT_BAND_HIGH_W,
        SWEET_SPOT_BAND_LOW_W,
      ]);
      expect([easy.targetValueOne, easy.targetValueTwo]).toEqual([
        ENDURANCE_BAND_HIGH_W,
        ENDURANCE_BAND_LOW_W,
      ]);
      expect([ramp.targetValueOne, ramp.targetValueTwo]).toEqual([
        RAMP_TOP_W,
        ENDURANCE_W,
      ]);
      expect([down.targetValueOne, down.targetValueTwo]).toEqual([
        OVER_TOP_W,
        OVER_BOTTOM_W,
      ]);
      expect([cooldown.targetValueOne, cooldown.targetValueTwo]).toEqual([
        RAMP_TOP_W,
        ENDURANCE_W,
      ]);
    }
  );

  it(
    "should write descending ramps to FIT as ascending %FTP ranges",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const fitPath = join(tempDir.path, "t.fit");
      const krdPath = join(tempDir.path, "t.krd");

      // Act
      const toFit = await execa(
        "tsx",
        [cliPath, "convert", "-i", inputPath, "-o", fitPath],
        { reject: false }
      );
      await execa("tsx", [cliPath, "convert", "-i", fitPath, "-o", krdPath]);

      // Assert
      expect(toFit.exitCode, toFit.stderr).toBe(ExitCode.SUCCESS);
      const krd = JSON.parse(await readFile(krdPath, "utf-8")) as {
        extensions: {
          structured_workout: { steps: Array<{ target: { value: unknown } }> };
        };
      };
      const targets = krd.extensions.structured_workout.steps.map(
        (step) => step.target.value
      );
      const [, , , down, cooldown] = targets;
      expect([down, cooldown]).toStrictEqual([
        { unit: "range", min: 80, max: 105, basis: "percent_ftp" },
        { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
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

describe("--ftp validation", () => {
  const CASES = [
    ["convert", "0"],
    ["convert", "-5"],
    ["convert", "abc"],
    ["garmin push", "0"],
    ["garmin push", "-5"],
    ["garmin push", "abc"],
  ] as const;

  it.each(CASES)(
    "should reject %s --ftp %s before doing any work",
    { timeout: 30_000 },
    async (command, ftp) => {
      // Arrange
      const args = [...command.split(" "), "-i", "missing.zwo", "--ftp", ftp];

      // Act
      const result = await execa("tsx", [cliPath, ...args], {
        reject: false,
        env: { KAIORD_LANG: "en" },
      });

      // Assert
      expect(result.exitCode).not.toBe(ExitCode.SUCCESS);
      expect(stripAnsi(result.stderr)).toContain(
        "--ftp must be a positive number of watts"
      );
    }
  );
});
