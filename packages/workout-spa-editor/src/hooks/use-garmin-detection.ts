import { useEffect } from "react";

import { useGarminBridge } from "../contexts";
import { useDiscoveredExtensionId } from "./use-discovered-extension-id";

export const useGarminDetection = () => {
  const { detectExtension } = useGarminBridge();
  const extensionId = useDiscoveredExtensionId("garmin-bridge");

  useEffect(() => {
    detectExtension();
  }, [detectExtension, extensionId]);
};
