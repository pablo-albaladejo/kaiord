import { useEffect } from "react";

import { useTrain2GoStore } from "../store/train2go-store";
import { useDiscoveredExtensionId } from "./use-discovered-extension-id";

export const useTrain2GoDetection = () => {
  const detectExtension = useTrain2GoStore((s) => s.detectExtension);
  const extensionId = useDiscoveredExtensionId("train2go-bridge");

  useEffect(() => {
    detectExtension();
  }, [detectExtension, extensionId]);

  // Force a fresh detection when the user returns to the tab — the
  // 30s positive-result cache means the periodic mount-time detection
  // alone can leave the calendar header stale after a Connect dance
  // that lit up the bridge in another tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void detectExtension({ force: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [detectExtension]);
};
