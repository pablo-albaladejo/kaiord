import { describe, expect, it } from "vitest";

import {
  MPS_DIGITS,
  paceProfile,
  paceZoneKrd,
  RUNNING_PACE_ZONES,
  RUNNING_Z1_MPS,
  RUNNING_Z2_MPS,
} from "../test-utils/pace-zone-fixtures";
import { exportGcnFile, exportGcnWorkout } from "./export-workout-formats";
import { MissingPaceZonesError } from "./garmin-pace-zones";

type GcnStep = {
  targetType?: { workoutTargetTypeKey: string };
  targetValueOne?: number;
  targetValueTwo?: number;
  workoutSteps?: GcnStep[];
};
type Gcn = { workoutSegments: Array<{ workoutSteps: GcnStep[] }> };

describe("exportGcnWorkout", () => {
  it("should write pace zone targets as the profile's m/s ranges, fastest bound first", async () => {
    // Arrange
    const profile = paceProfile(RUNNING_PACE_ZONES);

    // Act
    const gcn = (await exportGcnWorkout(paceZoneKrd(), profile)) as Gcn;

    // Assert
    const [warmUp, block] = gcn.workoutSegments[0].workoutSteps;
    const interval = block.workoutSteps?.[0];
    expect(warmUp.targetType?.workoutTargetTypeKey).toBe("pace.zone");
    expect(warmUp.targetValueOne).toBeCloseTo(
      RUNNING_Z1_MPS.maxMps,
      MPS_DIGITS
    );
    expect(warmUp.targetValueTwo).toBeCloseTo(
      RUNNING_Z1_MPS.minMps,
      MPS_DIGITS
    );
    expect(interval?.targetType?.workoutTargetTypeKey).toBe("pace.zone");
    expect(interval?.targetValueOne).toBeCloseTo(
      RUNNING_Z2_MPS.maxMps,
      MPS_DIGITS
    );
    expect(interval?.targetValueTwo).toBeCloseTo(
      RUNNING_Z2_MPS.minMps,
      MPS_DIGITS
    );
  });

  it("should refuse a pace zone workout with MissingPaceZonesError when the profile has no pace zones", async () => {
    // Arrange
    const profile = paceProfile();

    // Act
    const run = exportGcnWorkout(paceZoneKrd(), profile);

    // Assert
    await expect(run).rejects.toBeInstanceOf(MissingPaceZonesError);
  });
});

describe("exportGcnFile", () => {
  it("should resolve pace zones from the profile like the push payload", async () => {
    // Arrange
    const profile = paceProfile(RUNNING_PACE_ZONES);

    // Act
    const bytes = await exportGcnFile(paceZoneKrd(), undefined, profile);

    // Assert
    const gcn = JSON.parse(new TextDecoder().decode(bytes)) as Gcn;
    expect(gcn).toEqual(await exportGcnWorkout(paceZoneKrd(), profile));
  });

  it("should refuse a pace zone workout when no profile is given", async () => {
    // Arrange
    const krd = paceZoneKrd();

    // Act
    const run = exportGcnFile(krd);

    // Assert
    await expect(run).rejects.toBeInstanceOf(MissingPaceZonesError);
  });
});
