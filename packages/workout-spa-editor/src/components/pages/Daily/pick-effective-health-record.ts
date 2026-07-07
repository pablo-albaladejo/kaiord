/**
 * pickEffectiveHealthRecord — collapses the F3.2 resolver's result into
 * a single record for a headline stat. Priority mode already picked one
 * winner; union mode (today's default — no companion row exists yet)
 * has no ranked winner, so this takes the most recently written record,
 * matching the pre-resolver `.at(-1)` behavior when there's only one.
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
  if (result.mode === "priority") {
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
