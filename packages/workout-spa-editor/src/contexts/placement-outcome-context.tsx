/**
 * The last placement run's outcome per record, kept in memory above the
 * send control so it outlives the control's unmount (a confirmed library
 * push marks the workout `pushed` mid-run). Never persisted: the durable
 * facts (`uncertain`, dismissable entries) are read from the ledger.
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { PlacementResult } from "../application/garmin-placement/placement-result";

/** A run's outcome and the workout date it ran for. */
export type LastRun = { result: PlacementResult; date?: string };

type Outcomes = {
  get: (recordId: string) => LastRun | undefined;
  set: (recordId: string, run: LastRun | undefined) => void;
};

const PlacementOutcomeContext = createContext<Outcomes | null>(null);

export const PlacementOutcomeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [outcomes, setOutcomes] = useState<ReadonlyMap<string, LastRun>>(
    new Map()
  );
  const set = useCallback(
    (recordId: string, run: LastRun | undefined) =>
      setOutcomes((prev) => {
        const next = new Map(prev);
        if (run) next.set(recordId, run);
        else next.delete(recordId);
        return next;
      }),
    []
  );
  const value = useMemo(
    () => ({ get: (id: string) => outcomes.get(id), set }),
    [outcomes, set]
  );
  return (
    <PlacementOutcomeContext.Provider value={value}>
      {children}
    </PlacementOutcomeContext.Provider>
  );
};

/** Outside a provider the outcome is local to the caller. */
export const usePlacementOutcome = (recordId: string | undefined) => {
  const shared = useContext(PlacementOutcomeContext);
  const [local, setLocal] = useState<LastRun>();
  const result = shared && recordId ? shared.get(recordId) : local;
  const set = useCallback(
    (next: LastRun | undefined) =>
      shared && recordId ? shared.set(recordId, next) : setLocal(next),
    [shared, recordId]
  );
  return [result, set] as const;
};
