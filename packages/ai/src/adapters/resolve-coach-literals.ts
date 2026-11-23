import { resolveDuration } from "./resolve-durations";
import type { RawDuration } from "./resolve-durations";
import { resolvePaceValue } from "./resolve-pace-literals";
import type { RawValue } from "./resolve-pace-literals";
import { resolveHeartRateValue, resolveReference } from "./resolve-references";
import { resolveRepeatFill } from "./resolve-repeat-fill";

/**
 * Deterministic post-processing of the model's raw output, run before zone
 * resolution and strict validation. The model names what the coach wrote,
 * in the coach's own units; code computes every number a Workout carries.
 * A literal code cannot read throws, and the message goes back to the model
 * on retry.
 */

type RawStep = {
  stepIndex?: unknown;
  duration?: RawDuration;
  target?: { type?: string; value?: RawValue };
  [key: string]: unknown;
};
type RawBlock = { steps: Array<RawStep>; [key: string]: unknown };

const hasSteps = (s: unknown): s is RawBlock =>
  typeof s === "object" && s !== null && Array.isArray((s as RawBlock).steps);

const resolveValue = (step: RawStep, type: string, value: RawValue) => {
  if (type === "heart_rate") return resolveHeartRateValue(value);
  if (type !== "pace") return value;
  return resolvePaceValue(resolveReference(value), step.duration?.meters);
};

const resolveTarget = (step: RawStep): RawStep => {
  const target = step.target;
  if (!target?.type || !target.value) return step;
  const value = resolveValue(step, target.type, target.value);
  return value === target.value
    ? step
    : { ...step, target: { ...target, value } };
};

const withStepIndex = (step: RawStep, error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error);
  const where =
    typeof step.stepIndex === "number" ? `step ${step.stepIndex}: ` : "";
  return new Error(`${where}${message}`);
};

const resolveStep = (raw: RawStep): RawStep => {
  try {
    const step = raw.duration
      ? { ...raw, duration: resolveDuration(raw.duration) }
      : raw;
    return resolveTarget(step);
  } catch (error) {
    throw withStepIndex(raw, error);
  }
};

export const resolveCoachLiterals = (raw: unknown): unknown => {
  if (!hasSteps(raw)) return raw;
  const steps = raw.steps.map((s) =>
    hasSteps(s)
      ? resolveRepeatFill({ ...s, steps: s.steps.map(resolveStep) })
      : resolveStep(s)
  );
  return { ...raw, steps };
};
