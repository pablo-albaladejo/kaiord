import type { ConnectionMechanism } from "../types/connection";

export type IntegrationRegistryEntry = {
  id: string;
  name: string;
  mark: string;
  mechanism: ConnectionMechanism;
  bridgeId: string | null;
};

export const INTEGRATION_REGISTRY_ENTRIES: readonly IntegrationRegistryEntry[] =
  [
    {
      id: "garmin",
      name: "Garmin",
      mark: "G",
      mechanism: "bridge",
      bridgeId: "garmin-bridge",
    },
    {
      id: "whoop",
      name: "WHOOP",
      mark: "Wh",
      mechanism: "bridge",
      bridgeId: "whoop-bridge",
    },
    {
      id: "train2go",
      name: "Train2Go",
      mark: "T2",
      mechanism: "bridge",
      bridgeId: "train2go-bridge",
    },
    {
      id: "manual",
      name: "Manual Entry",
      mark: "M",
      mechanism: "manual",
      bridgeId: null,
    },
    {
      id: "intervals",
      name: "intervals.icu",
      mark: "i",
      mechanism: "api-key",
      bridgeId: null,
    },
    {
      id: "strava",
      name: "Strava",
      mark: "S",
      mechanism: "not-supported",
      bridgeId: null,
    },
    {
      id: "wahoo",
      name: "Wahoo",
      mark: "W",
      mechanism: "not-supported",
      bridgeId: null,
    },
    {
      id: "trainingpeaks",
      name: "TrainingPeaks",
      mark: "TP",
      mechanism: "not-supported",
      bridgeId: null,
    },
  ];
