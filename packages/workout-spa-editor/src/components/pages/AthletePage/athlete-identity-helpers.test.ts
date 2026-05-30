import { describe, expect, it } from "vitest";

import { profileWith } from "../../../lib/athlete/test-profile";
import { deriveInitials, deriveTagline } from "./athlete-identity-helpers";

const CYCLING_FTP = 250;

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
});
