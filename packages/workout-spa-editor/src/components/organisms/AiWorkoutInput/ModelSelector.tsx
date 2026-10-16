/**
 * The model workout generation runs, chosen in place. It is the athlete's
 * `workout_generation` binding (or the main model it follows), the same
 * resolution `useAiGeneration` runs, and a choice here is stored as that
 * binding, exactly as the AI settings row does.
 */
import { useTranslate } from "../../../i18n/use-translate";
import type { AiModelPurpose } from "../../../types/ai-model-binding";
import { ModelChoiceSelect } from "../SettingsPanel/ModelChoiceSelect";
import { useAiModelsHandlers } from "../SettingsPanel/use-ai-models-handlers";
import { useEffectiveModels } from "../SettingsPanel/use-effective-models";

const PURPOSES: readonly AiModelPurpose[] = ["default", "workout_generation"];

export const ModelSelector: React.FC = () => {
  const t = useTranslate("create-workout");
  const { profileId, providers, models } = useEffectiveModels(PURPOSES);
  const { onSetBinding, onClearBinding } = useAiModelsHandlers();

  if (!profileId || providers.length === 0) return null;

  return (
    <ModelChoiceSelect
      id="ai-model"
      label={t("model.label")}
      providers={providers}
      effective={models.workout_generation!}
      principal={models.default!.running}
      onChoose={(choice) =>
        onSetBinding({ profileId, purpose: "workout_generation", ...choice })
      }
      onInherit={() => onClearBinding(profileId, "workout_generation")}
    />
  );
};
