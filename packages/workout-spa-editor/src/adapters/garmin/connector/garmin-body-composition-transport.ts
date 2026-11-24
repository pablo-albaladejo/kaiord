/**
 * Garmin bridge transport for the body-composition upload.
 *
 * Sends the pre-encoded `weight_scale` FIT bytes (a `number[]`) as the body of
 * the upload request of the Garmin Bridge's closed list (protocol 2), or as
 * the legacy `push-body-composition` action (protocol 1). The extension wraps
 * them in a multipart file on the athlete's existing session. A 401/403 marks the OAuth session as stale, so the
 * thrown error carries `redetect` for the caller to re-run detection — mirroring
 * `garmin-bridge-operations.executePush`.
 */
import { SPA_ACTION_TIMEOUT_MS } from "../../../application/garmin-placement/placement-timing";
import { answerOrThrow, callConnector } from "../../bridge/connector-call";
import { GARMIN_UPLOAD_PATH } from "./garmin-paths";
import { readNothing } from "./read-garmin-answers";

// Longer than the extension's own deadline on a write.
const PUSH_BODY_COMPOSITION_TIMEOUT_MS = SPA_ACTION_TIMEOUT_MS;

export class GarminBodyCompositionError extends Error {
  readonly redetect: boolean;
  constructor(message: string, redetect = false) {
    super(message);
    this.name = "GarminBodyCompositionError";
    this.redetect = redetect;
  }
}

export const pushGarminBodyComposition = async (
  extensionId: string,
  fitBytes: Uint8Array
): Promise<void> => {
  const fit = Array.from(fitBytes);
  const res = await callConnector(
    extensionId,
    {
      method: "POST",
      path: GARMIN_UPLOAD_PATH,
      body: fit,
      legacy: { action: "push-body-composition", fit },
      read: readNothing,
    },
    PUSH_BODY_COMPOSITION_TIMEOUT_MS
  );
  answerOrThrow(
    res,
    "Garmin body-composition upload failed",
    (failure) =>
      new GarminBodyCompositionError(failure.message, failure.redetect)
  );
};
