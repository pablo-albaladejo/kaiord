import type { ManagedDataType } from "@kaiord/core";

import type { ConnectionMechanism } from "../../../types/connection";
import type { IntegrationPolicyDirection } from "../../../types/integration-policy";

export type ConnectionFlow = {
  label: string;
  sublabel: string;
  dataType: ManagedDataType;
  direction: IntegrationPolicyDirection;
};

export type ConnectionConfig = {
  id: string;
  name: string;
  mark: string;
  bridgeId: string | null;
  /** How this brand connects: extension bridge, API key, or not yet. */
  mechanism: ConnectionMechanism;
  flows: ConnectionFlow[];
};

/* Static catalog of connections shown on the Athlete page. Garmin and WHOOP
   connect via extension bridges; intervals.icu via an API key; Strava/Wahoo
   have no connect mechanism yet (OAuth needs a token-exchange backend — #714).
   Flow availability and last-sync freshness are derived from each bridge's
   announced capabilities — a WHOOP flow only reads "operational" once the
   whoop-bridge announces read:body / read:sleep, and a failed/expired refresh
   surfaces as staleness via the shared bridge discovery state. */
export const CONNECTIONS: readonly ConnectionConfig[] = [
  {
    id: "garmin",
    name: "Garmin",
    mark: "G",
    bridgeId: "garmin-bridge",
    mechanism: "bridge",
    flows: [
      {
        label: "Completed activities",
        sublabel: "Import finished workouts",
        dataType: "workout",
        direction: "import",
      },
      {
        label: "Planned workouts",
        sublabel: "Push planned sessions",
        dataType: "workout",
        direction: "export",
      },
      {
        label: "Daily readiness (HRV, sleep)",
        sublabel: "Import recovery signals",
        dataType: "hrv",
        direction: "import",
      },
    ],
  },
  {
    id: "whoop",
    name: "WHOOP",
    mark: "Wh",
    bridgeId: "whoop-bridge",
    mechanism: "bridge",
    flows: [
      {
        label: "Recovery & HRV",
        sublabel: "Import readiness signals",
        dataType: "hrv",
        direction: "import",
      },
      {
        label: "Sleep",
        sublabel: "Import sleep stages",
        dataType: "sleep",
        direction: "import",
      },
    ],
  },
  {
    id: "strava",
    name: "Strava",
    mark: "S",
    bridgeId: null,
    mechanism: "not-supported",
    flows: [],
  },
  {
    id: "wahoo",
    name: "Wahoo",
    mark: "W",
    bridgeId: null,
    mechanism: "not-supported",
    flows: [],
  },
  {
    id: "intervals",
    name: "intervals.icu",
    mark: "i",
    bridgeId: null,
    mechanism: "api-key",
    flows: [],
  },
];
