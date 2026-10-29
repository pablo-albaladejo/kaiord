import type { KRD } from "@kaiord/core";

const ACCEPTED_TYPE = "structured_workout";

const RECORDED_FIELDS = ["sessions", "laps", "records", "events"] as const;

// The KRD-level namespaces the workout readers emit: `structured_workout`
// (every reader), `fit` (FIT), `tcx` (TCX root extensions), `zwift` (ZWO)
// and `gcn` (GCN). Pinned by structured-workout-gate.test.ts.
export const REMOTE_EXTENSION_ALLOWLIST: ReadonlySet<string> = new Set([
  "structured_workout",
  "fit",
  "tcx",
  "zwift",
  "gcn",
]);

const reject = (message: string): Error => {
  const error = new Error(message);
  error.name = "RemoteInputRejectedError";
  return error;
};

export const assertStructuredWorkout = (krd: KRD): KRD => {
  if (krd.type !== ACCEPTED_TYPE) {
    throw reject(
      `KRD type ${krd.type} is not accepted remotely; only ${ACCEPTED_TYPE} is`
    );
  }
  const recorded = RECORDED_FIELDS.find((field) => krd[field] !== undefined);
  if (recorded) {
    throw reject(`Field ${recorded} is not accepted remotely`);
  }
  const namespace = Object.keys(krd.extensions ?? {}).find(
    (key) => !REMOTE_EXTENSION_ALLOWLIST.has(key)
  );
  if (namespace) {
    throw reject(`Field extensions.${namespace} is not accepted remotely`);
  }
  return krd;
};
