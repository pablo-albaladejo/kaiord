/**
 * The health data a description the model writes in a turn may hold: every
 * kind the assistant can read that the turn's requests carried, counted or
 * only declared (an earlier reply replayed). Any text written after reading
 * health data is health data for every Provider it reaches. It is already at
 * a destination only when every one of those kinds already went there this
 * run, under the athlete's answer for it.
 */
import type { TraceSent } from "../../types/trace-schemas";
import { healthKindsOf } from "../data-flows/data-flows";
import type { HealthDataKind } from "../data-flows/data-kinds";
import type { DestinationId } from "../data-flows/destinations";

export type DescriptionHealth = {
  kinds: HealthDataKind[];
  /** Every kind in `kinds` already went to that destination this run. */
  alreadyAt: boolean;
};

const READABLE: ReadonlySet<string> = new Set(
  healthKindsOf("assistantWorkout")
);

const carried = (entry: TraceSent): string[] => [
  ...entry.kinds,
  ...(entry.declared ?? []),
];

export const descriptionHealth = (
  sent: readonly TraceSent[],
  to: DestinationId
): DescriptionHealth => {
  const kinds = [
    ...new Set(sent.flatMap(carried).filter((kind) => READABLE.has(kind))),
  ] as HealthDataKind[];
  const there = new Set(sent.filter((e) => e.to === to).flatMap(carried));
  return {
    kinds,
    alreadyAt: kinds.length > 0 && kinds.every((kind) => there.has(kind)),
  };
};
