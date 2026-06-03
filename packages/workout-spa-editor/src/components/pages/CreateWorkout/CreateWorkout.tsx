import { useCallback } from "react";

import { thresholdsForSport } from "../../../lib/athlete";
import { buildReviewModel } from "../../../lib/workout-review";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
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

  const thresholds = thresholdsForSport(profile, sport);
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
      {/* Eager route heading (D5): the route-heading marker lives on a stable
          element so every phase — including `generating`, whose body has no
          heading — exposes a focus target for useFocusOnRouteChange. Copy is
          stable across phases; phase-specific titles live in CreateSheetHeader. */}
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        New session
      </h1>
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
