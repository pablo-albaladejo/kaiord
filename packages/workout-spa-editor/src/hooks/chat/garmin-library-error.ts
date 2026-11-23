import {
  FTP_ERRORS,
  MAX_HR_ERRORS,
  PACE_ZONE_ERRORS,
} from "../../application/chat/garmin-library-error-messages";
import { NoActiveExportRouteError } from "../../application/export/execute-workout-push";
import type { PlacementResult } from "../../application/garmin-placement/placement-result";
import { isFtpReason } from "../../types/ftp-unavailable-error";
import { isMaxHrReason } from "../../types/max-hr-unavailable-error";
import { isPaceZonesReason } from "../../types/pace-zones-unavailable-error";
import { GARMIN_BRIDGE_ID } from "../garmin-push-fn";

/** The Phase 1 failures, as the tool's error codes. */
export const libraryError = (result: PlacementResult) => {
  if (result.kind !== "failed") return undefined;
  if (result.reason === "no-export-route") {
    const { message } = new NoActiveExportRouteError(GARMIN_BRIDGE_ID);
    return { error: "no_active_export_route", message };
  }
  if (result.reason === "busy") return { error: "push_in_progress" };
  if (result.reason === "library-push-failed") return { error: "push_failed" };
  if (isPaceZonesReason(result.reason)) return PACE_ZONE_ERRORS[result.reason];
  if (isFtpReason(result.reason)) return FTP_ERRORS[result.reason];
  if (isMaxHrReason(result.reason)) return MAX_HR_ERRORS[result.reason];
  return undefined;
};
