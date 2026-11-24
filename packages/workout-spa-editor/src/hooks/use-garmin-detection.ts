import { useEffect } from "react";

import { useGarminBridge } from "../contexts";
import { useDiscoveredExtensionId } from "./use-discovered-extension-id";
import { useOutdatedBridges } from "./use-outdated-bridges";

export const useGarminDetection = () => {
  const { detectExtension } = useGarminBridge();
  const extensionId = useDiscoveredExtensionId("garmin-bridge");
  // An outdated extension is not registered, so its id never arrives; the
  // detection re-runs when discovery learns it is there and outdated.
  const outdated = useOutdatedBridges();

  useEffect(() => {
    detectExtension();
  }, [detectExtension, extensionId, outdated]);
};
