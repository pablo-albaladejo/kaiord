/**
 * The pace zone numbers a workout's targets reference, repetition blocks
 * included: the zones a Garmin export must resolve to m/s ranges.
 */
import type { KRD } from "../types/krd";
import { getStructuredWorkout } from "./structured-workout";

type Node = { target?: unknown; steps?: unknown };

const paceZoneOf = (target: unknown): number | undefined => {
  if (!target || typeof target !== "object") return undefined;
  const { type, value } = target as { type?: unknown; value?: unknown };
  if (type !== "pace" || !value || typeof value !== "object") return undefined;
  const v = value as { unit?: unknown; value?: unknown };
  if (v.unit !== "zone") return undefined;
  // A zone target without a number resolves to no zone: never defined.
  return typeof v.value === "number" ? v.value : 0;
};

const collectZones = (steps: unknown, out: Set<number>): Set<number> => {
  if (!Array.isArray(steps)) return out;
  for (const step of steps as Node[]) {
    if (!step || typeof step !== "object") continue;
    const zone = paceZoneOf(step.target);
    if (zone !== undefined) out.add(zone);
    collectZones(step.steps, out);
  }
  return out;
};

export const referencedPaceZones = (krd: KRD): Set<number> =>
  collectZones(getStructuredWorkout(krd)?.steps, new Set());
