/**
 * The Train2Go steps table read for `chooseCoachingBuilder`: its rows as
 * text for the AI, and the Workout it describes (`structured-steps-krd.ts`).
 *
 * Returns `null` only when the record has no table (the Connector only
 * stores one it read cell by cell). A table whose Workout the KRD cannot
 * hold (a rest day, an unmapped sport key, a value out of range) keeps its
 * text with a `null` KRD, so the AI still reads it; a Workout is never
 * built from part of a table.
 */
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type {
  CoachingStepGroup,
  CoachingStructuredStep,
} from "../../types/coaching-structured-steps";
import type { ReadStepsTable } from "./choose-coaching-builder";
import { resolveCoachingSport } from "./convert-coaching-activity-with-ai-helpers";
import { buildStructuredStepsKrd, heartRateText } from "./structured-steps-krd";

const rowText = (row: CoachingStructuredStep): string =>
  `${row.durationSeconds} s ${row.zone}, ` +
  `${row.powerWatts.min}-${row.powerWatts.max} W, ` +
  heartRateText(row);

const groupText = (group: CoachingStepGroup): string =>
  group.repeat > 1
    ? [`${group.repeat} ×`, ...group.steps.map((r) => `  ${rowText(r)}`)].join(
        "\n"
      )
    : group.steps.map(rowText).join("\n");

/** The table as plain lines, a repeat block as an "N ×" group. */
export const stepsTableText = (groups: CoachingStepGroup[]): string =>
  groups.map(groupText).join("\n");

/** `clock` stamps the KRD's `created` time. */
export const createReadStepsTable =
  (clock: () => string): ReadStepsTable =>
  (activity: CoachingActivityRecord) => {
    const groups = activity.structuredSteps;
    if (!groups) return null;
    const sport = resolveCoachingSport(activity);
    const krd = sport
      ? buildStructuredStepsKrd({
          groups,
          sport,
          name: activity.title.trim() || undefined,
          created: clock(),
        })
      : undefined;
    return { text: stepsTableText(groups), krd: krd ?? null };
  };
