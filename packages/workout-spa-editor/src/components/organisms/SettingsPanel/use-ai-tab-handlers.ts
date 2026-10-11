/**
 * Handler bindings for the AI settings tab. Splitting this hook out
 * keeps the use-case + toast wiring testable in isolation and keeps
 * the rendering component under the file/function size budgets.
 *
 * Toasts are translated from fixed keys, never interpolated, so the PII /
 * secret audit (the test-side key allowlist + literal-source pass) can prove
 * no `apiKey` fragment can leak into one.
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
import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { type KeySaveOutcome, saveWithKeyCheck } from "./save-with-key-check";

// Every AI tab error toast, as its `settings` key. Exported for the
// test-side audit, which checks the English and Spanish text of each.
export const AI_TAB_TOAST_KEYS = [
  "aiToast.addFailed",
  "aiToast.removeFailed",
  "aiToast.updateFailed",
  "aiToast.setDefaultFailed",
  "aiToast.promptFailed",
] as const;

export const useAiTabHandlers = () => {
  const persistence = usePersistence();
  const toast = useToastContext();
  const t = useTranslate("settings");

  return {
    onAdd: async (config: AddProviderInput): Promise<KeySaveOutcome> => {
      const outcome = await saveWithKeyCheck({
        credential: config,
        save: () => addProvider(persistence, config),
      });
      if (outcome === "failed") toast.error(t("aiToast.addFailed"));
      return outcome;
    },
    onRemove: (id: string) => {
      void removeProvider(persistence, id).catch(() =>
        toast.error(t("aiToast.removeFailed"))
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
      if (outcome === "failed") toast.error(t("aiToast.updateFailed"));
      return outcome;
    },
    onSetDefault: (id: string) => {
      void setDefaultProvider(persistence, id).catch(() =>
        toast.error(t("aiToast.setDefaultFailed"))
      );
    },
    onPromptChange: (value: string) => {
      void setCustomPrompt(persistence, value).catch(() =>
        toast.error(t("aiToast.promptFailed"))
      );
    },
  };
};
