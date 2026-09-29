import { describe, expect, it } from "vitest";

import type { KRD } from "../../types/krd";
import { profileWith } from "./test-profile";
import { ftpForWorkout, missingFtpReason } from "./workout-ftp";

const FTP = 250;

const workoutFor = (sport: string): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport },
  extensions: { structured_workout: { sport, steps: [] } },
});

describe("ftpForWorkout", () => {
  it("should return the profile FTP for the workout's sport", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP });

    // Act
    const result = ftpForWorkout(profile, workoutFor("cycling"));

    // Assert
    expect(result).toBe(FTP);
  });

  it("should return undefined when the workout's sport has no FTP", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP });

    // Act
    const result = ftpForWorkout(profile, workoutFor("running"));

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when there is no profile", () => {
    // Arrange

    // Act
    const result = ftpForWorkout(null, workoutFor("cycling"));

    // Assert
    expect(result).toBeUndefined();
  });
});

describe("missingFtpReason", () => {
  it.each(["cycling", "running"])(
    "should blame the missing FTP when the sport %s has power zones",
    (sport) => {
      // Arrange
      const krd = workoutFor(sport);

      // Act
      const result = missingFtpReason(krd);

      // Assert
      expect(result).toBe("no-ftp");
    }
  );

  it.each(["generic", "fitness_equipment", "swimming", "constructor"])(
    "should blame the sport when %s has no power zones",
    (sport) => {
      // Arrange
      const krd = workoutFor(sport);

      // Act
      const result = missingFtpReason(krd);

      // Assert
      expect(result).toBe("sport-without-power");
    }
  );

  it("should blame the sport when the workout has none", () => {
    // Arrange
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-01-01T00:00:00.000Z", sport: "" },
      extensions: { structured_workout: { steps: [] } },
    };

    // Act
    const result = missingFtpReason(krd);

    // Assert
    expect(result).toBe("sport-without-power");
  });
});
