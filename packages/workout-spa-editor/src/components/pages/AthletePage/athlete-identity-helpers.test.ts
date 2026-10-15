import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
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
  it("should join sport nouns for sports that have a threshold", () => {
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

  // P-20: a new profile carries an empty config for every sport, so a config
  // alone says nothing about what the athlete does.
  it("should not name a sport whose config has no threshold", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: CYCLING_FTP });
    profile.sportZones.running = {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
    };

    // Act
    const tagline = deriveTagline(profile);

    // Assert
    expect(tagline).toBe("Cyclist");
  });

  it("should fall back to Athlete when no sport has a threshold", () => {
    // Arrange
    const profile = profileWith("cycling", {});

    // Act
    const tagline = deriveTagline(profile);

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
    expect(tagline).toBe("Athlete · 71.4 kg");
  });

  it("should omit the parts the profile does not carry", () => {
    // Arrange
    const profile = profileWith("cycling", {});

    // Act
    const tagline = deriveTagline(profile, "cycling");

    // Assert
    expect(tagline).toBe("Athlete");
  });
});

describe("deriveTagline in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name the heart-rate threshold with ppm, never Threshold HR or bpm", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: 168 });

    // Act
    const tagline = deriveTagline(
      profile,
      "cycling",
      "metric",
      getTranslate("athlete", "es"),
      undefined,
      getTranslate("common", "es")("units.hr")
    );

    // Assert
    expect(tagline).toContain("168 ppm FC umbral");
    expect(tagline).not.toMatch(/Threshold HR|bpm/);
  });
});
