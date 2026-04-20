import { useEffect } from "react";

import { useTrain2GoStore } from "../store/train2go-store";
import { useDiscoveredExtensionId } from "./use-discovered-extension-id";

export const useTrain2GoDetection = () => {
  const detectExtension = useTrain2GoStore((s) => s.detectExtension);
  const extensionId = useDiscoveredExtensionId("train2go-bridge");

  useEffect(() => {
    detectExtension();
  }, [detectExtension, extensionId]);
};
