import { useCallback } from "react";

import { pushToGarminLambda } from "../../../lib/garmin-push";
import { isValidLambdaUrl, useGarminStore } from "../../../store/garmin-store";
import { useWorkoutStore } from "../../../store/workout-store";

export const useGarminPush = () => {
  const { username, password, lambdaUrl, setPush, hasCredentials } =
    useGarminStore();
  const { currentWorkout } = useWorkoutStore();

  const push = useCallback(async () => {
    if (!currentWorkout || !hasCredentials()) return;

    if (!isValidLambdaUrl(lambdaUrl)) {
      setPush({
        status: "error",
        message: "Invalid Lambda URL: must use HTTPS (except localhost)",
      });
      return;
    }

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
      const message = error instanceof Error ? error.message : "Push failed";
      setPush({ status: "error", message });
    }
  }, [currentWorkout, username, password, lambdaUrl, setPush, hasCredentials]);

  return { push };
};
