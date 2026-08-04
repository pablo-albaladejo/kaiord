import { describe, expect, it } from "vitest";

import { getTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { buildFtpProvenance } from "./workout-ftp-provenance";

const editorT = getTranslate("editor");
const commonT = getTranslate("common");
const NOW = new Date("2026-05-10T12:00:00.000Z");
const FTP = 268;

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    name: "Athlete",
    sportZones: {
      cycling: {
        thresholds: { ftp: FTP },
        heartRateZones: { method: "manual", zones: [] },
      },
    },
    linkedAccounts: [],
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-06T12:00:00.000Z",
    ...overrides,
  } as unknown as Profile;
}

describe("buildFtpProvenance", () => {
  it("should name the FTP and how long ago the profile was updated", () => {
    // Arrange
    const profile = makeProfile();

    // Act
    const text = buildFtpProvenance(
      profile,
      "cycling",
      "Cycling",
      editorT,
      commonT,
      NOW
    );

    // Assert
    expect(text).toBe("Zones from FTP 268 W · updated 4d ago");
  });

  it("should never claim a source the profile does not record", () => {
    // Arrange
    const profile = makeProfile();

    // Act
    const text = buildFtpProvenance(
      profile,
      "cycling",
      "Cycling",
      editorT,
      commonT,
      NOW
    );

    // Assert
    expect(text).not.toMatch(/Garmin|WHOOP|by hand/i);
  });

  it("should say the targets cannot explain themselves when no FTP is set", () => {
    // Arrange
    const profile = makeProfile({ sportZones: {} } as Partial<Profile>);

    // Act
    const text = buildFtpProvenance(
      profile,
      "cycling",
      "Cycling",
      editorT,
      commonT,
      NOW
    );

    // Assert
    expect(text).toBe(
      "No FTP set for Cycling — targets can't name where they come from"
    );
  });

  it("should drop the date rather than invent one when the profile has no updatedAt", () => {
    // Arrange
    const profile = makeProfile({ updatedAt: undefined } as Partial<Profile>);

    // Act
    const text = buildFtpProvenance(
      profile,
      "cycling",
      "Cycling",
      editorT,
      commonT,
      NOW
    );

    // Assert
    expect(text).toBe("Zones from FTP 268 W");
  });

  it.each([
    { label: "no profile at all", profile: null },
    { label: "a profile row written before per-sport zones existed", profile: {} },
  ])("should answer rather than throw for $label", ({ profile }) => {
    // Arrange
    const input = profile as Profile | null;

    // Act
    const text = buildFtpProvenance(
      input,
      "cycling",
      "Cycling",
      editorT,
      commonT,
      NOW
    );

    // Assert
    expect(text).toContain("No FTP set for Cycling");
  });
});
