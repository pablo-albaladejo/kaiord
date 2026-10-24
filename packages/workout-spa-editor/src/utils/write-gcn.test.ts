import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  freshProfile,
  paceZoneKrd,
  RUN_THRESHOLD,
  withThreshold,
} from "../test-utils/pace-zone-fixtures";
import { FtpUnavailableError } from "../types/ftp-unavailable-error";
import { MaxHrUnavailableError } from "../types/max-hr-unavailable-error";
import { PaceZonesUnavailableError } from "../types/pace-zones-unavailable-error";
import type { Profile } from "../types/profile";
import { writeGcn } from "./write-gcn";

const FTP_W = 250;
const MAX_HR = 190;
// 85 % of 250 W = 213 W -> ±5 % band, higher wattage first.
const POWER_BAND_HIGH_W = 224;
const POWER_BAND_LOW_W = 202;
// 85 % of 190 bpm = 162 bpm -> ±3 bpm band, lower bound first.
const HR_BAND_LOW_BPM = 159;
const HR_BAND_HIGH_BPM = 165;

const PACE_STEP = 0;
const POWER_STEP = 1;
const HR_STEP = 2;

const step = (stepIndex: number, target: object) => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: (target as { type: string }).type,
  target,
  intensity: "active",
});

/** A run with one target of each kind the profile must resolve. */
const profileTargetsKrd = (): KRD => {
  const zoneRun = paceZoneKrd("running", [1]);
  const [paceStep] = (
    zoneRun.extensions?.structured_workout as { steps: object[] }
  ).steps;
  return {
    ...zoneRun,
    extensions: {
      structured_workout: {
        name: "Profile targets",
        sport: "running",
        steps: [
          paceStep,
          step(POWER_STEP, {
            type: "power",
            value: { unit: "percent_ftp", value: 85 },
          }),
          step(HR_STEP, {
            type: "heart_rate",
            value: { unit: "percent_max", value: 85 },
          }),
        ],
      },
    },
  } as KRD;
};

const openKrd = (): KRD =>
  ({
    ...profileTargetsKrd(),
    extensions: {
      structured_workout: {
        name: "Open",
        sport: "running",
        steps: [step(PACE_STEP, { type: "open" })],
      },
    },
  }) as KRD;

type Profiled = { pace?: boolean; ftp?: boolean; maxHr?: boolean };

/** A running profile holding only the requested values. */
const runner = async ({
  pace = true,
  ftp = true,
  maxHr = true,
}: Profiled = {}): Promise<Profile> => {
  const base = pace
    ? await withThreshold(freshProfile(), "running", RUN_THRESHOLD)
    : freshProfile();
  const running = base.sportZones.running;
  return {
    ...base,
    maxHeartRate: maxHr ? MAX_HR : undefined,
    sportZones: {
      ...base.sportZones,
      running: {
        ...running,
        thresholds: {
          ...running?.thresholds,
          ftp: ftp ? FTP_W : undefined,
        },
      },
    },
  } as Profile;
};

type GcnStep = {
  targetValueOne: number | null;
  targetValueTwo: number | null;
};
const stepsOf = (gcn: string): GcnStep[] =>
  (JSON.parse(gcn) as { workoutSegments: [{ workoutSteps: GcnStep[] }] })
    .workoutSegments[0].workoutSteps;

describe("writeGcn", () => {
  it("should resolve pace zone, %FTP and %max HR targets from one profile", async () => {
    // Arrange
    const profile = await runner();

    // Act
    const steps = stepsOf(await writeGcn(profileTargetsKrd(), profile));

    // Assert
    expect(steps[PACE_STEP].targetValueOne).toEqual(expect.any(Number));
    expect(steps[PACE_STEP].targetValueTwo).toEqual(expect.any(Number));
    expect(steps[POWER_STEP]).toMatchObject({
      targetValueOne: POWER_BAND_HIGH_W,
      targetValueTwo: POWER_BAND_LOW_W,
    });
    expect(steps[HR_STEP]).toMatchObject({
      targetValueOne: HR_BAND_LOW_BPM,
      targetValueTwo: HR_BAND_HIGH_BPM,
    });
  });

  it("should need no profile for a workout without profile-resolved targets", async () => {
    // Arrange

    // Act
    const gcn = await writeGcn(openKrd(), null);

    // Assert
    expect(stepsOf(gcn)).toHaveLength(1);
  });

  it.each([
    {
      missing: "pace zones",
      profile: { pace: false },
      error: PaceZonesUnavailableError,
      reason: "missing-pace-zones",
    },
    {
      missing: "an FTP",
      profile: { ftp: false },
      error: FtpUnavailableError,
      reason: "missing-ftp",
    },
    {
      missing: "a max HR",
      profile: { maxHr: false },
      error: MaxHrUnavailableError,
      reason: "missing-max-hr",
    },
  ])(
    "should refuse the workout when the profile has no $missing",
    async ({ profile, error, reason }) => {
      // Arrange
      const athlete = await runner(profile);

      // Act
      const run = writeGcn(profileTargetsKrd(), athlete);

      // Assert
      await expect(run).rejects.toBeInstanceOf(error);
      await expect(run).rejects.toMatchObject({ reason });
    }
  );
});
