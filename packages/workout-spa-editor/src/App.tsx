import "./App.css";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection/WorkoutSection";
import { MainLayout } from "./components/templates/MainLayout";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useWorkoutStore } from "./store/workout-store";
import {
  useCurrentWorkout,
  useLoadWorkout,
  useSelectStep,
  useSelectedStepId,
} from "./store/workout-store-selectors";
import type { KRD, Workout } from "./types/krd";
import type { Sport } from "./types/krd-core";
import { saveWorkout } from "./utils/save-workout";

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
  const loadWorkout = useLoadWorkout();
  const selectStep = useSelectStep();
  const createEmptyWorkout = useWorkoutStore(
    (state) => state.createEmptyWorkout
  );
  const undo = useWorkoutStore((state) => state.undo);
  const redo = useWorkoutStore((state) => state.redo);
  const canUndo = useWorkoutStore((state) => state.canUndo());
  const canRedo = useWorkoutStore((state) => state.canRedo());

  // Extract workout from KRD extensions (type assertion needed due to z.record(z.unknown()))
  const workout = currentWorkout?.extensions?.workout as Workout | undefined;

  // Keyboard shortcuts (Requirement 16)
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
  });

  const handleFileLoad = (krd: KRD) => {
    // Load the workout into the store (Requirement 7)
    loadWorkout(krd);
  };

  const handleFileError = () => {
    // Error handling is done by FileUpload component
    // Errors are displayed to the user via FileUpload's ErrorMessage component
  };

  const handleStepSelect = (stepIndex: number) => {
    // Select step by creating a unique ID (Requirement 1)
    selectStep(`step-${stepIndex}`);
  };

  const handleCreateWorkout = (name: string, sport: Sport) => {
    // Create a new empty workout (Requirement 2)
    createEmptyWorkout(name, sport);
  };

  return (
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
          />
        )}
      </div>
    </MainLayout>
  );
}

export default App;
