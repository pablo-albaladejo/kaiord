import { useState } from "react";

import type { EffectiveModel } from "./effective-models";
import {
  decodeChoice,
  encodeChoice,
  encodeCustom,
  INHERIT_VALUE,
  type ModelChoice,
} from "./model-choice";

type UseModelChoiceArgs = {
  effective: EffectiveModel;
  canInherit: boolean;
  onChoose: (choice: ModelChoice) => void;
  onInherit?: () => void;
};

/** The select's value (what runs, or "follows the main model") and its handler. */
export const useModelChoice = ({
  effective,
  canInherit,
  onChoose,
  onInherit,
}: UseModelChoiceArgs) => {
  const [customFor, setCustomFor] = useState<string | null>(null);
  const { running, inherited } = effective;
  let value = running ? encodeChoice(running) : "";
  if (canInherit && inherited) value = INHERIT_VALUE;
  if (customFor) value = encodeCustom(customFor);

  const select = (next: string) => {
    if (next === INHERIT_VALUE) return onInherit?.();
    const decoded = decodeChoice(next);
    if (decoded && "customFor" in decoded) {
      return setCustomFor(decoded.customFor);
    }
    setCustomFor(null);
    if (decoded) onChoose(decoded.choice);
  };
  const commitCustom = (modelId: string) => {
    if (customFor) onChoose({ providerId: customFor, modelId });
    setCustomFor(null);
  };
  const cancelCustom = () => setCustomFor(null);

  return { value, customFor, select, commitCustom, cancelCustom };
};
