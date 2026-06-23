/**
 * Safety-cap resolution for the daily goal delta. Pure; no external deps.
 *
 * A cap either binds (clamp the delta to the safe value) or is overridden (the
 * user accepted an unsafe pace, so the raw delta is used). In both bound cases
 * `capped`/`capReason` stay set so the UI keeps its warning.
 */

export type ComputeDailyDeltaResult = {
  dailyDeltaKcal: number;
  capped: boolean;
  capReason: string | null;
  /** True when a cap would have bound but the user overrode it. */
  overridden: boolean;
};

export type CapDecision = {
  capped: boolean;
  rawDelta: number;
  clampedDelta: number;
  reason: string;
  overrideCap?: boolean;
};

/**
 * Apply a cap: clamp unless the user overrode it. When the cap binds an
 * override returns the raw delta yet still reports `capped`/`capReason` so the
 * UI keeps its warning; otherwise the clamped delta is returned.
 */
export const resolveCap = (decision: CapDecision): ComputeDailyDeltaResult => {
  const overridden = decision.capped && decision.overrideCap === true;
  // Use the raw delta when the cap does not bind or the user overrode it.
  const clamp = decision.capped && !overridden;
  return {
    dailyDeltaKcal: clamp ? decision.clampedDelta : decision.rawDelta,
    capped: decision.capped,
    capReason: decision.capped ? decision.reason : null,
    overridden,
  };
};
