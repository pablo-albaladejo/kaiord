import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicyDirection } from "../../../types/integration-policy";

export type ConnectionFlow = {
  label: string;
  sublabel: string;
  dataType: ManagedDataType;
  direction: IntegrationPolicyDirection;
};

export const GARMIN_FLOWS: ConnectionFlow[] = [
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
];

export const WHOOP_FLOWS: ConnectionFlow[] = [
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
];
