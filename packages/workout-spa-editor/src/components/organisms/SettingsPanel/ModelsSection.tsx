import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import type { AiModelPurpose } from "../../../types/ai-model-binding";
import { ModelRow } from "./ModelRow";
import { useAiModelsHandlers } from "./use-ai-models-handlers";

const PURPOSE_ROWS: ReadonlyArray<{
  purpose: AiModelPurpose;
  label: string;
  resettable: boolean;
}> = [
  { purpose: "default", label: "Default model", resettable: false },
  { purpose: "chat", label: "Chat", resettable: true },
  {
    purpose: "workout_generation",
    label: "Workout generation",
    resettable: true,
  },
  { purpose: "lab_extraction", label: "Lab extraction", resettable: true },
];

const HINT =
  "Add at least one provider and select an active profile to choose models.";

export const ModelsSection: React.FC = () => {
  const profileId = useActiveProfileLive()?.id ?? null;
  const providers = useAiProvidersLive() ?? [];
  const bindings = useAiModelBindingsLive(profileId);
  const { onSetBinding, onClearBinding } = useAiModelsHandlers();

  if (!profileId || providers.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{HINT}</p>;
  }

  return (
    <div className="space-y-3">
      {PURPOSE_ROWS.map(({ purpose, label, resettable }) => {
        const binding = bindings?.find((b) => b.purpose === purpose);
        const providerId = binding?.providerId ?? providers[0]!.id;
        const modelId = binding?.modelId ?? "";
        const set = (next: { providerId: string; modelId: string }) =>
          onSetBinding({ profileId, purpose, ...next });
        return (
          <ModelRow
            key={purpose}
            rowLabel={label}
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
