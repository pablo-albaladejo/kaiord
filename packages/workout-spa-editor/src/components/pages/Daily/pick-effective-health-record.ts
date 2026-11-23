/**
 * pickEffectiveHealthRecord — collapses the F3.2 resolver's result into
 * a single record for a headline stat. A ranked read (the athlete's choice or
 * the automatic Authority) already picked one winner; union mode (a kind
 * with no Authority, or an athlete who chose to keep every source) has no
 * ranked winner, so this takes the most recently written record.
 */
import type { ResolveEffectiveSourceResult } from "../../../application/data-source-policy/resolve-effective-source.use-case";

export type EffectiveHealthPick<T> = {
  record: T | undefined;
  sourceBridgeId: string | undefined;
  usedFallback: boolean;
};

export function pickEffectiveHealthRecord<T>(
  result: ResolveEffectiveSourceResult<T> | undefined
): EffectiveHealthPick<T> {
  if (!result) {
    return {
      record: undefined,
      sourceBridgeId: undefined,
      usedFallback: false,
    };
  }
  if (result.mode !== "union") {
    return {
      record: result.effective?.record,
      sourceBridgeId: result.effective?.sourceBridgeId,
      usedFallback: result.usedFallback,
    };
  }
  const last = result.records.at(-1);
  return {
    record: last?.record,
    sourceBridgeId: last?.sourceBridgeId,
    usedFallback: false,
  };
}
