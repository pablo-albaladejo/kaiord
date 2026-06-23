import type { MacroNutrients } from "@kaiord/core";

import { toMacroRings } from "./macro-rings-view-model";
import { MacroRing } from "./MacroRing";

export type MacroRingsProps = {
  actuals: MacroNutrients | undefined;
  targets: MacroNutrients | undefined;
  size?: number;
};

/**
 * The four macro rings (energy, protein, carbs, fat) for a day's actuals vs
 * targets. Used full-size on the Nutrition page and compact on the Today
 * EnergyBalanceCard.
 */
export function MacroRings({ actuals, targets, size }: MacroRingsProps) {
  const rings = toMacroRings(actuals, targets);
  return (
    <div className="flex justify-between gap-2" data-testid="macro-rings">
      {rings.map((ring) => (
        <MacroRing key={ring.key} ring={ring} size={size} />
      ))}
    </div>
  );
}
