/**
 * Editor New Workout Section
 *
 * Shows AI input + welcome section for creating new workouts. Wraps
 * the manual save flow with analytics so that `workout-created` events
 * with `source: "manual"` are emitted whenever the user saves a
 * non-AI workout.
 */

import { lazy, Suspense } from "react";

import { useAnalytics, useSettingsDialog } from "../../contexts";
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
  const { show: settingsShow } = useSettingsDialog();
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
        <AiWorkoutInput onSettingsClick={settingsShow} />
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
