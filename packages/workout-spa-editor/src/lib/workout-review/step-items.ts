import type { Workout, WorkoutStep } from "@kaiord/core";

import { isRepetitionBlock } from "../../types/krd-guards";
import type { SportThresholds } from "../../types/sport-zones";
import { calculateStepDuration } from "../../utils/workout-stats-duration";
import type { ZoneNumber } from "../zone-colors";
import { classifyTargetZone } from "./classify-zone";
import { formatClock } from "./format-duration";
import { type ReviewCopy, reviewCopyFor } from "./review-copy";
import { stepDetail, stepKind } from "./step-detail";

export type ReviewStepItem = {
  kind: string;
  detail: string;
  zone: ZoneNumber;
  dur: string;
};

const FALLBACK_ZONE: ZoneNumber = 1;
const NO_DURATION = "—";

const stepDuration = (step: WorkoutStep): string => {
  const seconds = calculateStepDuration(step.duration);
  return seconds === null ? NO_DURATION : formatClock(seconds);
};

const stepZone = (step: WorkoutStep, thresholds: SportThresholds): ZoneNumber =>
  classifyTargetZone(step.target, thresholds) ?? FALLBACK_ZONE;

function stepRow(
  step: WorkoutStep,
  thresholds: SportThresholds,
  copy: ReviewCopy
): ReviewStepItem {
  return {
    kind: stepKind(step, copy),
    detail: stepDetail(step.target, copy),
    zone: stepZone(step, thresholds),
    dur: stepDuration(step),
  };
}

function blockRow(
  inner: WorkoutStep[],
  repeatCount: number,
  thresholds: SportThresholds,
  copy: ReviewCopy
): ReviewStepItem {
  const lead = inner[0];
  const blockSeconds = inner.reduce((sum, step) => {
    const seconds = calculateStepDuration(step.duration);
    return sum + (seconds ?? 0) * repeatCount;
  }, 0);
  return {
    kind: lead ? stepKind(lead, copy) : copy.t("kind.interval"),
    detail: lead
      ? `${repeatCount} × ${stepDetail(lead.target, copy)}`
      : copy.t("kind.interval"),
    zone: lead ? stepZone(lead, thresholds) : FALLBACK_ZONE,
    dur: blockSeconds > 0 ? formatClock(blockSeconds) : NO_DURATION,
  };
}

/** One review row per top-level item; repetition blocks collapse to one row. */
export function toStepItems(
  workout: Workout,
  thresholds: SportThresholds,
  copy: ReviewCopy = reviewCopyFor()
): ReviewStepItem[] {
  return workout.steps.map((item) =>
    isRepetitionBlock(item)
      ? blockRow(item.steps, item.repeatCount, thresholds, copy)
      : stepRow(item, thresholds, copy)
  );
}
