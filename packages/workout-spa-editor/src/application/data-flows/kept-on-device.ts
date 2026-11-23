/**
 * What the App records about the athlete that never leaves the device, listed
 * beside the flows that do. Each id is worded under `kept.<id>` in the
 * `dataFlows` dictionary, and each one's table is device-local (left out of
 * the sync snapshot and of a backup file).
 */
export const KEPT_ON_DEVICE = ["traces"] as const;
