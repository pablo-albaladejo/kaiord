import { useSyncExternalStore } from "react";

import {
  getStaleSchemaVersion,
  onStaleSchema,
} from "../adapters/dexie/stale-schema-guard";

const isStale = (): boolean => getStaleSchemaVersion() !== null;

/** True once this tab's code is older than the installed database. */
export const useStaleSchema = (): boolean =>
  useSyncExternalStore(onStaleSchema, isStale);
