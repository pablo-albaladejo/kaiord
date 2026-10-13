import type { Profile } from "../../types/profile";
import type { Units } from "../units/units";
import { type PaceBase, paceSecondsFactor } from "../units/units";
import { formatPace } from "./format";
import type { ActiveSport } from "./sports";
import type { ThresholdFieldId } from "./threshold-field-specs";

const MAX_HEART_RATE = 250;
const PACE = /^(\d{1,2}):([0-5]\d)$/;
const SECONDS_PER_MINUTE = 60;

/** `undefined` clears the value; `null` means the text is not a value. */
export type ParsedThreshold = number | undefined | null;

const parseWhole = (raw: string, max: number): ParsedThreshold => {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 && value <= max ? value : null;
};

const parsePace = (raw: string, factor: number): ParsedThreshold => {
  const match = PACE.exec(raw);
  if (!match) return null;
  const seconds = Number(match[1]) * SECONDS_PER_MINUTE + Number(match[2]);
  return seconds > 0 ? Math.round(seconds / factor) : null;
};

/** Reads what the athlete typed into a threshold field. A pace is typed as
    m:ss in the active units and stored in seconds per the sport's base. */
export function parseThreshold(
  id: ThresholdFieldId,
  raw: string,
  base: PaceBase,
  units: Units
): ParsedThreshold {
  const text = raw.trim();
  if (text === "") return undefined;
  if (id === "thresholdPace") {
    return parsePace(text, paceSecondsFactor(base, units));
  }
  return parseWhole(text, id === "ftp" ? Infinity : MAX_HEART_RATE);
}

/** The text a stored threshold shows as, in the active units. */
export function formatThreshold(
  id: ThresholdFieldId,
  value: number | undefined,
  base: PaceBase,
  units: Units
): string {
  if (value === undefined) return "";
  if (id === "thresholdPace") {
    return formatPace(value * paceSecondsFactor(base, units));
  }
  return value.toString();
}

/** The stored number behind a threshold field. */
export const storedThreshold = (
  profile: Profile,
  sport: ActiveSport,
  id: ThresholdFieldId
): number | undefined =>
  id === "maxHeartRate"
    ? profile.maxHeartRate
    : profile.sportZones[sport]?.thresholds[id];
