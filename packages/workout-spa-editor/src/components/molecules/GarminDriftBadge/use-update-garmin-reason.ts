import type { ConnectionState } from "../../../application/connections/connection-state";
import { CALENDAR_WRITE_FEATURE } from "../../../application/garmin-placement/placement-timing";
import { useGarminBridge } from "../../../contexts";

/**
 * Why Update Garmin is unavailable, as the Garmin Connection's state, or
 * `undefined` when it can run. The move needs the calendar write a bridge
 * without `calendar-write-v1` lacks, so that bridge is "outdated": its fix is
 * Update, the same notice every other surface shows for an old extension.
 */
export const useUpdateGarminReason = (): ConnectionState | undefined => {
  const { connection, features } = useGarminBridge();
  if (connection !== "working") return connection;
  if (!features.includes(CALENDAR_WRITE_FEATURE)) return "outdated";
  return undefined;
};
