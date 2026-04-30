/**
 * Handler bindings for the AI settings tab. Splitting this hook out
 * keeps the use-case + toast wiring testable in isolation and keeps
 * the rendering component under the file/function size budgets.
 *
 * Toast strings are static literals so the PII / secret audit (the
 * test-side allowlist + literal-source pass) can prove no `apiKey`
 * fragment can leak via interpolation.
 */

import {
  addProvider,
  type AddProviderInput,
} from "../../../application/ai/add-provider";
import { removeProvider } from "../../../application/ai/remove-provider";
import { setCustomPrompt } from "../../../application/ai/set-custom-prompt";
import { setDefaultProvider } from "../../../application/ai/set-default-provider";
import {
  updateProvider,
  type UpdateProviderInput,
} from "../../../application/ai/update-provider";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";

const ADD_TOAST = "Failed to add AI provider — please retry.";
const REMOVE_TOAST = "Failed to remove AI provider — please retry.";
const UPDATE_TOAST = "Failed to update AI provider — please retry.";
const SET_DEFAULT_TOAST = "Failed to set default provider — please retry.";
const PROMPT_TOAST = "Failed to save custom prompt — please retry.";

// Exported for the test-side audit (axis 1: allowlist match) — every
// AI tab error toast must be a member of this set.
export const AI_TAB_TOAST_MESSAGES: ReadonlyArray<string> = [
  ADD_TOAST,
  REMOVE_TOAST,
  UPDATE_TOAST,
  SET_DEFAULT_TOAST,
  PROMPT_TOAST,
];

export const useAiTabHandlers = () => {
  const persistence = usePersistence();
  const toast = useToastContext();

  return {
    onAdd: (config: AddProviderInput) => {
      void addProvider(persistence, config).catch(() => toast.error(ADD_TOAST));
    },
    onRemove: (id: string) => {
      void removeProvider(persistence, id).catch(() =>
        toast.error(REMOVE_TOAST)
      );
    },
    onUpdate: (id: string, updates: UpdateProviderInput) => {
      void updateProvider(persistence, id, updates).catch(() =>
        toast.error(UPDATE_TOAST)
      );
    },
    onSetDefault: (id: string) => {
      void setDefaultProvider(persistence, id).catch(() =>
        toast.error(SET_DEFAULT_TOAST)
      );
    },
    onPromptChange: (value: string) => {
      void setCustomPrompt(persistence, value).catch(() =>
        toast.error(PROMPT_TOAST)
      );
    },
  };
};
