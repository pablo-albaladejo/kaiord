/**
 * Tanita bridge read transport.
 *
 * Asks the discovered Tanita Bridge for the athlete's MyTANITA export
 * through `request` (protocol 2), reading the raw answer here
 * (connector/read-tanita-export), or through the legacy `read-export-csv`
 * action (protocol 1), and resolves with the raw CSV. The cookie session
 * stays inside the extension; this layer holds no credentials. A dead
 * mytanita.eu session, a bounce or a login page in place of the export,
 * surfaces as `needsReauth`, carried on the thrown `TanitaBridgeError` so the
 * sync use case can prompt a re-login instead of retrying.
 */
import { z } from "zod";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import { callThroughBridge } from "../bridge/thin-bridge-request";
import { readTanitaExport } from "./connector/read-tanita-export";
import { TANITA_EXPORT_PATH } from "./connector/tanita-paths";

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
 * A current extension answers `checkSession` with a `HEAD` of the export, but
 * an older one implements it as a full `GET /en/user/export-csv` and discards
 * the body, re-downloading the athlete's entire MyTANITA history. The App
 * cannot tell which is installed before asking, so this MUST NOT be polled,
 * which is why tanita-bridge is absent from `SESSION_PROBES`.
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
  const res = await callThroughBridge(
    (message) =>
      sendBridgeMessage(extensionId, message, READ_EXPORT_CSV_TIMEOUT_MS),
    {
      method: "GET",
      path: TANITA_EXPORT_PATH,
      legacy: { action: "read-export-csv" },
      read: readTanitaExport,
    }
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
