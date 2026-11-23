/**
 * The health data a description the model writes in a turn may hold: every
 * health kind the turn's requests carried, counted or only declared (an
 * earlier reply replayed). Any text written after reading health data is
 * health data for every Provider it reaches.
 */
import type { TraceSent } from "../../types/trace-schemas";
import { type HealthDataKind, isHealthKind } from "../data-flows/data-kinds";
import type { DestinationId } from "../data-flows/destinations";

export type DescriptionHealth = {
  kinds: HealthDataKind[];
  /** That destination already received health data in this turn, under the
   * athlete's own decision for it. */
  alreadyAt: boolean;
};

const healthOf = (entry: TraceSent): HealthDataKind[] =>
  [...entry.kinds, ...(entry.declared ?? [])].filter(isHealthKind);

export const descriptionHealth = (
  sent: readonly TraceSent[],
  to: DestinationId
): DescriptionHealth => ({
  kinds: [...new Set(sent.flatMap(healthOf))],
  alreadyAt: sent.some(
    (entry) => entry.to === to && healthOf(entry).length > 0
  ),
});
