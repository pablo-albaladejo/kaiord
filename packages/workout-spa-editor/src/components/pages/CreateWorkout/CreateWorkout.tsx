import { useCallback } from "react";

import { buildReviewModel } from "../../../lib/workout-review";
import type { SportThresholds } from "../../../types/sport-zones";
import { buildWorkoutRecord } from "./build-workout-record";
import { CreateGeneratingPhase } from "./CreateGeneratingPhase";
import { CreateInputPhase } from "./CreateInputPhase";
import { CreateResultPhase } from "./CreateResultPhase";
import { useCreateWorkout } from "./use-create-workout";
import { useSaveAndPush } from "./use-save-and-push";

const FALLBACK_TITLE = "AI session";

export type CreateWorkoutProps = { onClose: () => void };

export default function CreateWorkout({ onClose }: CreateWorkoutProps) {
  const create = useCreateWorkout();
  const { phase, sport, profile, activeProfileId, generatedKrd, promptText } =
    create;

  const thresholds: SportThresholds =
    profile?.sportZones[sport]?.thresholds ?? {};
  const model = generatedKrd
    ? buildReviewModel(generatedKrd, thresholds, FALLBACK_TITLE)
    : null;
  const title = model?.title ?? FALLBACK_TITLE;

  const buildRecord = useCallback(() => {
    if (!generatedKrd) throw new Error("No generated workout to save");
    return buildWorkoutRecord({
      profileId: activeProfileId ?? "",
      sport,
      prompt: promptText,
      title,
      krd: generatedKrd,
    });
  }, [activeProfileId, sport, promptText, title, generatedKrd]);

  const { save, saving } = useSaveAndPush({ buildRecord, onDone: onClose });

  return (
    <div
      data-testid="create-workout"
      className="mx-auto min-h-screen w-full max-w-md bg-surface-deep p-4"
    >
      {phase === "input" && (
        <CreateInputPhase
          sport={sport}
          onSportChange={create.setSport}
          promptText={promptText}
          onPromptChange={create.setPromptText}
          provider={create.provider}
          onGenerate={create.generate}
          onClose={onClose}
        />
      )}
      {phase === "generating" && <CreateGeneratingPhase />}
      {phase === "result" && model && (
        <CreateResultPhase
          sport={sport}
          model={model}
          saving={saving}
          onRedo={() => create.setPhase("input")}
          onSave={save}
          onClose={onClose}
        />
      )}
    </div>
  );
}
