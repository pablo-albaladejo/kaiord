/**
 * Reactive read of one parameter's canonical value series (DoD-2). Observes
 * `labValues` through `persistence.labs`, so a new report re-renders the chart.
 */
import type { LabValue } from "@kaiord/core";
import { useLiveQuery } from "dexie-react-hooks";

import { getLabValueSeries } from "../../../../../application/lab/lab-queries";
import { usePersistence } from "../../../../../contexts/persistence-context";

export const useLabValueSeriesLive = (
  profileId: string,
  parameterKey: string
): LabValue[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery(
    () => getLabValueSeries(persistence.labs, profileId, parameterKey),
    [profileId, parameterKey]
  );
};
