import { CALENDAR_WRITE_FEATURE } from "../../../application/garmin-placement/placement-timing";
import { useGarminBridge } from "../../../contexts";

export type UpdateGarminReason = "noExtension" | "signedOut" | "bridgeOutdated";

/**
 * Why Update Garmin is unavailable, or `undefined` when it can run. The
 * move needs the calendar write a bridge without `calendar-write-v1` lacks,
 * so an outdated bridge disables it rather than sending to the library only.
 */
export const useUpdateGarminReason = (): UpdateGarminReason | undefined => {
  const { extensionInstalled, sessionActive, features } = useGarminBridge();
  if (!extensionInstalled) return "noExtension";
  if (!sessionActive) return "signedOut";
  if (!features.includes(CALENDAR_WRITE_FEATURE)) return "bridgeOutdated";
  return undefined;
};
