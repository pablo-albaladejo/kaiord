/**
 * Handler bindings for the per-profile model section of the AI settings tab.
 * Splitting this hook out keeps the use-case + toast wiring testable in
 * isolation and keeps the rendering component under the size budgets.
 *
 * Toasts are translated from fixed keys, never interpolated, so the PII /
 * secret audit can prove no `apiKey` fragment can leak into one.
 */

import { clearModelBinding } from "../../../application/ai/clear-model-binding";
import type { SetModelBindingInput } from "../../../application/ai/set-model-binding";
import { setModelBinding } from "../../../application/ai/set-model-binding";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { AiModelPurpose } from "../../../types/ai-model-binding";

// Every error toast of the model section, as its `settings` key. Exported
// for the test-side audit, which checks the English and Spanish text of each.
export const AI_MODELS_TOAST_KEYS = [
  "models.setFailed",
  "models.resetFailed",
] as const;

export const useAiModelsHandlers = () => {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("settings");

  return {
    onSetBinding: (input: SetModelBindingInput) => {
      void setModelBinding(persistence, input).catch(() =>
        toast.error(t("models.setFailed"))
      );
    },
    onClearBinding: (profileId: string, purpose: AiModelPurpose) => {
      void clearModelBinding(persistence, profileId, purpose).catch(() =>
        toast.error(t("models.resetFailed"))
      );
    },
  };
};
