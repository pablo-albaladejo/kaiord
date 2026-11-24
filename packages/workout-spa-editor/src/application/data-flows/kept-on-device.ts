/**
 * What the App records about the athlete that never leaves the device, listed
 * beside the flows that do. Each id is worded under `kept.<id>` in the
 * `dataFlows` dictionary, and each one is a store in `DEVICE_LOCAL_TABLES`
 * (left out of the sync snapshot and of a backup file).
 */
export const KEPT_ON_DEVICE = ["traces", "usageEvents"] as const;
