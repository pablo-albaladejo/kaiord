/**
 * The in-tab join of a record's running placement (design §3.3 step 1).
 * Every joined caller hears the confirmed library id, whenever it joined;
 * a joiner's `date` and `sendAnyway` are dropped, so one that asked for
 * another date is answered `busy`. Only the owning run settles.
 */
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import type { PlacementRequest } from "./placement-phase-one";
import { failed, type PlacementResult } from "./placement-result";

type OnConfirmed = (workoutId: GarminWorkoutId) => void;
type Confirmed = { libraryId?: GarminWorkoutId; listeners: OnConfirmed[] };

export type PlacementJoin = {
  date: string;
  result: Promise<PlacementResult>;
  confirmed: Confirmed;
};

const listen = (confirmed: Confirmed, listener: OnConfirmed | undefined) => {
  if (!listener) return;
  if (confirmed.libraryId) listener(confirmed.libraryId);
  else confirmed.listeners.push(listener);
};

/** Starts a join owned by `request`; `start` runs it with the returned
    request, whose `onLibraryConfirmed` reaches every caller. */
export const ownJoin = (
  request: PlacementRequest,
  start: (owned: PlacementRequest) => Promise<PlacementResult>
): PlacementJoin => {
  const confirmed: Confirmed = { listeners: [] };
  listen(confirmed, request.onLibraryConfirmed);
  const onLibraryConfirmed = (workoutId: GarminWorkoutId) => {
    confirmed.libraryId = workoutId;
    for (const listener of confirmed.listeners) listener(workoutId);
  };
  const result = start({ ...request, onLibraryConfirmed }).then((settled) => {
    request.onSettled?.(settled);
    return settled;
  });
  return { date: request.date, result, confirmed };
};

export const joinRun = async (
  join: PlacementJoin,
  request: PlacementRequest
): Promise<PlacementResult> => {
  listen(join.confirmed, request.onLibraryConfirmed);
  const result = await join.result;
  return request.date === join.date ? result : failed("busy", true);
};
