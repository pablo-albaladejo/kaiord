import { lazy, Suspense, useEffect, useRef } from "react";
import { useLocation } from "wouter";

import { useAnalytics } from "../../contexts/analytics-context";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import type { Sport, Workout } from "../../types/krd";
import { WelcomeSection } from "./WelcomeSection";

const AiWorkoutInput = lazy(() =>
  import("../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

export type EditorNewWorkoutMode = "scratch" | "import";

type EditorNewWorkoutProps = {
  workout: Workout | undefined;
  mode?: EditorNewWorkoutMode;
};

export function EditorNewWorkout({ workout, mode }: EditorNewWorkoutProps) {
  const [, navigate] = useLocation();
  const { handleFileLoad, handleFileError, handleCreateWorkout } =
    useAppHandlers();
  const analytics = useAnalytics();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleManualCreate = (name: string, sport: Sport) => {
    handleCreateWorkout(name, sport);
    analytics.event("workout-created", { source: "manual" });
  };

  useEffect(() => {
    if (mode !== "import") return;
    const node = fileInputRef.current;
    if (!node) return;
    if (typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "center" });
    }
    node.focus();
  }, [mode, workout]);

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
          fileInputRef={fileInputRef}
          defaultExpandManual={mode === "import"}
        />
      )}
    </>
  );
}
