/**
 * A step's colour is its training zone, or nothing.
 *
 * The seven literal hues this replaced encoded two different things at once:
 * intensity (warmup green, recovery grey) and *target type* (power red, heart
 * rate orange), so the same effort changed colour when you switched from
 * watts to bpm. Target type is not an intensity, and a repetition block is
 * not a zone — it used to be painted brand purple, which is why the block
 * read as the loudest object on a screen about training.
 */

import { type ZoneNumber, zoneVar } from "../lib/zone-colors";

const INTENSITY_ZONE: Record<string, ZoneNumber> = {
  rest: 1,
  recovery: 1,
  cooldown: 1,
  warmup: 2,
  other: 3,
  active: 3,
  interval: 4,
};

const DEFAULT_ZONE: ZoneNumber = 3;

/** The zone role token for a step. Repetition blocks and unknown shapes take
    the mid zone rather than borrowing a colour of their own. */
export function getStepColor(step: unknown): string {
  if (typeof step !== "object" || step === null) return zoneVar(DEFAULT_ZONE);

  const intensity = (step as { intensity?: string }).intensity;
  const zone = intensity === undefined ? undefined : INTENSITY_ZONE[intensity];
  return zoneVar(zone ?? DEFAULT_ZONE);
}
