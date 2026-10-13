import { useState } from "react";

import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import {
  weightFromDisplay,
  weightToDisplay,
} from "../../../lib/units/body-measures";
import { weightUnitLabel } from "../../../lib/units/units";
import { Input } from "../../atoms/Input/Input";

type CurrentWeightFieldProps = {
  /** The athlete's current weight (kg): latest weigh-in, else bodyWeight. */
  currentKg: number | undefined;
  /** Records the committed value (kg) as today's weigh-in. */
  onSave: (kg: number) => void;
};

/**
 * Shows the current weight and records an edit as today's weigh-in. The typed
 * text is kept until the live value reflects it, so the field does not flash
 * back to the old weight while the weigh-in is being written.
 */
export function CurrentWeightField({
  currentKg,
  onSave,
}: CurrentWeightFieldProps) {
  const t = useTranslate("athlete");
  const units = useUnits();
  const shown = weightToDisplay(currentKg, units)?.toString() ?? "";
  const [raw, setRaw] = useState<string | null>(null);
  const [prevShown, setPrevShown] = useState(shown);
  const [committed, setCommitted] = useState<string | null>(null);

  // A new live value replaces the text only once our own save has landed (or
  // nothing was typed); an edit still in progress is the user's and stays.
  if (shown !== prevShown) {
    setPrevShown(shown);
    if (raw === committed) {
      setRaw(null);
      setCommitted(null);
    }
  }

  // Enter and the blur that follows must not record the same value twice.
  const commit = () => {
    if (raw === null || raw === "" || raw === shown) return;
    if (raw === committed) return;
    const kg = weightFromDisplay(Number(raw), units);
    if (kg === undefined) return;
    setCommitted(raw);
    onSave(kg);
  };

  return (
    <Input
      label={t("body.currentWeight", { unit: weightUnitLabel(units) })}
      helperText={t("body.currentWeightHint")}
      variant="number"
      value={raw ?? shown}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      placeholder="70"
    />
  );
}
