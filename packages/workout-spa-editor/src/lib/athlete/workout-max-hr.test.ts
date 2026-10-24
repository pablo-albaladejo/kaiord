import { MissingMaxHeartRateError } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { MaxHrUnavailableError } from "../../types/max-hr-unavailable-error";
import { profileWith } from "./test-profile";
import { maxHrForWorkout, refuseMissingMaxHr } from "./workout-max-hr";

const MAX_HR = 190;

describe("maxHrForWorkout", () => {
  it("should return the profile's max heart rate", () => {
    // Arrange
    const profile = profileWith("running", {}, MAX_HR);

    // Act
    const maxHr = maxHrForWorkout(profile);

    // Assert
    expect(maxHr).toBe(MAX_HR);
  });

  it.each([null, undefined, profileWith("running", {})])(
    "should be undefined without a profile max heart rate (%#)",
    (profile) => {
      // Arrange

      // Act
      const maxHr = maxHrForWorkout(profile);

      // Assert
      expect(maxHr).toBeUndefined();
    }
  );
});

describe("refuseMissingMaxHr", () => {
  it("should turn MissingMaxHeartRateError into a missing-max-hr refusal", async () => {
    // Arrange
    const write = async () => {
      throw new MissingMaxHeartRateError("garmin");
    };

    // Act
    const run = refuseMissingMaxHr(write);

    // Assert
    await expect(run).rejects.toBeInstanceOf(MaxHrUnavailableError);
    await expect(run).rejects.toMatchObject({ reason: "missing-max-hr" });
  });

  it("should rethrow any other error unchanged", async () => {
    // Arrange
    const other = new Error("boom");

    // Act
    const run = refuseMissingMaxHr(async () => {
      throw other;
    });

    // Assert
    await expect(run).rejects.toBe(other);
  });
});
