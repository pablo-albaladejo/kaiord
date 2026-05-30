import type { ManagedDataType } from "@kaiord/core";

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
  flows: ConnectionFlow[];
};

/* Static catalog of connections shown on the Athlete page. Only Garmin has a
   real bridge today; Strava/Wahoo/intervals.icu are "available" placeholders
   whose Connect action routes to the Extensions settings (no OAuth yet). */
export const CONNECTIONS: readonly ConnectionConfig[] = [
  {
    id: "garmin",
    name: "Garmin",
    mark: "G",
    bridgeId: "garmin-bridge",
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
  { id: "strava", name: "Strava", mark: "S", bridgeId: null, flows: [] },
  { id: "wahoo", name: "Wahoo", mark: "W", bridgeId: null, flows: [] },
  {
    id: "intervals",
    name: "intervals.icu",
    mark: "i",
    bridgeId: null,
    flows: [],
  },
];
