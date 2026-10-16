/**
 * The weight is not a profile field (it is the current weight, a weigh-in),
 * so the profile accessors refuse it instead of silently reading or writing
 * nothing.
 */
import { describe, expect, it } from "vitest";

import type { FieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { readField, writeField } from "./sync-zones-profile-fields";

const NOW = "2026-10-14T09:00:00.000Z";
const FTP = 250;
const WEIGHT_KG = 80;
const WEIGHT_FIELD: FieldKey = "bodyWeight";

const profile: Profile = {
  id: "p-1",
  name: "Athlete",
  bodyWeight: WEIGHT_KG,
  sportZones: {},
  linkedAccounts: [],
  createdAt: NOW,
  updatedAt: NOW,
};

describe("profile field accessors", () => {
  it("should read and write a threshold field", () => {
    // Arrange
    const field: FieldKey = "cycling.thresholds.ftp";

    // Act
    const written = writeField(profile, field, FTP);

    // Assert
    expect(readField(written, field)).toBe(FTP);
  });

  it("should refuse to read the weight as a profile field", () => {
    // Arrange
    // Act
    const read = () => readField(profile, WEIGHT_FIELD);

    // Assert
    expect(read).toThrow(/bodyWeight/);
  });

  it("should refuse to write the weight as a profile field", () => {
    // Arrange
    // Act
    const write = () => writeField(profile, WEIGHT_FIELD, WEIGHT_KG);

    // Assert
    expect(write).toThrow(/bodyWeight/);
  });
});
