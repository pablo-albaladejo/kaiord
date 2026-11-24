import { useCallback } from "react";

import { useModelName } from "../../../hooks/use-model-name";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { choiceName, type ModelChoice } from "./model-choice";

/** "Claude Sonnet 5 · Mi Claude": a choice by its marked name and account. */
export const useChoiceName = () => {
  const name = useModelName();
  return useCallback(
    (choice: ModelChoice, providers: LlmProviderConfig[]) =>
      choiceName(choice, providers, name),
    [name]
  );
};
