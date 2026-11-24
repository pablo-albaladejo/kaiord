import { useMemo } from "react";

import { useOfferedNavDestinations } from "../../../hooks/use-offered-nav-destinations";
import { type StatusEntries, statusEntriesOf } from "./status-entry-defs";

export const useStatusEntries = (): StatusEntries => {
  const destinations = useOfferedNavDestinations();
  return useMemo(() => statusEntriesOf(destinations), [destinations]);
};
