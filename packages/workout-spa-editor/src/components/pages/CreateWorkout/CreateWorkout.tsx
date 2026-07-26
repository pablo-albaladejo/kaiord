import { useTranslate } from "../../../i18n/use-translate";
import { thresholdsForSport } from "../../../lib/athlete";
import { buildReviewModel } from "../../../lib/workout-review";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { CreateGeneratingPhase } from "./CreateGeneratingPhase";
import { CreateInputPhase } from "./CreateInputPhase";
import { CreateResultPhase } from "./CreateResultPhase";
import { useCreateSave } from "./use-create-save";
import { useCreateWorkout } from "./use-create-workout";

export type CreateWorkoutProps = {
  onClose: () => void;
  /** Post-save landing; receives the persisted record's calendar date. */
  onSaved: (date: string) => void;
};

export default function CreateWorkout({
  onClose,
  onSaved,
}: CreateWorkoutProps) {
  const t = useTranslate("create-workout");
  const FALLBACK_TITLE = t("fallbackTitle");
  const create = useCreateWorkout();
  const { phase, sport, profile, activeProfileId, generatedKrd, promptText } =
    create;
  const { dateParam } = create;

  const thresholds = thresholdsForSport(profile, sport);
  const model = generatedKrd
    ? buildReviewModel(generatedKrd, thresholds, FALLBACK_TITLE)
    : null;
  const title = model?.title ?? FALLBACK_TITLE;

  const { save, saving } = useCreateSave({
    generatedKrd,
    activeProfileId,
    sport,
    promptText,
    title,
    dateParam,
    onSaved,
  });

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
        {t("sheet.newSession")}
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
