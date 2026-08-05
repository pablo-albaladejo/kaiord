import { describe, expect, it } from "vitest";

import { profileWith, syncedAccount } from "./test-profile";
import { deriveThresholdProvenance } from "./threshold-provenance";

const FTP = 268;
const OTHER_FTP = 250;
const MAX_HR = 186;
const SWIM_LTHR = 160;
const SWIM_CSS = 98;

const NOW = new Date("2026-08-04T00:00:00.000Z");
const FOUR_DAYS_AGO = "2026-07-31T00:00:00.000Z";
const THIRTEEN_MONTHS_AGO = "2025-07-01T00:00:00.000Z";

describe("deriveThresholdProvenance", () => {
  it("should name the account whose last sync matches the stored value", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP }, undefined, {
      linkedAccounts: [
        syncedAccount("train2go", FOUR_DAYS_AGO, { cyclingFtp: FTP }),
      ],
    });

    // Act
    const provenance = deriveThresholdProvenance(
      profile,
      "cycling.thresholds.ftp",
      FTP,
      NOW
    );

    // Assert
    expect(provenance).toStrictEqual({
      kind: "synced",
      source: "train2go",
      at: FOUR_DAYS_AGO,
      stale: false,
    });
  });

  it("should report a value edited since the sync as entered by hand", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: OTHER_FTP }, undefined, {
      linkedAccounts: [
        syncedAccount("train2go", FOUR_DAYS_AGO, { cyclingFtp: FTP }),
      ],
      updatedAt: FOUR_DAYS_AGO,
    });

    // Act
    const provenance = deriveThresholdProvenance(
      profile,
      "cycling.thresholds.ftp",
      OTHER_FTP,
      NOW
    );

    // Assert
    expect(provenance).toStrictEqual({
      kind: "manual",
      since: FOUR_DAYS_AGO,
      stale: false,
    });
  });

  it("should report a field no snapshot carries as entered by hand", () => {
    // Arrange
    const profile = profileWith("swimming", { lthr: SWIM_LTHR }, undefined, {
      linkedAccounts: [
        syncedAccount("train2go", FOUR_DAYS_AGO, { swimmingCss: SWIM_CSS }),
      ],
      updatedAt: FOUR_DAYS_AGO,
    });

    // Act
    const provenance = deriveThresholdProvenance(
      profile,
      "swimming.thresholds.lthr",
      SWIM_LTHR,
      NOW
    );

    // Assert
    expect(provenance.kind).toBe("manual");
  });

  it("should report a profile with no linked account as entered by hand", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP });

    // Act
    const provenance = deriveThresholdProvenance(
      profile,
      "cycling.thresholds.ftp",
      FTP,
      NOW
    );

    // Assert
    expect(provenance.kind).toBe("manual");
  });

  it("should flag a synced value older than the staleness window", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: MAX_HR }, MAX_HR, {
      linkedAccounts: [
        syncedAccount("train2go", THIRTEEN_MONTHS_AGO, {
          maxHeartRate: MAX_HR,
        }),
      ],
    });

    // Act
    const provenance = deriveThresholdProvenance(
      profile,
      "heartRate.max",
      MAX_HR,
      NOW
    );

    // Assert
    expect(provenance).toMatchObject({ kind: "synced", stale: true });
  });

  it("should flag a hand-entered value only once the profile proves it old", () => {
    // Arrange
    const old = profileWith("cycling", { ftp: FTP }, undefined, {
      updatedAt: THIRTEEN_MONTHS_AGO,
    });
    const recent = profileWith("cycling", { ftp: FTP }, undefined, {
      updatedAt: FOUR_DAYS_AGO,
    });

    // Act
    const field = "cycling.thresholds.ftp" as const;
    const staleOne = deriveThresholdProvenance(old, field, FTP, NOW);
    const freshOne = deriveThresholdProvenance(recent, field, FTP, NOW);

    // Assert
    expect(staleOne).toMatchObject({ kind: "manual", stale: true });
    expect(freshOne).toMatchObject({ kind: "manual", stale: false });
  });
});
