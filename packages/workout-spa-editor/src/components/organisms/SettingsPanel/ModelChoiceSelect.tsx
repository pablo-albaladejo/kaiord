import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { ModelStatusNotice } from "../../molecules/ModelStatusNotice";
import { CustomModelInput } from "./CustomModelInput";
import type { EffectiveModel } from "./effective-models";
import {
  choiceName,
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
  /** Offers "Same as main model"; while followed, what it runs is named below. */
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
  const type = providers.find((p) => p.id === running?.providerId)?.type;
  const follows = canInherit && effective.inherited;
  const followsId = `${id}-follows`;
  // What a followed main model runs, named under the select.
  const followed =
    follows && principal ? choiceName(principal, providers) : null;

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
        aria-describedby={followed ? followsId : undefined}
        onChange={(e) => choice.select(e.target.value)}
      >
        {canInherit && principal && (
          <option value={INHERIT_VALUE}>{t("models.inherit")}</option>
        )}
        <ModelChoiceOptions groups={modelChoiceGroups(providers, running)} />
      </select>
      {followed && (
        <p
          id={followsId}
          data-testid={followsId}
          className="mt-1 text-xs text-ink-muted"
        >
          {t("models.inheritRuns", { model: followed })}
        </p>
      )}
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
