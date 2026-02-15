/**
 * Bar Height Calculator
 *
 * Maps a workout step's target to a normalized height (0.15–1.0)
 * for the preview bar chart.
 */

import type { Intensity, Target } from "../../../types/krd";

const MIN_HEIGHT = 0.15;
const MAX_POWER_ZONES = 7;
const MAX_PERCENT_FTP = 150;
const MAX_WATTS = 400;
const MAX_HR_ZONES = 5;
const MAX_BPM = 200;
const MAX_PERCENT_HR = 100;
const MAX_PACE_ZONES = 5;
const MAX_MPS = 6;
const MAX_RPM = 120;

const INTENSITY_HEIGHTS: Record<Intensity, number> = {
  warmup: 0.3,
  cooldown: 0.3,
  rest: 0.2,
  recovery: 0.2,
  active: 0.6,
  interval: 0.6,
  other: 0.5,
};

function clamp(value: number): number {
  return Math.max(MIN_HEIGHT, Math.min(1.0, value));
}

function heightFromTarget(target: Target): number | null {
  if (target.type === "open") return null;

  const { value } = target;

  if (target.type === "power") {
    if (value.unit === "zone") return clamp(value.value / MAX_POWER_ZONES);
    if (value.unit === "percent_ftp")
      return clamp(value.value / MAX_PERCENT_FTP);
    if (value.unit === "watts") return clamp(value.value / MAX_WATTS);
    if (value.unit === "range")
      return clamp((value.min + value.max) / (MAX_WATTS * 2));
  }

  if (target.type === "heart_rate") {
    if (value.unit === "zone") return clamp(value.value / MAX_HR_ZONES);
    if (value.unit === "bpm") return clamp(value.value / MAX_BPM);
    if (value.unit === "percent_max")
      return clamp(value.value / MAX_PERCENT_HR);
    if (value.unit === "range")
      return clamp((value.min + value.max) / (MAX_BPM * 2));
  }

  if (target.type === "pace") {
    if (value.unit === "zone") return clamp(value.value / MAX_PACE_ZONES);
    if (value.unit === "mps") return clamp(value.value / MAX_MPS);
    if (value.unit === "range")
      return clamp((value.min + value.max) / (MAX_MPS * 2));
  }

  if (target.type === "cadence") {
    if (value.unit === "rpm") return clamp(value.value / MAX_RPM);
    if (value.unit === "range")
      return clamp((value.min + value.max) / (MAX_RPM * 2));
  }

  // stroke_type is categorical — fall through to intensity
  return null;
}

export function calculateNormalizedHeight(
  target: Target,
  intensity?: Intensity
): number {
  const fromTarget = heightFromTarget(target);
  if (fromTarget !== null) return fromTarget;

  return INTENSITY_HEIGHTS[intensity ?? "other"];
}
