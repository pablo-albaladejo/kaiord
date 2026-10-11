import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";

export type ChatModelPickerProps = {
  providers: LlmProviderConfig[];
  /** The provider the conversation runs on, or null for the default. */
  provider: LlmProviderConfig | null;
  /** The model the selected provider will run, shown beside its label. */
  modelId: string | null;
  onModelChange: (providerId: string) => void;
};

/** Per-conversation model selector. Persists to the active conversation (or
 * the draft's pending selection) via the caller's `onChange`. */
export function ChatModelPicker({
  providers,
  provider,
  modelId,
  onModelChange,
}: ChatModelPickerProps) {
  const t = useTranslate("chat");
  if (providers.length === 0) return null;
  const current =
    provider?.id ?? providers.find((p) => p.isDefault)?.id ?? providers[0]!.id;
  return (
    <div className="w-full">
      <label
        htmlFor="chat-model-select"
        className="mb-1 block text-xs font-medium text-ink-muted"
      >
        {t("model.label")}
      </label>
      <select
        id="chat-model-select"
        className="w-full rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-ink-strong"
        value={current}
        onChange={(e) => onModelChange(e.target.value)}
      >
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id === current && modelId ? `${p.label} (${modelId})` : p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
