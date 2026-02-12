import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import { AppKeyboardShortcuts } from "./components/AppKeyboardShortcuts";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection/WorkoutSection";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { TUTORIAL_STEPS } from "./constants/tutorial-steps";
import { useOnboardingTutorial } from "./hooks/use-onboarding-tutorial";
import { useAppHandlers } from "./hooks/useAppHandlers";
import { useDeleteCleanup } from "./hooks/useDeleteCleanup";
import { useWorkoutStore } from "./store/workout-store";
import type { Workout } from "./types/krd";

const OnboardingTutorial = lazy(() =>
  import("./components/organisms/OnboardingTutorial/OnboardingTutorial").then(
    (m) => ({ default: m.OnboardingTutorial })
  )
);

function App() {
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const { showTutorial, setShowTutorial } = useOnboardingTutorial();
  const [tutorialMounted, setTutorialMounted] = useState(showTutorial);
  useEffect(() => {
    if (showTutorial) setTutorialMounted(true);
  }, [showTutorial]);
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

      <Suspense fallback={null}>
        {(showTutorial || tutorialMounted) && (
          <OnboardingTutorial
            steps={TUTORIAL_STEPS}
            open={showTutorial}
            onOpenChange={setShowTutorial}
          />
        )}
      </Suspense>
    </AppToastProvider>
  );
}

export default App;
