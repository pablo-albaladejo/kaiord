import type { Intensity, Target, WorkoutStep } from "@kaiord/core";

const INTENSITY_LABELS: Record<Intensity, string> = {
  warmup: "Warm up",
  cooldown: "Cool down",
  recovery: "Recovery",
  rest: "Rest",
  interval: "Interval",
  active: "Active",
  other: "Work",
};

/** Display name for a step: explicit name, else humanized intensity. */
export function stepKind(step: WorkoutStep): string {
  if (step.name) return step.name;
  if (step.intensity) return INTENSITY_LABELS[step.intensity];
  return "Work";
}

/** Concise target description, e.g. "@ 250 W", "@ 85% FTP", "@ Z3", "Easy". */
export function stepDetail(target: Target): string {
  if (target.type === "power") return powerDetail(target.value);
  if (target.type === "heart_rate") return hrDetail(target.value);
  if (target.type === "pace") return paceDetail(target.value);
  if (target.type === "cadence") return cadenceDetail(target.value);
  if (target.type === "stroke_type") return "Stroke";
  return "Easy";
}

function powerDetail(v: (Target & { type: "power" })["value"]): string {
  if (v.unit === "watts") return `@ ${v.value} W`;
  if (v.unit === "percent_ftp") return `@ ${v.value}% FTP`;
  if (v.unit === "zone") return `@ Z${v.value}`;
  return `@ ${v.min}–${v.max} W`;
}

function hrDetail(v: (Target & { type: "heart_rate" })["value"]): string {
  if (v.unit === "bpm") return `@ ${v.value} bpm`;
  if (v.unit === "zone") return `@ Z${v.value}`;
  if (v.unit === "percent_max") return `@ ${v.value}% max`;
  return `@ ${v.min}–${v.max} bpm`;
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
