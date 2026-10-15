import { modelDisplayName } from "@kaiord/ai/providers";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { CustomModelInput } from "../SettingsPanel/CustomModelInput";
import type { EffectiveModel } from "../SettingsPanel/effective-models";
import {
  INHERIT_VALUE,
  type ModelChoice,
  modelChoiceGroups,
} from "../SettingsPanel/model-choice";
import { ModelChoiceOptions } from "../SettingsPanel/ModelChoiceOptions";
import { useModelChoice } from "../SettingsPanel/use-model-choice";

export type ChatModelPickerProps = {
  providers: LlmProviderConfig[];
  /** The provider and model this conversation runs. */
  running: ModelChoice | null;
  /** True when the conversation (or draft) has its own model. */
  chosen: boolean;
  /** The athlete's chat resolution, which the conversation otherwise follows. */
  chatDefault: EffectiveModel;
  onModelChoose: (choice: ModelChoice) => void;
  onModelFollow: () => void;
};

/**
 * Per-conversation model: provider and model in one select, plus "Same as
 * main model", which follows the athlete's chat resolution. Shows what runs.
 */
export function ChatModelPicker(props: ChatModelPickerProps) {
  const { providers, running, chosen, chatDefault } = props;
  const t = useTranslate("chat");
  const choice = useModelChoice({
    effective: { ...chatDefault, running, inherited: !chosen },
    canInherit: true,
    onChoose: props.onModelChoose,
    onInherit: props.onModelFollow,
  });
  if (providers.length === 0) return null;
  const follows = chatDefault.running;
  const name = follows
    ? `${modelDisplayName(follows.modelId)} · ${providers.find((p) => p.id === follows.providerId)?.label ?? ""}`
    : "";
  const followKey = chatDefault.inherited
    ? "model.followMain"
    : "model.followChat";

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
        data-testid="chat-model-select"
        className="w-full rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-ink-strong"
        value={choice.value}
        onChange={(e) => choice.select(e.target.value)}
      >
        <option value={INHERIT_VALUE}>{t(followKey, { model: name })}</option>
        <ModelChoiceOptions groups={modelChoiceGroups(providers, running)} />
      </select>
      {choice.customFor && (
        <CustomModelInput
          onCommit={choice.commitCustom}
          onCancel={choice.cancelCustom}
        />
      )}
    </div>
  );
}
