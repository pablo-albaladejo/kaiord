import { describe, expect, it } from "vitest";

import {
  freshProfile,
  MPS_DIGITS,
  paceZoneKrd,
  RUN_THRESHOLD,
  withThreshold,
} from "../test-utils/pace-zone-fixtures";
import { exportGcnFile, exportGcnWorkout } from "./export-workout-formats";
import { garminPaceZonesFor } from "./garmin-pace-zones";
import { PaceZonesUnavailableError } from "./pace-zones-unavailable-error";

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
    const profile = await withThreshold(
      freshProfile(),
      "running",
      RUN_THRESHOLD
    );
    const krd = paceZoneKrd();
    const [z1, z2] = garminPaceZonesFor(krd, profile) ?? [];

    // Act
    const gcn = (await exportGcnWorkout(krd, profile)) as Gcn;

    // Assert
    const [warmUp, block] = gcn.workoutSegments[0].workoutSteps;
    const interval = block.workoutSteps?.[0];
    expect(warmUp.targetType?.workoutTargetTypeKey).toBe("pace.zone");
    expect(warmUp.targetValueOne).toBeCloseTo(z1!.maxMps, MPS_DIGITS);
    expect(warmUp.targetValueTwo).toBeCloseTo(z1!.minMps, MPS_DIGITS);
    expect(interval?.targetType?.workoutTargetTypeKey).toBe("pace.zone");
    expect(interval?.targetValueOne).toBeCloseTo(z2!.maxMps, MPS_DIGITS);
    expect(interval?.targetValueTwo).toBeCloseTo(z2!.minMps, MPS_DIGITS);
  });

  it("should refuse a pace zone workout with PaceZonesUnavailableError when the profile has no pace zones", async () => {
    // Arrange
    const profile = freshProfile();

    // Act
    const run = exportGcnWorkout(paceZoneKrd(), profile);

    // Assert
    await expect(run).rejects.toBeInstanceOf(PaceZonesUnavailableError);
  });
});

describe("exportGcnFile", () => {
  it("should resolve pace zones from the profile like the push payload", async () => {
    // Arrange
    const profile = await withThreshold(
      freshProfile(),
      "running",
      RUN_THRESHOLD
    );

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
    await expect(run).rejects.toBeInstanceOf(PaceZonesUnavailableError);
  });
});
