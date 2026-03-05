import { useCallback } from "react";
import { useGarminStore } from "../../../store/garmin-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { pushToGarminLambda } from "../../../lib/garmin-push";

export const useGarminPush = () => {
  const { username, password, lambdaUrl, setPush, hasCredentials } =
    useGarminStore();
  const { currentWorkout } = useWorkoutStore();

  const push = useCallback(async () => {
    if (!currentWorkout || !hasCredentials()) return;

    setPush({ status: "loading" });

    try {
      const result = await pushToGarminLambda(lambdaUrl, {
        krd: currentWorkout,
        garmin: { username, password },
      });
      setPush({
        status: "success",
        id: result.id,
        name: result.name,
        url: result.url,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Push failed";
      setPush({ status: "error", message });
    }
  }, [currentWorkout, username, password, lambdaUrl, setPush, hasCredentials]);

  return { push };
};
