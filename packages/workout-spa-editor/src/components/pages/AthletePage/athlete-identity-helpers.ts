import { type ActiveSport, ATHLETE_SPORTS } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";

const MAX_INITIAL_WORDS = 2;

/** First letters of up to two name words, uppercased. Falls back to "?". */
export function deriveInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIAL_WORDS)
    .map((word) => word[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

const SPORT_NOUN: Record<ActiveSport, string> = {
  cycling: "Cyclist",
  running: "Runner",
  swimming: "Swimmer",
};

/** Tagline like "Cyclist · Runner" for sports that have a stored config. */
export function deriveTagline(profile: Profile): string {
  const nouns = ATHLETE_SPORTS.filter(
    (sport) => profile.sportZones[sport.value] !== undefined
  ).map((sport) => SPORT_NOUN[sport.value]);
  return nouns.join(" · ") || "Athlete";
}
