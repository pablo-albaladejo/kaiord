import { useMemo } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createTrain2GoCoachingTransport } from "../adapters/train2go/train2go-coaching-transport";
import type { CoachingTransport } from "../application/coaching/coaching-transport-port";

export const useTrain2GoCoachingTransport = (): CoachingTransport =>
  useMemo(
    () =>
      createTrain2GoCoachingTransport(
        () => bridgeDiscovery.getExtensionId("train2go-bridge") ?? ""
      ),
    []
  );
