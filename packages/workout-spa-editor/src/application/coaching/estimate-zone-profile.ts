import {
  flattenSteps,
  mergeSegments,
  totalSeconds,
} from "./estimate-zone-profile-flatten";
import { UnestimableError } from "./estimate-zone-profile-hide";
import { parseLines, planLines } from "./estimate-zone-profile-lines";
import { isBalancedWithin } from "./estimate-zone-profile-mask";
import {
  isUnreadable,
  normalizeCoachText,
} from "./estimate-zone-profile-normalize";
import type { EstimatedSegment } from "./estimate-zone-profile-types";

export type {
  EstimatedSegment,
  EstimatedZone,
} from "./estimate-zone-profile-types";

const MAX_INPUT_LENGTH = 4000;
const MAX_NESTING = 3;
const MAX_TOTAL_SECONDS = 6 * 3600;
const STATED_TOLERANCE_SECONDS = 5 * 60;
const STATED_TOLERANCE_RATIO = 0.15;

// Coaches round stated totals, so a total within max(5 min, 15%) of the
// breakdown reconciles; a larger gap means the breakdown misread the text.
const reconciles = (stated: number, breakdown: number): boolean =>
  Math.abs(breakdown - stated) <=
  Math.max(STATED_TOLERANCE_SECONDS, stated * STATED_TOLERANCE_RATIO);

const estimate = (text: string): Array<EstimatedSegment> => {
  const normalized = normalizeCoachText(text);
  if (isUnreadable(normalized)) return [];
  if (!isBalancedWithin(normalized, MAX_NESTING)) return [];
  const plan = planLines(normalized);
  const parsed = parseLines(plan.body);
  const segments = flattenSteps(parsed.steps).filter((s) => s.seconds > 0);
  const total = totalSeconds(segments);
  const stated = [...plan.expected, ...parsed.expected];
  if (total > MAX_TOTAL_SECONDS) return [];
  if (!stated.every((summary) => reconciles(summary, total))) return [];
  const merged = mergeSegments(segments);
  return merged.some((s) => s.zone !== null) ? merged : [];
};

export const estimateZoneProfile = (text: string): Array<EstimatedSegment> => {
  if (text.length > MAX_INPUT_LENGTH) return [];
  try {
    return estimate(text);
  } catch (error) {
    if (error instanceof UnestimableError) return [];
    throw error;
  }
};
