import { describe, expect, it } from "vitest";

import { DATA_FLOWS } from "../application/data-flows/data-flows";
import { type Profile, profileSchema } from "../types/profile";
import { generationContext } from "./athlete-health-context";

/** A value per profile field outside the zones, none of which a generation
 * declares: none may reach the request. */
const OUTSIDE_ZONES = {
  bodyWeight: 71.3,
  maxHeartRate: 187,
  height: 179.4,
  birthDate: "1987-04-12",
  sex: "female",
  restingHeartRate: 47,
  activityLevel: "very_active",
} as const;

const NOT_SENT_BY_DESIGN = [
  "id",
  "origin",
  "name",
  "sportZones",
  "linkedAccounts",
  "createdAt",
  "updatedAt",
];

const PROFILE = {
  id: "8a0f2b4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b",
  name: "Marker",
  ...OUTSIDE_ZONES,
  linkedAccounts: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  sportZones: {
    cycling: {
      thresholds: { lthr: 168, ftp: 251 },
      heartRateZones: {
        method: "custom",
        zones: [{ zone: 2, name: "Aerobic", minBpm: 120, maxBpm: 140 }],
      },
      powerZones: {
        method: "custom",
        zones: [{ zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 }],
      },
    },
  },
} as unknown as Profile;

const textOf = (context: { zonesText?: string; instructions?: string }) =>
  `${context.zonesText ?? ""}\n${context.instructions ?? ""}`;

const ATHLETE = { profile: PROFILE, customPrompt: "No running on Mondays" };

describe("generationContext", () => {
  it("should give every profile field outside the zones a marker, so a new one is checked", () => {
    // Arrange
    const fields = Object.keys(profileSchema.shape);

    // Act
    const unchecked = fields.filter(
      (field) =>
        !(field in OUTSIDE_ZONES) && !NOT_SENT_BY_DESIGN.includes(field)
    );

    // Assert
    expect(unchecked).toEqual([]);
  });

  it("should send only kinds the generation flow declares, and name each one it put in", async () => {
    // Arrange
    const declared: readonly string[] = DATA_FLOWS.generation.kinds;

    // Act
    const { context, kinds } = await generationContext(
      ATHLETE,
      "cycling",
      async () => "send"
    );

    // Assert
    expect(kinds.every((kind) => declared.includes(kind))).toBe(true);
    expect(kinds).toEqual([
      "workoutDescription",
      "aiInstructions",
      "powerPaceZones",
      "heartRateZones",
    ]);
    expect(textOf(context)).toContain("LTHR: 168bpm");
    expect(textOf(context)).toContain("No running on Mondays");
  });

  it("should put no profile value outside the zones in the request", async () => {
    // Arrange
    const markers = Object.values(OUTSIDE_ZONES).map(String);

    // Act
    const { context } = await generationContext(
      ATHLETE,
      undefined,
      async () => "send"
    );

    // Assert
    expect(markers.filter((m) => textOf(context).includes(m))).toEqual([]);
  });

  it("should leave the heart-rate data out, and out of the kinds, when it is withheld", async () => {
    // Arrange
    const athlete = { profile: PROFILE, customPrompt: null };

    // Act
    const { context, kinds } = await generationContext(
      athlete,
      "cycling",
      async () => "withhold"
    );

    // Assert
    expect(kinds).toEqual(["workoutDescription", "powerPaceZones"]);
    expect(textOf(context)).not.toContain("bpm");
    expect(textOf(context)).toContain("FTP: 251W");
  });
});
