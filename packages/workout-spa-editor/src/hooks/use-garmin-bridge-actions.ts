import { useCallback, useEffect, useState } from "react";

import type { ConnectionState } from "../application/connections/connection-state";
import type { PushState } from "../contexts/garmin-bridge-types";
import { executeList, INITIAL_PUSH_STATE } from "./garmin-bridge-operations";
import { msUntilDiscoverySettled } from "./garmin-discovery-window";
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
  // Nothing has answered yet: "checking" until a ping or discovery's window.
  const [connection, setConnection] = useState<ConnectionState>("checking");

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

  // Re-detect once discovery's window closes, so an extension that never
  // announced turns from "checking" into "not-installed" without a reload.
  useEffect(() => {
    const timer = setTimeout(
      () => void detectExtension(),
      msUntilDiscoverySettled()
    );
    return () => clearTimeout(timer);
  }, [detectExtension]);

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
