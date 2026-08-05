import { describe, expect, it } from "vitest";

import { profileWith, syncedAccount } from "./test-profile";
import { deriveThresholdDisagreement } from "./threshold-disagreement";

const FTP = 268;
const MAX_HR = 186;
const RECORDED_MAX_HR = 191;
const RUN_PACE = 245;
const RECORDED_RUN_PACE = 238;
const SYNCED_AT = "2026-07-12T00:00:00.000Z";

describe("deriveThresholdDisagreement", () => {
  it("should report the number a source recorded against the one in use", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP }, MAX_HR, {
      linkedAccounts: [
        syncedAccount("train2go", SYNCED_AT, {
          cyclingFtp: FTP,
          maxHeartRate: RECORDED_MAX_HR,
        }),
      ],
    });

    // Act
    const disagreement = deriveThresholdDisagreement(profile, "cycling");

    // Assert
    expect(disagreement).toStrictEqual({
      field: "heartRate.max",
      label: "Max HR",
      unit: "bpm",
      source: "train2go",
      at: SYNCED_AT,
      incoming: "191",
      incomingRaw: RECORDED_MAX_HR,
      current: "186",
    });
  });

  it("should return nothing when every scalar agrees", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP }, MAX_HR, {
      linkedAccounts: [
        syncedAccount("train2go", SYNCED_AT, {
          cyclingFtp: FTP,
          maxHeartRate: MAX_HR,
        }),
      ],
    });

    // Act
    const disagreement = deriveThresholdDisagreement(profile, "cycling");

    // Assert
    expect(disagreement).toBeNull();
  });

  it("should ignore a field the profile has never been given", () => {
    // Arrange
    const profile = profileWith("cycling", {}, undefined, {
      linkedAccounts: [
        syncedAccount("train2go", SYNCED_AT, { cyclingFtp: FTP }),
      ],
    });

    // Act
    const disagreement = deriveThresholdDisagreement(profile, "cycling");

    // Assert
    expect(disagreement).toBeNull();
  });

  it("should return nothing when the account has never synced zones", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP }, MAX_HR, {
      linkedAccounts: [
        {
          source: "train2go",
          externalUserId: "1",
          externalUserName: "tester",
          linkedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    });

    // Act
    const disagreement = deriveThresholdDisagreement(profile, "cycling");

    // Assert
    expect(disagreement).toBeNull();
  });

  it("should format a pace disagreement through the display units", () => {
    // Arrange
    const profile = profileWith("running", {
      thresholdPace: RUN_PACE,
      paceUnit: "min_per_km",
    });
    const withAccount = {
      ...profile,
      linkedAccounts: [
        syncedAccount("train2go", SYNCED_AT, {
          runningThresholdPace: RECORDED_RUN_PACE,
        }),
      ],
    };

    // Act
    const disagreement = deriveThresholdDisagreement(withAccount, "running");

    // Assert
    expect(disagreement).toMatchObject({
      field: "running.thresholds.thresholdPaceSecPerKm",
      incoming: "3:58",
      current: "4:05",
      unit: "/km",
    });
  });
});
