/**
 * Port — the one library write of the Garmin Bridge beyond the push: delete
 * a library workout by its id. The pipeline calls it only for a version
 * Kaiord's record holds as created by Kaiord and that no calendar entry
 * still uses (`placement-library-cleanup`). The adapter never throws: a
 * failure is an answer with the envelope's fields.
 */
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import type { BridgeFailure } from "./garmin-calendar-port";

export type RemoveLibraryAnswer = { ok: true } | BridgeFailure;

export type GarminLibraryPort = {
  remove: (workoutId: GarminWorkoutId) => Promise<RemoveLibraryAnswer>;
};
