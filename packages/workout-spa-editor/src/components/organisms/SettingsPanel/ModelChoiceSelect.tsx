import { modelDisplayName } from "@kaiord/ai/providers";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { ModelStatusNotice } from "../../molecules/ModelStatusNotice";
import { CustomModelInput } from "./CustomModelInput";
import type { EffectiveModel } from "./effective-models";
import {
  INHERIT_VALUE,
  type ModelChoice,
  modelChoiceGroups,
} from "./model-choice";
import { ModelChoiceOptions } from "./ModelChoiceOptions";
import { useModelChoice } from "./use-model-choice";

export type ModelChoiceSelectProps = {
  id: string;
  label: string;
  providers: LlmProviderConfig[];
  effective: EffectiveModel;
  /** Offers "Same as main model", naming what the main model runs. */
  principal?: ModelChoice | null;
  onChoose: (choice: ModelChoice) => void;
  onInherit?: () => void;
};

/** Provider and model in ONE select, showing what actually runs. */
export function ModelChoiceSelect(props: ModelChoiceSelectProps) {
  const { id, label, providers, effective, principal } = props;
  const t = useTranslate("settings");
  const canInherit = props.onInherit !== undefined && principal !== undefined;
  const choice = useModelChoice({ ...props, canInherit });
  const { running } = effective;
  const labelOf = (c: ModelChoice) =>
    providers.find((p) => p.id === c.providerId)?.label ?? "";
  const type = providers.find((p) => p.id === running?.providerId)?.type;
  const follows = canInherit && effective.inherited;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-ink-body"
      >
        {label}
      </label>
      <select
        id={id}
        data-testid={`${id}-select`}
        className="w-full rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-ink-strong"
        value={choice.value}
        onChange={(e) => choice.select(e.target.value)}
      >
        {canInherit && principal && (
          <option value={INHERIT_VALUE}>
            {t("models.inherit", {
              model: `${modelDisplayName(principal.modelId)} · ${labelOf(principal)}`,
            })}
          </option>
        )}
        <ModelChoiceOptions groups={modelChoiceGroups(providers, running)} />
      </select>
      {choice.customFor && (
        <CustomModelInput
          onCommit={choice.commitCustom}
          onCancel={choice.cancelCustom}
        />
      )}
      {type && !follows && (
        <ModelStatusNotice
          type={type}
          modelId={effective.storedModelId ?? running?.modelId ?? null}
          testIdPrefix={id}
        />
      )}
    </div>
  );
}
