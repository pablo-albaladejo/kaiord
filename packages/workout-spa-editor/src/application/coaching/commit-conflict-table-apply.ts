/**
 * `applyOneTable` — writes Train2Go's values for the given bands of one
 * sport-kind table and marks the table `method = "train2go"` (D-MA4).
 */
import type { ConflictItem } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import { writeField } from "./sync-zones-profile-fields";
import type { Sport, ZoneKind } from "./zone-table-classifier-types";

const setTableMethod = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind,
  method: string
): Profile => {
  const sportConfig = profile.sportZones[sport];
  if (!sportConfig) return profile;
  const tc = (sportConfig as Record<string, unknown>)[kind] as
    { method?: string; zones?: unknown[] } | undefined;
  if (!tc) return profile;
  return {
    ...profile,
    sportZones: {
      ...profile.sportZones,
      [sport]: { ...sportConfig, [kind]: { ...tc, method } },
    },
  };
};

export const applyOneTable = (
  profile: Profile,
  sport: Sport,
  kind: ZoneKind,
  bands: readonly ConflictItem[]
): Profile =>
  setTableMethod(
    bands.reduce((next, b) => writeField(next, b.field, b.incoming), profile),
    sport,
    kind,
    "train2go"
  );
