import type { ConnectionState } from "../application/connections/connection-state";

/**
 * Why a send to Garmin stopped, worded by `PushFeedback`: the extension was
 * updated, the Session is gone, the workout could not be converted, or no
 * cause is known ("not answering").
 */
export type GarminPushFailure =
  "updated" | "sign-in" | "not-prepared" | "not-answering";

export type PushState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; reason: GarminPushFailure }
  | { status: "success" };

export type GarminPushOutcome = {
  success: boolean;
  /** Garmin-assigned workout id parsed from the push response; null when absent. */
  garminWorkoutId: string | null;
};

export type GarminBridgeState = {
  /** The Connection's verified state, worded by `connectionNotice`. */
  connection: ConnectionState;
  extensionInstalled: boolean;
  sessionActive: boolean;
  /** The bridge's ping `features` (`[]` for a bridge that predates them). */
  features: readonly string[];
  pushing: PushState;
  detectExtension: () => Promise<void>;
  /** Resolves with the push outcome — never rejects. */
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>;
  listWorkouts: () => Promise<unknown[]>;
  setPushing: (state: PushState) => void;
};
