import type { Translate } from "../../i18n/use-translate";
import { type PaceBase, paceUnitLabelFor, type Units } from "../units/units";
import type { ThresholdFieldSpec } from "./threshold-field-specs";

export type ThresholdLabelContext = {
  /** Swimming's threshold pace is its CSS pace. */
  swimming: boolean;
  base: PaceBase;
  units: Units;
  /** The heart-rate unit in the active locale (`common` units.hr). */
  hrUnit: string;
  /** The athlete namespace. */
  t: Translate;
};

/** A threshold field's name with its unit, e.g. "LTHR (bpm)". */
export function thresholdFieldLabel(
  spec: ThresholdFieldSpec,
  ctx: ThresholdLabelContext
): string {
  const { t } = ctx;
  if (spec.id === "ftp") return t("thresholds.ftp");
  if (spec.id === "thresholdPace") {
    const unit = `min${paceUnitLabelFor(ctx.base, ctx.units)}`;
    return t(`thresholds.${ctx.swimming ? "cssPace" : "pace"}`, { unit });
  }
  return t(`thresholds.${spec.id}`, { unit: ctx.hrUnit });
}
