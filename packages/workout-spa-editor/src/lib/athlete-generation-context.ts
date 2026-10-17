import type { AthleteContext } from "@kaiord/ai";
import type { Sport } from "@kaiord/core";

import { formatZonesContext } from "../components/organisms/AiWorkoutInput/zones-formatter";
import type { PersistencePort } from "../ports/persistence-port";
import type { Profile } from "../types/profile";
import { isSportKey } from "../types/sport-zones";
import { athleteZoneTables } from "./athlete-zone-tables";

/** What every AI generation knows about the athlete. */
export type AthleteInput = {
  profile: Profile | null;
  customPrompt: string | null;
};

/** The active profile and the athlete's "Instructions for the AI". */
export const loadAthleteInput = async (
  persistence: Pick<PersistencePort, "profiles" | "aiProviders">
): Promise<AthleteInput> => {
  const [id, customPrompt] = await Promise.all([
    persistence.profiles.getActiveId(),
    persistence.aiProviders.getCustomPrompt(),
  ]);
  const profile = id ? await persistence.profiles.getById(id) : undefined;
  return { profile: profile ?? null, customPrompt };
};

export const toAthleteContext = (
  input: AthleteInput,
  sport: Sport | undefined
): AthleteContext => {
  const key = sport && isSportKey(sport) ? sport : undefined;
  return {
    zonesText: input.profile
      ? formatZonesContext(input.profile, key)
      : undefined,
    instructions: input.customPrompt ?? undefined,
    zones: athleteZoneTables(input.profile, key),
  };
};
