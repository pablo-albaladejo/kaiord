/* eslint-disable max-lines, max-lines-per-function */
import "./App.css";
import { ToastProvider } from "./components/atoms/Toast";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection/WorkoutSection";
import { MainLayout } from "./components/templates/MainLayout";
import { useAppHandlers } from "./hooks/useAppHandlers";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useWorkoutStore } from "./store/workout-store";
import {
  useCurrentWorkout,
  useSelectedStepId,
} from "./store/workout-store-selectors";
import type { Workout } from "./types/krd";
import { saveWorkout } from "./utils/save-workout";
import { parseStepId } from "./utils/step-id-parser";

/**
 * Main App Component
 *
 * Integrates file upload, workout state management, and workout display.
 * Implements Requirements 1 and 7:
 * - Requirement 1: Display workout structure in clear visual format
 * - Requirement 7: Load existing KRD files
 */
function App() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const undo = useWorkoutStore((state) => state.undo);
  const redo = useWorkoutStore((state) => state.redo);
  const reorderStep = useWorkoutStore((state) => state.reorderStep);
  const reorderStepsInBlock = useWorkoutStore(
    (state) => state.reorderStepsInBlock
  );
  const canUndo = useWorkoutStore((state) => state.canUndo());
  const canRedo = useWorkoutStore((state) => state.canRedo());

  const {
    handleFileLoad,
    handleFileError,
    handleStepSelect,
    handleCreateWorkout,
  } = useAppHandlers();

  const workout = currentWorkout?.extensions?.workout as Workout | undefined;

  // Helper function to get step index from selected step ID
  const getSelectedStepIndex = (): number | null => {
    if (!selectedStepId || !workout) return null;

    try {
      const parsed = parseStepId(selectedStepId);

      // Only handle main workout steps (not block steps) for keyboard shortcuts
      if (parsed.type !== "step" || parsed.stepIndex === undefined) {
        return null;
      }

      // For keyboard shortcuts, only handle main workout steps (no blockIndex)
      if (parsed.blockIndex !== undefined) {
        return null;
      }

      const stepIndex = parsed.stepIndex;

      // Validate that the step exists at this index
      if (stepIndex < 0 || stepIndex >= workout.steps.length) return null;

      return stepIndex;
    } catch {
      return null;
    }
  };

  useKeyboardShortcuts({
    onSave: () => {
      if (currentWorkout) {
        saveWorkout(currentWorkout);
      }
    },
    onUndo: () => {
      if (canUndo) {
        undo();
      }
    },
    onRedo: () => {
      if (canRedo) {
        redo();
      }
    },
    onMoveStepUp: () => {
      const stepIndex = getSelectedStepIndex();
      if (stepIndex !== null && stepIndex > 0) {
        reorderStep(stepIndex, stepIndex - 1);
      }
    },
    onMoveStepDown: () => {
      const stepIndex = getSelectedStepIndex();
      if (
        stepIndex !== null &&
        workout &&
        stepIndex < workout.steps.length - 1
      ) {
        reorderStep(stepIndex, stepIndex + 1);
      }
    },
  });

  return (
    <ToastProvider>
      <MainLayout>
        <div className="space-y-6">
          {!workout && (
            <WelcomeSection
              onFileLoad={handleFileLoad}
              onFileError={handleFileError}
              onCreateWorkout={handleCreateWorkout}
            />
          )}
          {workout && currentWorkout && (
            <WorkoutSection
              workout={workout}
              krd={currentWorkout}
              selectedStepId={selectedStepId}
              onStepSelect={handleStepSelect}
              onStepReorder={reorderStep}
              onReorderStepsInBlock={reorderStepsInBlock}
            />
          )}
        </div>
      </MainLayout>
    </ToastProvider>
  );
}

export default App;
