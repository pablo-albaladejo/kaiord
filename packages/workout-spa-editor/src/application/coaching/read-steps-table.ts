/**
 * The Train2Go steps table (#1684) read for `chooseCoachingBuilder`: the
 * Workout it describes (`structured-steps-krd.ts`) and the same rows as
 * text for the AI when an Athlete note sends the build there.
 *
 * Returns `null` when there is nothing whole to read: no table on the
 * record (the Connector only stores one it read cell by cell), a sport the
 * KRD cannot hold (a rest day, an unmapped key), or a value out of range.
 * The build then goes to the AI from the coach's text, never from part of
 * a table.
 */
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type {
  CoachingStepGroup,
  CoachingStructuredStep,
} from "../../types/coaching-structured-steps";
import type { ReadStepsTable } from "./choose-coaching-builder";
import { resolveCoachingSport } from "./convert-coaching-activity-with-ai-helpers";
import { buildStructuredStepsKrd } from "./structured-steps-krd";

const rowText = (row: CoachingStructuredStep): string =>
  `${row.durationSeconds} s ${row.zone}, ` +
  `${row.powerWatts.min}-${row.powerWatts.max} W, ` +
  `HR ${row.heartRateBpm.min}-${row.heartRateBpm.max} bpm`;

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
    const sport = resolveCoachingSport(activity);
    if (!groups || !sport) return null;
    const krd = buildStructuredStepsKrd({
      groups,
      sport,
      name: activity.title.trim() || undefined,
      created: clock(),
    });
    return krd ? { krd, text: stepsTableText(groups) } : null;
  };
