/**
 * Pure view-model mapping a day's `macro_actuals` against its `macro_targets`
 * into the four progress rings the nutrition surfaces render (energy, protein,
 * carbs, fat). No React; unit-tested in isolation.
 *
 * `target` is null when no goal-derived target exists, so the ring shows the
 * actual figure without a progress fraction. `fraction` is clamped to [0, 1]
 * for the arc geometry while `over` flags an exceeded target for the caller.
 */

import type { MacroNutrients } from "@kaiord/core";

import { getTranslate, type Translate } from "../../../i18n/use-translate";

export type MacroRingKey = "energy" | "protein" | "carb" | "fat";

export type MacroRing = {
  key: MacroRingKey;
  label: string;
  unit: "kcal" | "g";
  actual: number;
  target: number | null;
  /** Progress clamped to [0, 1] for the arc; null when no target. */
  fraction: number | null;
  over: boolean;
};

type RingSpec = {
  key: MacroRingKey;
  labelKey: string;
  field: keyof MacroNutrients;
};

const RING_SPECS: readonly RingSpec[] = [
  { key: "energy", labelKey: "macros.energy", field: "kcal" },
  { key: "protein", labelKey: "macros.protein", field: "protein_g" },
  { key: "carb", labelKey: "macros.carbs", field: "carb_g" },
  { key: "fat", labelKey: "macros.fat", field: "fat_g" },
] as const;

const ringUnit = (key: MacroRingKey): MacroRing["unit"] =>
  key === "energy" ? "kcal" : "g";

const buildRing = (
  spec: RingSpec,
  actuals: MacroNutrients,
  targets: MacroNutrients | null,
  t: Translate
): MacroRing => {
  const actual = actuals[spec.field];
  const target = targets ? targets[spec.field] : null;
  const fraction = target && target > 0 ? Math.min(actual / target, 1) : null;
  return {
    key: spec.key,
    label: t(spec.labelKey),
    unit: ringUnit(spec.key),
    actual,
    target,
    fraction,
    over: target !== null && target > 0 && actual > target,
  };
};

const EMPTY: MacroNutrients = { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 };

export const toMacroRings = (
  actuals: MacroNutrients | undefined,
  targets: MacroNutrients | undefined,
  t: Translate = getTranslate("nutrition")
): MacroRing[] =>
  RING_SPECS.map((spec) =>
    buildRing(spec, actuals ?? EMPTY, targets ?? null, t)
  );
