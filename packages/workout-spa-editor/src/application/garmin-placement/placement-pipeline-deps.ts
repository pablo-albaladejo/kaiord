import type { Analytics } from "@kaiord/core";

import type { PlacementDeps } from "./placement-deps";
import type { PlacementJoin } from "./placement-join";
import type { RecordLockPort } from "./record-lock-port";

export type PlacementPipelineDeps = Omit<PlacementDeps, "canFind"> & {
  /** The bridge's ping `features`. */
  features: readonly string[];
  /** Web Locks; `undefined` in a non-secure context or an old browser. */
  locks: RecordLockPort | undefined;
  /** `isSecureContext`: tells an insecure page from an old browser. */
  secureContext: boolean;
  /** In-tab runs by record id, shared by every caller of the tab. */
  joins: Map<string, PlacementJoin>;
  analytics?: Analytics;
};
