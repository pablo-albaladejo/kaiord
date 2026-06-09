/**
 * Removes coaching workouts that are still the untouched 1-step warmup
 * template seeded at "Edit manually" creation time — junk left by eager
 * clicks before the defer-coaching-create change shipped.
 *
 * Safety guards (ALL must hold to delete):
 *   - state === "structured"
 *   - source === "train2go" (coaching source)
 *   - modifiedAt === null (never explicitly saved in the editor)
 *   - createdAt === updatedAt (never written back after initial persist)
 *   - KRD matches the 1-step warmup template by STEP SHAPE:
 *       exactly 1 step, name "Warmup", duration.seconds 600,
 *       target heart_rate zone 1, intensity "warmup"
 *
 * Idempotent: safe to call repeatedly. Does NOT throw on error — logs and
 * returns so it never blocks app start.
 */
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { WorkoutRepository } from "../../ports/workout-repository";
import type { WorkoutRecord } from "../../types/calendar-record";

const TRAIN2GO_SOURCE = "train2go";
const TEMPLATE_STEP_NAME = "Warmup";
const TEMPLATE_DURATION_SECONDS = 600;
const TEMPLATE_HR_ZONE = 1;
const TEMPLATE_INTENSITY = "warmup";

type Step = {
  name?: unknown;
  intensity?: unknown;
  duration?: { type?: unknown; seconds?: unknown };
  target?: { type?: unknown; value?: { unit?: unknown; value?: unknown } };
};

const isTemplateStep = (step: unknown): boolean => {
  const s = step as Step;
  return (
    s.name === TEMPLATE_STEP_NAME &&
    s.intensity === TEMPLATE_INTENSITY &&
    s.duration?.seconds === TEMPLATE_DURATION_SECONDS &&
    s.target?.type === "heart_rate" &&
    s.target?.value?.unit === "zone" &&
    s.target?.value?.value === TEMPLATE_HR_ZONE
  );
};

export const isUntouchedCoachingTemplate = (record: WorkoutRecord): boolean => {
  if (record.state !== "structured") return false;
  if (record.source !== TRAIN2GO_SOURCE) return false;
  if (record.modifiedAt !== null) return false;
  if (record.createdAt !== record.updatedAt) return false;

  const ext = record.krd?.extensions?.structured_workout as
    | { steps?: unknown[] }
    | undefined;
  const steps = ext?.steps;
  if (!Array.isArray(steps) || steps.length !== 1) return false;
  return isTemplateStep(steps[0]);
};

export type RemoveResult = { removed: number };

export const removeUntouchedCoachingTemplates = async (
  workouts: Pick<WorkoutRepository, "getByState" | "delete">,
  sessionMatch: Pick<SessionMatchRepository, "deleteByWorkoutId">
): Promise<RemoveResult> => {
  const structured = await workouts.getByState("structured");
  const junk = structured.filter(isUntouchedCoachingTemplate);

  for (const record of junk) {
    await sessionMatch.deleteByWorkoutId(record.id);
    await workouts.delete(record.id);
  }

  if (junk.length > 0) {
    console.info(
      "[junk-cleanup] removed untouched coaching templates:",
      junk.map((r) => r.id)
    );
  }

  return { removed: junk.length };
};
