/**
 * Tanita bridge read transport.
 *
 * Relays a `{ action: "read-export-csv" }` message to the discovered
 * tanita-bridge extension and resolves with the raw MyTANITA export CSV. The
 * cookie session stays inside the extension; this layer holds no credentials
 * and only transports + validates the `{ csv }` envelope. A dead mytanita.eu
 * session surfaces as `{ ok: false, needsReauth: true }` on the envelope; that
 * flag is carried on the thrown `TanitaBridgeError` so the sync use case can
 * prompt a re-login instead of retrying. Modeled on `whoop-transport.ts`.
 */
import { z } from "zod";

import { sendBridgeMessage } from "../bridge/bridge-transport";

const READ_EXPORT_CSV_TIMEOUT_MS = 30_000;
const CHECK_SESSION_TIMEOUT_MS = 5_000;

const tanitaExportSchema = z.object({ csv: z.string() });

// The bridge answers `checkSession` with its whole BRIDGE_MANIFEST plus this
// key; the non-strict object drops the manifest noise.
const tanitaSessionSchema = z.object({ authenticated: z.boolean() });

export type TanitaSession = z.infer<typeof tanitaSessionSchema>;

export class TanitaBridgeError extends Error {
  readonly needsReauth: boolean;
  constructor(message: string, needsReauth = false) {
    super(message);
    this.name = "TanitaBridgeError";
    this.needsReauth = needsReauth;
  }
}

/**
 * EXPENSIVE — the bridge implements `checkSession` as a full
 * `GET /en/user/export-csv` and discards the body, so every call re-downloads
 * the user's entire MyTANITA history. Call it only on an explicit user action
 * (connect, manual import). It MUST NOT be polled, which is why tanita-bridge
 * is absent from `SESSION_PROBES`.
 */
export const checkTanitaSession = async (
  extensionId: string
): Promise<TanitaSession> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "checkSession" },
    CHECK_SESSION_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new TanitaBridgeError(
      res.error ?? "Tanita session check failed",
      res.needsReauth === true
    );
  }
  const parsed = tanitaSessionSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new TanitaBridgeError("Malformed Tanita session response");
  }
  return parsed.data;
};

export const readTanitaExportCsv = async (
  extensionId: string
): Promise<string> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-export-csv" },
    READ_EXPORT_CSV_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new TanitaBridgeError(
      res.error ?? "Tanita bridge read failed",
      res.needsReauth === true
    );
  }
  const parsed = tanitaExportSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new TanitaBridgeError("Malformed Tanita bridge response");
  }
  return parsed.data.csv;
};
