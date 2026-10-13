import { describe, expect, it } from "vitest";

import { getTranslate } from "../../../i18n/use-translate";
import { profileWith } from "../../../lib/athlete/test-profile";
import { deriveInitials, deriveTagline } from "./athlete-identity-helpers";

const CYCLING_FTP = 250;
const CURRENT_KG = 71.4;
const PROFILE_KG = 72.5;
const t = getTranslate("athlete");

describe("deriveInitials", () => {
  it("should take first letters of up to two words uppercased", () => {
    // Arrange
    const name = "ana maria gomez";

    // Act
    const initials = deriveInitials(name);

    // Assert
    expect(initials).toBe("AM");
  });

  it("should fall back to a question mark for blank names", () => {
    // Arrange
    const name = "   ";

    // Act
    const initials = deriveInitials(name);

    // Assert
    expect(initials).toBe("?");
  });
});

describe("deriveTagline", () => {
  it("should join sport nouns for sports that have a config", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: CYCLING_FTP });

    // Act
    const tagline = deriveTagline(profile);

    // Assert
    expect(tagline).toBe("Cyclist");
  });

  it("should fall back to Athlete when no sport config exists", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: CYCLING_FTP });
    const empty = { ...profile, sportZones: {} };

    // Act
    const tagline = deriveTagline(empty);

    // Assert
    expect(tagline).toBe("Athlete");
  });

  it("should name the active sport's primary threshold and the current weight", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: CYCLING_FTP });

    // Act
    const tagline = deriveTagline(profile, "cycling", "metric", t, CURRENT_KG);

    // Assert
    expect(tagline).toBe("Cyclist · 250 W FTP · 71.4 kg");
  });

  it("should state the current weight it is given, not profile.bodyWeight", () => {
    // Arrange
    const profile = profileWith("cycling", {}, undefined, {
      bodyWeight: PROFILE_KG,
    });

    // Act
    const tagline = deriveTagline(profile, "cycling", "metric", t, CURRENT_KG);

    // Assert
    expect(tagline).toBe("Cyclist · 71.4 kg");
  });

  it("should omit the parts the profile does not carry", () => {
    // Arrange
    const profile = profileWith("cycling", {});

    // Act
    const tagline = deriveTagline(profile, "cycling");

    // Assert
    expect(tagline).toBe("Cyclist");
  });
});
