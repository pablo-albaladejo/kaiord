import type { PaceZoneTable } from "@kaiord/garmin";
import { describe, expect, it } from "vitest";

import { writeThreshold } from "../application/coaching/sync-zones-threshold-fields";
import { deriveZoneMap } from "../lib/athlete/derive-zone-map";
import { formatPace } from "../lib/athlete/format";
import {
  ALL_ZONES,
  coachSyncedProfile,
  danielsZones,
  editorZone,
  freshProfile,
  MPS_DIGITS,
  paceZoneKrd,
  RUN_THRESHOLD,
  SWIM_THRESHOLD,
  T2G_RUN_BANDS,
  withDaniels,
  withEditedZones,
  withThreshold,
} from "../test-utils/pace-zone-fixtures";
import { PaceZonesUnavailableError } from "../types/pace-zones-unavailable-error";
import type { Profile } from "../types/profile";
import { garminPaceZonesFor } from "./garmin-pace-zones";
import { OPEN_END_FACTOR, thresholdZoneTable } from "./pace-zone-table";

const KM = 1000;
const HUNDRED_M = 100;
const FAST = 360;
const SLOW = 420;
const SWIM_FAST = 95;
const SWIM_SLOW = 110;
const BEYOND_THE_MODEL = 6;
const NEW_THRESHOLD = 270;

/** The table's ranges written the way the Athlete page's zone map is. */
const shown = (table: PaceZoneTable | undefined, metres: number) =>
  (table ?? []).map((z, i, all) => {
    const fast = formatPace(metres / z.maxMps);
    const slow = formatPace(metres / z.minMps);
    if (i === 0) return `> ${fast}`;
    if (i === all.length - 1) return `< ${slow}`;
    return `${fast}–${slow}`;
  });

const displayed = (profile: Profile, sport: "running" | "swimming") =>
  (deriveZoneMap(profile, sport) ?? []).map((e) => e.range.split(" /")[0]);

const reasonOf = (act: () => unknown) => {
  try {
    act();
  } catch (error) {
    return error instanceof PaceZonesUnavailableError ? error.reason : error;
  }
  return undefined;
};

