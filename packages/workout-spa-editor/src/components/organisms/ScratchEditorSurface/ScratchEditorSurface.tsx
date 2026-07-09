import { useAppHandlers } from "../../../hooks/use-app-handlers";
import { useTranslate } from "../../../i18n/use-translate";
import { useCurrentWorkout } from "../../../store/selectors";
import { useWorkoutStore } from "../../../store/workout-store";
import type { Workout } from "../../../types/krd";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { AiBanner } from "../../molecules/AiBanner/AiBanner";
import { useCoachingSidebar } from "../../organisms/CoachingSidebar/use-coaching-sidebar";
import { EditorBody } from "../../pages/EditorBody";
import { WorkoutSection } from "../../pages/WorkoutSection/WorkoutSection";
import { ScratchScheduleButton } from "./ScratchScheduleButton";
import { useScratchAutoSeed } from "./use-scratch-auto-seed";

/**
 * Editor canvas for `/workout/new?source=scratch`.
 *
 * Composes the collapsed `AiBanner` above the editor body. The scratch
 * auto-init lifecycle (mount seeding + sport-preference writeback) lives in
 * `useScratchAutoSeed`, which returns `startInEditMode` for the auto-init path.
 */
export function ScratchEditorSurface({ date }: { date: string | null }) {
  const t = useTranslate("editor");
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();
  const sidebarData = useCoachingSidebar(null, undefined);
  const { startInEditMode } = useScratchAutoSeed(t);

  const workout = currentWorkout?.extensions?.structured_workout as
    Workout | undefined;

  return (
    <div className="space-y-6">
      <AiBanner />
      <ScratchScheduleButton date={date ?? todayIsoDate()} />
      {workout && currentWorkout && (
        <EditorBody sidebar={sidebarData}>
          <WorkoutSection
            workout={workout}
            krd={currentWorkout}
            selectedStepId={selectedStepId}
            onStepSelect={handleStepSelect}
            onStepReorder={reorderStep}
            onReorderStepsInBlock={reorderStepsInBlock}
            startInEditMode={startInEditMode}
          />
        </EditorBody>
      )}
    </div>
  );
}
