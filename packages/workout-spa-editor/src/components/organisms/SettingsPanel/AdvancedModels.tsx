import { useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import type { AiModelPurpose } from "../../../types/ai-model-binding";
import { ModelChoiceSelect } from "./ModelChoiceSelect";
import { useAiModelsHandlers } from "./use-ai-models-handlers";
import { useEffectiveModels } from "./use-effective-models";

const TASKS: ReadonlyArray<{ purpose: AiModelPurpose; labelKey: string }> = [
  { purpose: "chat", labelKey: "models.chat" },
  { purpose: "workout_generation", labelKey: "models.workoutGeneration" },
  { purpose: "lab_extraction", labelKey: "models.labExtraction" },
];

const PURPOSES = ["default", ...TASKS.map((r) => r.purpose)];

/**
 * A model per task, for the athlete. Collapsed while every task follows the
 * main model; open as soon as one has its own, so an override is never hidden.
 */
export function AdvancedModels() {
  const t = useTranslate("settings");
  const athlete = useActiveProfileLive()?.profile?.name ?? "";
  const { profileId, providers, models } = useEffectiveModels(PURPOSES);
  const { onSetBinding, onClearBinding } = useAiModelsHandlers();
  const overridden = TASKS.some(({ purpose }) => !models[purpose]!.inherited);
  // Opening follows the first override; clearing one never folds the
  // section away under the athlete's pointer.
  const [open, setOpen] = useState(overridden);
  const [seen, setSeen] = useState(overridden);
  if (overridden !== seen) {
    setSeen(overridden);
    if (overridden) setOpen(true);
  }

  if (!profileId || providers.length === 0) return null;
  const principal = models.default!.running;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      data-testid="advanced-models"
      className="rounded-lg border border-edge p-3"
    >
      <summary className="cursor-pointer text-sm font-semibold text-ink-body">
        {t("advanced.title", { athlete })}
      </summary>
      <div className="mt-3 space-y-4">
        {TASKS.map(({ purpose, labelKey }) => (
          <ModelChoiceSelect
            key={purpose}
            id={`model-${purpose}`}
            label={t(labelKey)}
            providers={providers}
            effective={models[purpose]!}
            principal={principal}
            onChoose={(choice) =>
              onSetBinding({ profileId, purpose, ...choice })
            }
            onInherit={() => onClearBinding(profileId, purpose)}
          />
        ))}
      </div>
    </details>
  );
}
