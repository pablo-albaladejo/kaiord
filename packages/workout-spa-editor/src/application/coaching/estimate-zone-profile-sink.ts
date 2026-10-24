import { hide } from "./estimate-zone-profile-hide";
import type { ParsedPart } from "./estimate-zone-profile-parts";
import type {
  EstimatedZone,
  RepeatStep,
  Step,
  TimedStep,
} from "./estimate-zone-profile-types";

export type Sink = {
  steps: Array<Step>;
  open: RepeatStep | undefined;
  rest: Array<Step> | undefined;
};

const WARM_COOL =
  /\b(?:warm[- ]?up|cool[- ]?down|calentamiento|vuelta a la calma|enfriamiento)\b/;
const BETWEEN = /\b(?:between|entre)\b/;
const RECOVERY =
  /\b(?:trote|suaves?|recuperacion|rec|recovery|easy|jog\w*|rest|descansos?)\b/;

export const createSink = (inGroup: boolean): Sink => ({
  steps: [],
  open: undefined,
  rest: inGroup ? [] : undefined,
});

const workOf = (repeat: RepeatStep): TimedStep | undefined => {
  const work = repeat.body[0];
  return work?.kind === "timed" ? work : undefined;
};

const isLower = (zone: EstimatedZone | null, than: EstimatedZone | null) =>
  zone !== null && than !== null && zone < than;

// The step after an unbracketed repeat ("3x10' Z4 + 2' Z1") is its recovery
// when it is shorter than the work. An equal step is recovery only when it
// is marked: paired by "/", "between"/"entre", a recovery word, or a zone
// strictly lower than the work's ("3x10' z4 + 10' z2" alternates); an
// unmarked equal step is ambiguous. A "/" pair whose only zone follows the
// second duration ("10x1'/1' z5") may name either half. A warm-up or
// cool-down is never recovery.
const isRecovery = (
  open: RepeatStep,
  step: TimedStep,
  part: string,
  paired: boolean
): boolean => {
  const work = workOf(open);
  if (work === undefined || WARM_COOL.test(part)) return false;
  if (paired && work.zone === null && step.zone !== null) hide();
  if (step.seconds !== work.seconds) return step.seconds < work.seconds;
  const marked =
    paired ||
    BETWEEN.test(part) ||
    RECOVERY.test(part) ||
    isLower(step.zone, work.zone);
  return marked || hide();
};

export const addStep = (
  sink: Sink,
  parsed: ParsedPart,
  part: string,
  paired: boolean
): void => {
  const { step, opensRepeat } = parsed;
  const open = sink.open;
  sink.open = undefined;
  if (open && step.kind === "timed" && isRecovery(open, step, part, paired)) {
    (BETWEEN.test(part) ? open.between : open.body).push(step);
    return;
  }
  sink.steps.push(step);
  if (opensRepeat && step.kind === "repeat") sink.open = step;
};

// Set rest inside a group belongs to that group's repeat; at the top level
// it goes between the reps of the repeat it follows.
export const addSetRest = (sink: Sink, rest: Step): void => {
  sink.open = undefined;
  const last = sink.steps.at(-1);
  if (sink.rest) sink.rest.push(rest);
  else if (last?.kind === "repeat") last.between.push(rest);
  else sink.steps.push(rest);
};
