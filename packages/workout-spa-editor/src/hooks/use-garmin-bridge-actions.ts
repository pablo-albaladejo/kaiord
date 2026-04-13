import { useCallback, useState } from "react";

import type { PushState } from "../contexts/garmin-bridge-types";
import { ping } from "../store/garmin-extension-transport";
import {
  evaluatePingResult,
  executeList,
  executePush,
  INITIAL_PUSH_STATE,
} from "./garmin-bridge-operations";

const EXTENSION_ID: string = import.meta.env.VITE_GARMIN_EXTENSION_ID || "";

export const useGarminBridgeActions = () => {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [pushing, setPushing] = useState<PushState>(INITIAL_PUSH_STATE);
  const [lastError, setLastError] = useState<string | null>(null);

  const detectExtension = useCallback(async () => {
    const res = await ping(EXTENSION_ID);
    const result = evaluatePingResult(res);
    setExtensionInstalled(result.installed);
    setSessionActive(result.installed && result.session);
    setLastError(result.installed ? result.error : null);
  }, []);

  const redetect = useCallback(async () => {
    await detectExtension();
  }, [detectExtension]);

  const pushWorkout = useCallback(
    async (gcn: unknown) => {
      setPushing({ status: "loading" });
      const result = await executePush(EXTENSION_ID, gcn);
      if (result.status === "invalidated") {
        await redetect();
        setPushing({
          status: "error",
          message: "Extension was updated. Please try again.",
        });
      } else if (result.status === "error") {
        if (result.redetect) await redetect();
        setPushing({ status: "error", message: result.message });
      } else {
        setPushing({ status: "success" });
      }
    },
    [redetect]
  );

  const listWorkouts = useCallback(async (): Promise<unknown[]> => {
    try {
      const { data } = await executeList(EXTENSION_ID);
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
