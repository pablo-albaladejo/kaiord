export type PushState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };

export type GarminBridgeState = {
  extensionInstalled: boolean;
  sessionActive: boolean;
  pushing: PushState;
  lastError: string | null;
  detectExtension: () => Promise<void>;
  pushWorkout: (gcn: unknown) => Promise<void>;
  listWorkouts: () => Promise<unknown[]>;
  setPushing: (state: PushState) => void;
};