describe("garminPaceZonesFor", () => {
  it("should need no zones for a workout without pace zone targets", () => {
    // Arrange
    const krd = { ...paceZoneKrd(), extensions: {} };

    // Act
    const table = garminPaceZonesFor(krd, null);

    // Assert
    expect(table).toBeUndefined();
  });

  it.each([
    { sport: "running" as const, pace: RUN_THRESHOLD, metres: KM },
    { sport: "swimming" as const, pace: SWIM_THRESHOLD, metres: HUNDRED_M },
  ])(
    "should derive Z1–Z5 from the threshold pace of a fresh $sport profile, as the Athlete page shows them",
    async ({ sport, pace, metres }) => {
      // Arrange
      const profile = await withThreshold(freshProfile(), sport, pace);

      // Act
      const table = garminPaceZonesFor(paceZoneKrd(sport, ALL_ZONES), profile);

      // Assert
      expect(profile.sportZones[sport]?.paceZones?.zones).toEqual([]);
      expect(shown(table, metres)).toEqual(displayed(profile, sport));
    }
  );

  it("should follow the zone map, not the method's zones, when a method computed the stored zones", async () => {
    // Arrange
    const daniels = await withDaniels(freshProfile(), "running");
    const profile = await withThreshold(daniels, "running", RUN_THRESHOLD);

    // Act
    const table = garminPaceZonesFor(
      paceZoneKrd("running", ALL_ZONES),
      profile
    );

    // Assert
    expect(profile.sportZones.running?.paceZones?.zones).toEqual(
      danielsZones(RUN_THRESHOLD)
    );
    expect(shown(table, KM)).toEqual(displayed(profile, "running"));
  });

  it("should follow a coach-synced threshold that left a formula method's zones stale", async () => {
    // Arrange
    const daniels = await withDaniels(freshProfile(), "running");
    const before = await withThreshold(daniels, "running", RUN_THRESHOLD);
    const profile = writeThreshold(
      before,
      "running.thresholds.thresholdPaceSecPerKm",
      NEW_THRESHOLD
    );

    // Act
    const table = garminPaceZonesFor(
      paceZoneKrd("running", ALL_ZONES),
      profile
    );

    // Assert
    expect(profile.sportZones.running?.paceZones?.zones).toEqual(
      danielsZones(RUN_THRESHOLD)
    );
    expect(table).toEqual(thresholdZoneTable(NEW_THRESHOLD, KM));
    expect(shown(table, KM)).toEqual(displayed(profile, "running"));
  });

  it("should resolve Z5 of edited zones whose fast end calculatePaceZones stored as 0", async () => {
    // Arrange
    const zones = danielsZones(RUN_THRESHOLD);
    const profile = await withEditedZones(freshProfile(), "running", zones);
    const z5SlowEnd = zones[4]!.maxPace;

    // Act
    const table = garminPaceZonesFor(
      paceZoneKrd("running", ALL_ZONES),
      profile
    );

    // Assert
    expect(table?.map((z) => z.zone)).toEqual(ALL_ZONES);
    expect(table?.[4]?.minMps).toBeCloseTo(KM / z5SlowEnd, MPS_DIGITS);
    expect(table?.[4]?.maxMps).toBeCloseTo(
      (KM / z5SlowEnd) * OPEN_END_FACTOR,
      MPS_DIGITS
    );
  });

  it("should let zones the athlete edited win over the threshold pace", async () => {
    // Arrange
    const withPace = await withThreshold(
      freshProfile(),
      "running",
      RUN_THRESHOLD
    );
    const profile = await withEditedZones(withPace, "running", [
      editorZone(1, FAST, SLOW),
    ]);

    // Act
    const table = garminPaceZonesFor(paceZoneKrd("running", [1]), profile);

    // Assert
    expect(table).toEqual([{ zone: 1, minMps: KM / SLOW, maxMps: KM / FAST }]);
  });

  it("should read a swim zone from the zone editor as per 100 m, whatever unit it carries", async () => {
    // Arrange
    const zone = editorZone(1, SWIM_FAST, SWIM_SLOW);
    const profile = await withEditedZones(freshProfile(), "swimming", [zone]);

    // Act
    const table = garminPaceZonesFor(paceZoneKrd("swimming", [1]), profile);

    // Assert
    expect(zone.unit).toBe("min_per_km");
    expect(table).toEqual([
      { zone: 1, minMps: HUNDRED_M / SWIM_SLOW, maxMps: HUNDRED_M / SWIM_FAST },
    ]);
  });

  it("should resolve Z1–Z5 a Train2Go sync wrote into a fresh profile, Z5 open-ended", () => {
    // Arrange
    const profile = coachSyncedProfile();
    const z5SlowEnd = T2G_RUN_BANDS[4][1];

    // Act
    const table = garminPaceZonesFor(
      paceZoneKrd("running", ALL_ZONES),
      profile
    );

    // Assert
    expect(table?.map((z) => z.zone)).toEqual(ALL_ZONES);
    expect(table?.[4]?.minMps).toBeCloseTo(KM / z5SlowEnd, MPS_DIGITS);
  });

  it.each([
    {
      label: "there is no profile",
      krd: paceZoneKrd(),
      profile: async () => null,
      reason: "missing-pace-zones",
    },
    {
      label: "a fresh profile has no threshold pace",
      krd: paceZoneKrd(),
      profile: async () => freshProfile(),
      reason: "missing-pace-zones",
    },
    {
      label: "the edited zones lack a referenced zone",
      krd: paceZoneKrd("running", [1, 2]),
      profile: () =>
        withEditedZones(freshProfile(), "running", [editorZone(1, FAST, SLOW)]),
      reason: "incomplete-pace-zones",
    },
    {
      label: "a zone lies beyond the zone map's five",
      krd: paceZoneKrd("running", [BEYOND_THE_MODEL]),
      profile: () => withThreshold(freshProfile(), "running", RUN_THRESHOLD),
      reason: "incomplete-pace-zones",
    },
    {
      label: "the workout is multisport",
      krd: paceZoneKrd("multisport"),
      profile: () => withThreshold(freshProfile(), "running", RUN_THRESHOLD),
      reason: "unsupported-pace-zone-sport",
    },
    {
      label: "the workout is a cycling workout",
      krd: paceZoneKrd("cycling"),
      profile: () => withThreshold(freshProfile(), "running", RUN_THRESHOLD),
      reason: "unsupported-pace-zone-sport",
    },
  ])("should refuse with $reason when $label", async (c) => {
    // Arrange
    const profile = await c.profile();

    // Act
    const reason = reasonOf(() => garminPaceZonesFor(c.krd, profile));

    // Assert
    expect(reason).toBe(c.reason);
  });
});
