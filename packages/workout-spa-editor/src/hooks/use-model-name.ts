import {
  isEvaluatedModel,
  type LlmProviderType,
  modelDisplayName,
} from "@kaiord/ai/providers";
import { useCallback } from "react";

import type { ModelChoice } from "../components/organisms/SettingsPanel/model-choice";
import { choiceName } from "../components/organisms/SettingsPanel/model-choice";
import { useTranslate } from "../i18n/use-translate";
import type { LlmProviderConfig } from "../store/ai-store-types";

/** A model's product name, marked "not evaluated" unless it passed the evals. */
export type ModelNamer = (
  type: LlmProviderType | undefined,
  modelId: string
) => string;

export const nameModel = (
  type: LlmProviderType | undefined,
  modelId: string,
  notEvaluated: (model: string) => string
): string => {
  const name = modelDisplayName(modelId);
  return type && isEvaluatedModel(type, modelId) ? name : notEvaluated(name);
};

/** The namer every place that shows or offers a model uses. */
export const useModelName = (): ModelNamer => {
  const t = useTranslate("settings");
  return useCallback(
    (type, modelId) =>
      nameModel(type, modelId, (model) => t("models.notEvaluated", { model })),
    [t]
  );
};

/** "Claude Sonnet 5 · Mi Claude": a choice by its marked name and account. */
export const useChoiceName = () => {
  const name = useModelName();
  return useCallback(
    (choice: ModelChoice, providers: LlmProviderConfig[]) =>
      choiceName(choice, providers, name),
    [name]
  );
};
