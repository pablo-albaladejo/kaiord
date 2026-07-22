/**
 * Garmin bridge transport for the body-composition upload.
 *
 * Sends the `push-body-composition` action to the garmin-bridge extension with
 * the pre-encoded `weight_scale` FIT bytes (passed as a `number[]` — the bridge
 * `toUint8Array` accepts either a base64 string or a byte array). The bridge
 * uploads to Garmin's upload endpoint on the user's existing session; this layer
 * only transports the request. A 401/403 marks the OAuth session as stale, so the
 * thrown error carries `redetect` for the caller to re-run detection — mirroring
 * `garmin-bridge-operations.executePush`.
 */
import { sendBridgeMessage } from "../bridge/bridge-transport";

const PUSH_BODY_COMPOSITION_TIMEOUT_MS = 15_000;

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
  const res = await sendBridgeMessage(
    extensionId,
    { action: "push-body-composition", fit: Array.from(fitBytes) },
    PUSH_BODY_COMPOSITION_TIMEOUT_MS
  );
  if (!res.ok) {
    const redetect = res.status === 401 || res.status === 403;
    throw new GarminBodyCompositionError(
      res.error ?? "Garmin body-composition upload failed",
      redetect
    );
  }
};
