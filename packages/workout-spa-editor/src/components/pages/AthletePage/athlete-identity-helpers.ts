import { getTranslate, type Translate } from "../../../i18n/use-translate";
import {
  type ActiveSport,
  ATHLETE_SPORTS,
  deriveThresholdMetrics,
} from "../../../lib/athlete";
import type { Units } from "../../../lib/units/units";
import { formatWeightKg } from "../../../lib/units/units";
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

const sportNouns = (profile: Profile, t: Translate): string[] =>
  ATHLETE_SPORTS.filter(
    (sport) => profile.sportZones[sport.value] !== undefined
  ).map((sport) => t(`tagline.${sport.value}`));

/**
 * Who this athlete is, in one line: the sports they have configured, the
 * threshold the active sport's zones derive from, and their body weight.
 * Each part is omitted when the profile does not carry it — the line states
 * what is known and claims nothing else.
 */
export function deriveTagline(
  profile: Profile,
  sport?: ActiveSport,
  units: Units = "metric",
  t: Translate = getTranslate("athlete")
): string {
  const parts = sportNouns(profile, t);
  if (parts.length === 0) parts.push(t("tagline.fallback"));

  const primary = sport
    ? deriveThresholdMetrics(profile, sport, units)[0]
    : undefined;
  if (primary) {
    const value = primary.unit
      ? `${primary.value} ${primary.unit}`
      : primary.value;
    parts.push(`${value} ${primary.label}`);
  }
  if (profile.bodyWeight !== undefined) {
    parts.push(formatWeightKg(profile.bodyWeight, units));
  }
  return parts.join(" · ");
}
