import {
  TOAST_ZONES_FETCH_FAILED,
  TOAST_ZONES_SHAPE_MISMATCH,
  TOAST_ZONES_UNSUPPORTED,
} from "../../application/coaching/sync-zones-toasts";
import type { useToast } from "../../hooks/use-toast";

/** The toast a failed zones sync shows, by failure reason. */
export const handleFailure = (
  reason: string,
  toasts: ReturnType<typeof useToast>
): void => {
  if (reason === "transport-error") toasts.error(TOAST_ZONES_FETCH_FAILED);
  else if (reason === "shape-mismatch")
    toasts.warning(TOAST_ZONES_SHAPE_MISMATCH);
  else if (reason === "unsupported") toasts.info(TOAST_ZONES_UNSUPPORTED);
};
