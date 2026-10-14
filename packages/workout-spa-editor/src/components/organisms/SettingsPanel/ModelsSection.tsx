import { useTranslate } from "../../../i18n/use-translate";
import type { AiModelPurpose } from "../../../types/ai-model-binding";
import { ModelChoiceSelect } from "./ModelChoiceSelect";
import { useAiModelsHandlers } from "./use-ai-models-handlers";
import { useEffectiveModels } from "./use-effective-models";

const PURPOSE_ROWS: ReadonlyArray<{
  purpose: AiModelPurpose;
  labelKey: string;
}> = [
  { purpose: "default", labelKey: "models.default" },
  { purpose: "chat", labelKey: "models.chat" },
  { purpose: "workout_generation", labelKey: "models.workoutGeneration" },
  { purpose: "lab_extraction", labelKey: "models.labExtraction" },
];

const PURPOSES = PURPOSE_ROWS.map((r) => r.purpose);

export const ModelsSection: React.FC = () => {
  const t = useTranslate("settings");
  const { profileId, providers, models } = useEffectiveModels(PURPOSES);
  const { onSetBinding, onClearBinding } = useAiModelsHandlers();

  if (!profileId || providers.length === 0) {
    return <p className="text-sm text-ink-muted">{t("models.hint")}</p>;
  }
  const principal = models.default!.running;

  return (
    <div className="space-y-3">
      {PURPOSE_ROWS.map(({ purpose, labelKey }) => {
        const isPrincipal = purpose === "default";
        return (
          <div key={purpose} className="rounded-lg border border-edge p-3">
            <ModelChoiceSelect
              id={`model-${purpose}`}
              label={t(labelKey)}
              providers={providers}
              effective={models[purpose]!}
              principal={isPrincipal ? undefined : principal}
              onChoose={(choice) =>
                onSetBinding({ profileId, purpose, ...choice })
              }
              onInherit={
                isPrincipal
                  ? undefined
                  : () => onClearBinding(profileId, purpose)
              }
            />
          </div>
        );
      })}
    </div>
  );
};
