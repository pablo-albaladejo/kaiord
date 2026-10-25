/**
 * The same-sport check run before every athlete move (design §3.8). Each
 * input is one thing on the target day: a matched session, a solo workout
 * or recording, or a solo coach plan. `workoutIds` lets a reader drop the
 * moved session itself. A sport the canonical map does not know is compared
 * by its trimmed lowercase name, never widened to "matches everything".
 */
import type { CanonicalSport } from "./coaching/match-executed-refs";

export type DayInput = {
  workoutIds: readonly string[];
  sport: string;
  recording: boolean;
};

export type SameSportVerdict =
  { kind: "clear" } | { kind: "conflict"; recording: boolean };

const sportKey = (sport: string, canonicalSport: CanonicalSport): string =>
  canonicalSport(sport) ?? sport.trim().toLowerCase();

export const sameSportOnDay = (
  inputs: readonly DayInput[],
  sport: string,
  canonicalSport: CanonicalSport
): SameSportVerdict => {
  const key = sportKey(sport, canonicalSport);
  const same = inputs.filter((i) => sportKey(i.sport, canonicalSport) === key);
  if (same.length === 0) return { kind: "clear" };
  return { kind: "conflict", recording: same.some((i) => i.recording) };
};
