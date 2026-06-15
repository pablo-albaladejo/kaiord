/**
 * Handler bindings for the per-profile model section of the AI settings tab.
 * Splitting this hook out keeps the use-case + toast wiring testable in
 * isolation and keeps the rendering component under the size budgets.
 *
 * Toast strings are static literals so the PII / secret audit can prove no
 * `apiKey` fragment can leak via interpolation.
 */

import { clearModelBinding } from "../../../application/ai/clear-model-binding";
import type { SetModelBindingInput } from "../../../application/ai/set-model-binding";
import { setModelBinding } from "../../../application/ai/set-model-binding";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import type { AiModelPurpose } from "../../../types/ai-model-binding";

const SET_BINDING_TOAST = "Failed to set the model — please retry.";
const CLEAR_BINDING_TOAST = "Failed to reset the model — please retry.";

export const AI_MODELS_TOAST_MESSAGES: ReadonlyArray<string> = [
  SET_BINDING_TOAST,
  CLEAR_BINDING_TOAST,
];

export const useAiModelsHandlers = () => {
  const persistence = usePersistence();
  const toast = useToastContext();

  return {
    onSetBinding: (input: SetModelBindingInput) => {
      void setModelBinding(persistence, input).catch(() =>
        toast.error(SET_BINDING_TOAST)
      );
    },
    onClearBinding: (profileId: string, purpose: AiModelPurpose) => {
      void clearModelBinding(persistence, profileId, purpose).catch(() =>
        toast.error(CLEAR_BINDING_TOAST)
      );
    },
  };
};
