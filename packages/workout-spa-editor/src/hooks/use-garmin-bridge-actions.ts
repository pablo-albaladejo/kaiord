import { useCallback, useState } from "react";

import type { PushState } from "../contexts/garmin-bridge-types";
import { executeList, INITIAL_PUSH_STATE } from "./garmin-bridge-operations";
import {
  getGarminExtensionId,
  runDetect,
  runPush,
} from "./use-garmin-bridge-action-helpers";

export const useGarminBridgeActions = () => {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [pushing, setPushing] = useState<PushState>(INITIAL_PUSH_STATE);
  const [lastError, setLastError] = useState<string | null>(null);

  const detectExtension = useCallback(
    () => runDetect({ setExtensionInstalled, setSessionActive, setLastError }),
    []
  );

  const redetect = useCallback(() => detectExtension(), [detectExtension]);

  const pushWorkout = useCallback(
    (gcn: unknown) => runPush(gcn, setPushing, redetect),
    [redetect]
  );

  const listWorkouts = useCallback(async (): Promise<unknown[]> => {
    try {
      const { data } = await executeList(getGarminExtensionId());
      return data;
    } catch (err: unknown) {
      if (err instanceof Error && "redetect" in err) await redetect();
      throw err;
    }
  }, [redetect]);

  return {
    extensionInstalled,
    sessionActive,
    pushing,
    lastError,
    detectExtension,
    pushWorkout,
    listWorkouts,
    setPushing,
  };
};
