import type { Target, WorkoutStep } from "@kaiord/core";

import { type ReviewCopy, reviewCopyFor } from "./review-copy";

/** Display name for a step: explicit name, else humanized intensity. */
export function stepKind(
  step: WorkoutStep,
  { t }: ReviewCopy = reviewCopyFor()
): string {
  if (step.name) return step.name;
  return t(`kind.${step.intensity ?? "other"}`);
}

/** Concise target description, e.g. "@ 250 W", "@ 85% FTP", "@ Z3", "Easy". */
export function stepDetail(
  target: Target,
  copy: ReviewCopy = reviewCopyFor()
): string {
  if (target.type === "power") return powerDetail(target.value);
  if (target.type === "heart_rate") return hrDetail(target.value, copy);
  if (target.type === "pace") return paceDetail(target.value);
  if (target.type === "cadence") return cadenceDetail(target.value);
  if (target.type === "stroke_type") return copy.t("target.stroke");
  return copy.t("target.easy");
}

function powerDetail(v: (Target & { type: "power" })["value"]): string {
  if (v.unit === "watts") return `@ ${v.value} W`;
  if (v.unit === "percent_ftp") return `@ ${v.value}% FTP`;
  if (v.unit === "zone") return `@ Z${v.value}`;
  if (v.basis === "percent_ftp") return `@ ${v.min}–${v.max}% FTP`;
  return `@ ${v.min}–${v.max} W`;
}

function hrDetail(
  v: (Target & { type: "heart_rate" })["value"],
  { t, hrUnit }: ReviewCopy
): string {
  if (v.unit === "bpm") return `@ ${v.value} ${hrUnit}`;
  if (v.unit === "zone") return `@ Z${v.value}`;
  if (v.unit === "percent_max")
    return t("target.percentMax", { value: v.value });
  return `@ ${v.min}–${v.max} ${hrUnit}`;
}

function paceDetail(v: (Target & { type: "pace" })["value"]): string {
  if (v.unit === "mps") return `@ ${v.value} m/s`;
  if (v.unit === "zone") return `@ Z${v.value}`;
  return `@ ${v.min}–${v.max} m/s`;
}

function cadenceDetail(v: (Target & { type: "cadence" })["value"]): string {
  if (v.unit === "rpm") return `@ ${v.value} rpm`;
  return `@ ${v.min}–${v.max} rpm`;
}
