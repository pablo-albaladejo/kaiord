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

const tanitaExportSchema = z.object({ csv: z.string() });

export class TanitaBridgeError extends Error {
  readonly needsReauth: boolean;
  constructor(message: string, needsReauth = false) {
    super(message);
    this.name = "TanitaBridgeError";
    this.needsReauth = needsReauth;
  }
}

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
