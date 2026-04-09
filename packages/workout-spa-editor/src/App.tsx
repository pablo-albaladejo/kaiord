import { lazy, Suspense } from "react";

import { AppKeyboardShortcuts } from "./components/AppKeyboardShortcuts";
import { AppTutorial } from "./components/AppTutorial";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection/WorkoutSection";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useOnboardingTutorial } from "./hooks/use-onboarding-tutorial";
import { useStoreHydration } from "./hooks/use-store-hydration";
import { useAppHandlers } from "./hooks/useAppHandlers";
import { useDeleteCleanup } from "./hooks/useDeleteCleanup";
import { useSettingsDialogStore } from "./store/settings-dialog-store";
import { useWorkoutStore } from "./store/workout-store";
import type { Workout } from "./types/krd";

const AiWorkoutInput = lazy(() =>
  import("./components/organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

function App() {
  useStoreHydration();
  useDeleteCleanup();
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { showTutorial, setShowTutorial } = useOnboardingTutorial();
  const settingsShow = useSettingsDialogStore((s) => s.show);
  const {
    handleFileLoad,
    handleFileError,
    handleStepSelect,
    handleCreateWorkout,
  } = useAppHandlers();

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  return (
    <AppToastProvider>
      <AppKeyboardShortcuts />
      <MainLayout onReplayTutorial={() => setShowTutorial(true)}>
        <div className="space-y-6">
          <Suspense fallback={null}>
            <AiWorkoutInput onSettingsClick={settingsShow} />
          </Suspense>
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
      <AppTutorial show={showTutorial} onOpenChange={setShowTutorial} />
    </AppToastProvider>
  );
}

export default App;
