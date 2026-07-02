export type PushState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };

export type GarminPushOutcome = {
  success: boolean;
  /** Garmin-assigned workout id parsed from the push response; null when absent. */
  garminWorkoutId: string | null;
};

export type GarminBridgeState = {
  extensionInstalled: boolean;
  sessionActive: boolean;
  pushing: PushState;
  lastError: string | null;
  detectExtension: () => Promise<void>;
  /** Resolves with the push outcome — never rejects. */
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>;
  listWorkouts: () => Promise<unknown[]>;
  setPushing: (state: PushState) => void;
};
