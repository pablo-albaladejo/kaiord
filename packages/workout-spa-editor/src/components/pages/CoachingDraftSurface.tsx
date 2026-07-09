/**
 * Editor canvas for `/workout/new?coaching=<compositeId>` — the
 * store-only coaching draft (defer-coaching-create). Nothing is persisted
 * until the explicit Save click; mirrors `ScratchEditorSurface`.
 *
 * The sidebar is rendered directly from the draft activity record rather
 * than through `useCoachingSidebar`/`EditorBody.sidebar`, which resolve a
 * persisted SessionMatch that does not exist for a draft.
 */
import { useAppHandlers } from "../../hooks/use-app-handlers";
import { useTranslate } from "../../i18n/use-translate";
import { useCurrentWorkout } from "../../store/selectors/workout-selectors";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import { Button } from "../atoms/Button/Button";
import { CoachingSidebar } from "../organisms/CoachingSidebar/CoachingSidebar";
import { EditorNoData } from "./EditorLoadingState";
import { EditorPageHeader } from "./EditorPageHeader";
import { useCoachingDraft } from "./use-coaching-draft";
import { useCoachingDraftSave } from "./use-coaching-draft-save";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

export type CoachingDraftSurfaceProps = {
  coachingDraftId: string;
  onBack?: () => void;
};

export function CoachingDraftSurface({
  coachingDraftId,
  onBack,
}: CoachingDraftSurfaceProps) {
  const t = useTranslate("chat");
  const { activity, noStructured } = useCoachingDraft(coachingDraftId);
  const { canSave, save } = useCoachingDraftSave(activity);
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();

  const workout = currentWorkout?.extensions?.structured_workout as
    Workout | undefined;

  return (
    <div className="space-y-6">
      <EditorPageHeader mode="new" onBack={onBack} />
      {noStructured && <EditorNoData />}
      {!noStructured && (
        <Button
          variant="primary"
          disabled={!canSave}
          onClick={() => void save()}
          data-testid="coaching-draft-save-button"
        >
          {t("draft.saveWorkout")}
        </Button>
      )}
      {workout && currentWorkout && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <WorkoutSection
              workout={workout}
              krd={currentWorkout}
              selectedStepId={selectedStepId}
              onStepSelect={handleStepSelect}
              onStepReorder={reorderStep}
              onReorderStepsInBlock={reorderStepsInBlock}
            />
          </div>
          {activity && (
            <div className="lg:w-80 lg:flex-shrink-0">
              <CoachingSidebar activity={activity} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
