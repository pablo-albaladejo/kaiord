// The one sanctioned React.lazy: every other lazy component goes through here.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { lazy } from "react";

import { trackLeaveDuring } from "./lib/leave-tracking";

/**
 * `React.lazy` whose import is watched for a leave while it is in flight, so
 * stale-chunk recovery can tell a cancelled import from a stale one (see
 * `leave-tracking`). Every lazy component goes through here.
 */
export const lazyPage: typeof lazy = (load) =>
  lazy(() => trackLeaveDuring(load));
