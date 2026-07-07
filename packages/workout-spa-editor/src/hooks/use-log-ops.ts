import { useCallback } from "react";

import type {
  LogHealthMetricInput,
  LogIntakeInput,
} from "../application/chat/tools/chat-tool-deps";
import { usePersistence } from "../contexts/persistence-context";
import { doLogHealthMetric } from "./chat/chat-action-ops-impl";
import { doLogIntake } from "./chat/do-log-intake";

export type LogOps = {
  logHealthMetric: (input: LogHealthMetricInput) => Promise<unknown>;
  logIntake: (input: LogIntakeInput) => Promise<unknown>;
};

export const useLogOps = (profileId: string | null): LogOps => {
  const persistence = usePersistence();
  const logHealthMetric = useCallback(
    (input: LogHealthMetricInput) => {
      if (!profileId) throw new Error("No active profile");
      return doLogHealthMetric(persistence, profileId, input);
    },
    [persistence, profileId]
  );
  const logIntake = useCallback(
    (input: LogIntakeInput) => {
      if (!profileId) throw new Error("No active profile");
      return doLogIntake(persistence, profileId, input);
    },
    [persistence, profileId]
  );
  return { logHealthMetric, logIntake };
};
