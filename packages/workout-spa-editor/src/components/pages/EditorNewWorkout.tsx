import { lazy, Suspense } from "react";
import { useLocation } from "wouter";

import { useAnalytics } from "../../contexts";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import type { Sport, Workout } from "../../types/krd";
import { WelcomeSection } from "./WelcomeSection";

const AiWorkoutInput = lazy(() =>
  import("../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

type EditorNewWorkoutProps = {
  workout: Workout | undefined;
};

export function EditorNewWorkout({ workout }: EditorNewWorkoutProps) {
  const [, navigate] = useLocation();
  const { handleFileLoad, handleFileError, handleCreateWorkout } =
    useAppHandlers();
  const analytics = useAnalytics();

  const handleManualCreate = (name: string, sport: Sport) => {
    handleCreateWorkout(name, sport);
    analytics.event("workout-created", { source: "manual" });
  };

  return (
    <>
      <Suspense fallback={null}>
        <AiWorkoutInput onSettingsClick={() => navigate("/settings/ai")} />
      </Suspense>
      {!workout && (
        <WelcomeSection
          onFileLoad={handleFileLoad}
          onFileError={handleFileError}
          onCreateWorkout={handleManualCreate}
        />
      )}
    </>
  );
}
