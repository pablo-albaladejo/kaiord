/**
 * Where a coaching Workout's KRD comes from: the session's steps table when
 * it has one that becomes a Workout, the AI otherwise. A table is only on
 * the record when the Connector read every cell of it, so a session is
 * never built from part of a table; the AI path is unchanged. A KRD built
 * from the table carries no `aiMeta`: no model was asked.
 */
import type { AiMeta } from "../../types/calendar-fragments";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import type { ResolvedSport } from "./coaching-krd-sport";
import type { ConvertWithAiDeps } from "./convert-coaching-activity-with-ai-types";
import { buildStructuredStepsKrd } from "./structured-steps-krd";

export type CoachingKrd = { krd: KRD; aiMeta: AiMeta | null };

export const resolvePromptText = (activity: CoachingActivityRecord): string =>
  activity.description?.trim()
    ? activity.description
    : `${activity.title} (${activity.sport})`;

const fromTable = (
  activity: CoachingActivityRecord,
  sport: ResolvedSport | null,
  created: string
): KRD | undefined => {
  if (!activity.structuredSteps || !sport) return undefined;
  return buildStructuredStepsKrd({
    groups: activity.structuredSteps,
    sport,
    name: activity.title.trim() || undefined,
    created,
  });
};

export const generateCoachingKrd = async (
  deps: Pick<ConvertWithAiDeps, "generateKrd" | "clock">,
  // The KRD sport of `activity.sport`; `null` (rest day, unmapped sport)
  // leaves the table unused.
  input: { activity: CoachingActivityRecord; resolved: ResolvedSport | null },
  abortSignal: AbortSignal | undefined
): Promise<CoachingKrd> => {
  const { activity, resolved } = input;
  const krd = fromTable(activity, resolved, deps.clock());
  if (krd) return { krd, aiMeta: null };
  return deps.generateKrd({
    text: resolvePromptText(activity),
    // Resolved KRD sport hint; raw Train2Go keys make the LLM guess
    // `generic`. Raw key kept only for unmapped sports.
    sport: resolved?.sport ?? activity.sport,
    abortSignal,
  });
};

/** The four fields a re-processed raw row keeps of a model's `aiMeta`. */
export const pickAiMeta = ({
  provider,
  model,
  promptVersion,
  processedAt,
}: AiMeta) => ({
  provider,
  model,
  promptVersion,
  processedAt,
});
