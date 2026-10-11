/**
 * Handler bindings for the AI settings tab. Splitting this hook out
 * keeps the use-case + toast wiring testable in isolation and keeps
 * the rendering component under the file/function size budgets.
 *
 * Toast strings are static literals so the PII / secret audit (the
 * test-side allowlist + literal-source pass) can prove no `apiKey`
 * fragment can leak via interpolation.
 */

import type { AddProviderInput } from "../../../application/ai/add-provider";
import { addProvider } from "../../../application/ai/add-provider";
import { removeProvider } from "../../../application/ai/remove-provider";
import { setCustomPrompt } from "../../../application/ai/set-custom-prompt";
import { setDefaultProvider } from "../../../application/ai/set-default-provider";
import type { UpdateProviderInput } from "../../../application/ai/update-provider";
import { updateProvider } from "../../../application/ai/update-provider";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { type KeySaveOutcome, saveWithKeyCheck } from "./save-with-key-check";

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
    onAdd: async (config: AddProviderInput): Promise<KeySaveOutcome> => {
      const outcome = await saveWithKeyCheck({
        credential: config,
        save: () => addProvider(persistence, config),
      });
      if (outcome === "failed") toast.error(ADD_TOAST);
      return outcome;
    },
    onRemove: (id: string) => {
      void removeProvider(persistence, id).catch(() =>
        toast.error(REMOVE_TOAST)
      );
    },
    onUpdate: async (
      provider: LlmProviderConfig,
      updates: UpdateProviderInput
    ): Promise<KeySaveOutcome> => {
      const key = updates.apiKey;
      const outcome = await saveWithKeyCheck({
        credential:
          key !== undefined && key !== provider.apiKey
            ? { type: provider.type, apiKey: key }
            : undefined,
        save: () => updateProvider(persistence, provider.id, updates),
      });
      if (outcome === "failed") toast.error(UPDATE_TOAST);
      return outcome;
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
