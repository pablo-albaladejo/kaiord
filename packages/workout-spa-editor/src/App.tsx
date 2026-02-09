import "./App.css";
import { OnboardingTutorial } from "./components/organisms/OnboardingTutorial/OnboardingTutorial";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection/WorkoutSection";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { TUTORIAL_STEPS } from "./constants/tutorial-steps";
import { useAppKeyboardHandlers } from "./hooks/use-app-keyboard-handlers";
import { useOnboardingTutorial } from "./hooks/use-onboarding-tutorial";
import { useAppHandlers } from "./hooks/useAppHandlers";
import { useDeleteCleanup } from "./hooks/useDeleteCleanup";
import { useWorkoutStore } from "./store/workout-store";
import {
  useCurrentWorkout,
  useSelectedStepId,
} from "./store/workout-store-selectors";
import type { Workout } from "./types/krd";

/** Renders keyboard shortcut bindings inside the toast context */
function AppKeyboardShortcuts() {
  useAppKeyboardHandlers();
  return null;
}

/**
 * Main App Component
 *
 * Integrates file upload, workout state management, and workout display.
 * Implements Requirements 1, 7, 37.1, and 37.5:
 * - Requirement 1: Display workout structure in clear visual format
 * - Requirement 7: Load existing KRD files
 * - Requirement 37.1: Display onboarding tutorial on first visit
 * - Requirement 37.5: Allow skipping or replaying tutorial
 */
function App() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const { showTutorial, setShowTutorial } = useOnboardingTutorial();
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  const {
    handleFileLoad,
    handleFileError,
    handleStepSelect,
    handleCreateWorkout,
  } = useAppHandlers();

  useDeleteCleanup();

  return (
    <AppToastProvider>
      <AppKeyboardShortcuts />
      <MainLayout onReplayTutorial={() => setShowTutorial(true)}>
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

      <OnboardingTutorial
        steps={TUTORIAL_STEPS}
        open={showTutorial}
        onOpenChange={setShowTutorial}
      />
    </AppToastProvider>
  );
}

export default App;
