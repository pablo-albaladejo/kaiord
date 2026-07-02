import type { ConnectionMechanism } from "../../../types/connection";
import type { ConnectionFlow } from "./connection-flows";
import { GARMIN_FLOWS, WHOOP_FLOWS } from "./connection-flows";

export type { ConnectionFlow } from "./connection-flows";

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
    flows: GARMIN_FLOWS,
  },
  {
    id: "whoop",
    name: "WHOOP",
    mark: "Wh",
    bridgeId: "whoop-bridge",
    mechanism: "bridge",
    flows: WHOOP_FLOWS,
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
