import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";

export type ChatModelPickerProps = {
  providers: LlmProviderConfig[];
  value: string | null;
  onChange: (providerId: string) => void;
};

/** Per-conversation model selector. Persists to the active conversation (or
 * the draft's pending selection) via the caller's `onChange`. */
export function ChatModelPicker({
  providers,
  value,
  onChange,
}: ChatModelPickerProps) {
  const t = useTranslate("chat");
  if (providers.length === 0) return null;
  const current =
    value ?? providers.find((p) => p.isDefault)?.id ?? providers[0]!.id;
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
        onChange={(e) => onChange(e.target.value)}
      >
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} ({p.model})
          </option>
        ))}
      </select>
    </div>
  );
}
