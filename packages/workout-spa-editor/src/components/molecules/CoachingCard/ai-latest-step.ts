/**
 * The last step the model has FINISHED writing, read from the partial
 * structured output of the workout parser. The step being written is never
 * shown: its fields are still arriving and would flicker or lie. A partial
 * output is untyped JSON, so every field is checked before it is read.
 */
export type AiLatestStep =
  | { kind: "step"; seconds?: number; meters?: number; intensity?: string }
  | { kind: "block"; repeatCount: number; steps: number };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null;

const numberAt = (value: unknown, key: string) =>
  isObject(value) && typeof value[key] === "number" ? value[key] : undefined;

const toLatest = (step: Json): AiLatestStep | undefined => {
  if (Array.isArray(step.steps)) {
    const repeatCount = numberAt(step, "repeatCount");
    if (repeatCount === undefined) return undefined;
    return { kind: "block", repeatCount, steps: step.steps.length };
  }
  const seconds = numberAt(step.duration, "seconds");
  const meters = numberAt(step.duration, "meters");
  if (seconds === undefined && meters === undefined) return undefined;
  const intensity =
    typeof step.intensity === "string" ? step.intensity : undefined;
  return { kind: "step", seconds, meters, intensity };
};

export const latestFinishedStep = (
  partial: unknown
): AiLatestStep | undefined => {
  const steps = isObject(partial) ? partial.steps : undefined;
  if (!Array.isArray(steps) || steps.length < 2) return undefined;
  const finished: unknown = steps[steps.length - 2];
  return isObject(finished) ? toLatest(finished) : undefined;
};
