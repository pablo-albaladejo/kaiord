import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useTranslate } from "../../../i18n/use-translate";
import type { AiModelPurpose } from "../../../types/ai-model-binding";
import { ModelRow } from "./ModelRow";
import { useAiModelsHandlers } from "./use-ai-models-handlers";

const PURPOSE_ROWS: ReadonlyArray<{
  purpose: AiModelPurpose;
  labelKey: string;
  resettable: boolean;
}> = [
  { purpose: "default", labelKey: "models.default", resettable: false },
  { purpose: "chat", labelKey: "models.chat", resettable: true },
  {
    purpose: "workout_generation",
    labelKey: "models.workoutGeneration",
    resettable: true,
  },
  {
    purpose: "lab_extraction",
    labelKey: "models.labExtraction",
    resettable: true,
  },
];

export const ModelsSection: React.FC = () => {
  const t = useTranslate("settings");
  const profileId = useActiveProfileLive()?.id ?? null;
  const providers = useAiProvidersLive() ?? [];
  const bindings = useAiModelBindingsLive(profileId);
  const { onSetBinding, onClearBinding } = useAiModelsHandlers();

  if (!profileId || providers.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("models.hint")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {PURPOSE_ROWS.map(({ purpose, labelKey, resettable }) => {
        const binding = bindings?.find((b) => b.purpose === purpose);
        const providerId = binding?.providerId ?? providers[0]!.id;
        const modelId = binding?.modelId ?? "";
        const set = (next: { providerId: string; modelId: string }) =>
          onSetBinding({ profileId, purpose, ...next });
        return (
          <ModelRow
            key={purpose}
            rowLabel={t(labelKey)}
            providers={providers}
            providerId={providerId}
            modelId={modelId}
            onProviderChange={(id) => set({ providerId: id, modelId })}
            onModelChange={(id) => set({ providerId, modelId: id })}
            onReset={
              resettable ? () => onClearBinding(profileId, purpose) : undefined
            }
          />
        );
      })}
    </div>
  );
};
