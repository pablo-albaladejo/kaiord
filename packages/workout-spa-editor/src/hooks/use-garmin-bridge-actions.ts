import { useCallback, useState } from "react";

import type { ConnectionState } from "../application/connections/connection-state";
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
  const [features, setFeatures] = useState<readonly string[]>([]);
  const [pushing, setPushing] = useState<PushState>(INITIAL_PUSH_STATE);
  // As `extensionInstalled` starts false: no extension has answered yet.
  const [connection, setConnection] =
    useState<ConnectionState>("not-installed");

  const detectExtension = useCallback(
    () =>
      runDetect({
        setExtensionInstalled,
        setSessionActive,
        setFeatures,
        setConnection,
      }),
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
    features,
    pushing,
    connection,
    detectExtension,
    pushWorkout,
    listWorkouts,
    setPushing,
  };
};
