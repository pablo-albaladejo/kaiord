import "./App.css";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection";
import { MainLayout } from "./components/templates/MainLayout";
import {
  useCurrentWorkout,
  useLoadWorkout,
  useSelectStep,
  useSelectedStepId,
} from "./store/workout-store-selectors";
import type { KRD, ValidationError, Workout } from "./types/krd";

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

  // Extract workout from KRD extensions (type assertion needed due to z.record(z.unknown()))
  const workout = currentWorkout?.extensions?.workout as Workout | undefined;

  const handleFileLoad = (krd: KRD) => {
    // Load the workout into the store (Requirement 7)
    loadWorkout(krd);
  };

  const handleFileError = (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => {
    // Error handling is done by FileUpload component
    console.error("File load error:", error, validationErrors);
  };

  const handleStepSelect = (stepIndex: number) => {
    // Select step by creating a unique ID (Requirement 1)
    selectStep(`step-${stepIndex}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {!workout && (
          <WelcomeSection
            onFileLoad={handleFileLoad}
            onFileError={handleFileError}
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
