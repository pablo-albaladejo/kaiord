/**
 * Ping-based session probers for the two bridges whose `ping` payload
 * already carries the session flag (garmin: `gcApi.ok`, train2go:
 * `sessionActive`).
 *
 * The checks are replicated here rather than imported from
 * `store/train2go-detect` or `hooks/garmin-bridge-operations`: the SPA
 * boundary rules forbid `adapters/**` importing `store/**` or `hooks/**`,
 * and these probers must stay side-effect free (they only report, they
 * never touch a Zustand store or a linked account).
 */
import { z } from "zod";

import {
  active,
  inactive,
  outdatedExtension,
  type SessionProbeResult,
} from "./bridge-session-probe-types";
import { sendBridgeMessage } from "./bridge-transport";

const PING_TIMEOUT_MS = 2_000;
const SUPPORTED_PROTOCOL_VERSION = 1;

const pingDataSchema = z.object({
  protocolVersion: z.number().optional(),
  gcApi: z.object({ ok: z.boolean().optional() }).optional(),
  sessionActive: z.boolean().optional(),
});

type PingData = z.infer<typeof pingDataSchema>;

const probeByPing = async (
  extensionId: string,
  outdatedMessage: string,
  readSession: (data: PingData) => boolean
): Promise<SessionProbeResult> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "ping" },
    PING_TIMEOUT_MS
  );
  if (!res.ok) return inactive();
  const parsed = pingDataSchema.safeParse(res.data);
  const data: PingData = parsed.success ? parsed.data : {};
  if (data.protocolVersion !== SUPPORTED_PROTOCOL_VERSION) {
    return outdatedExtension(outdatedMessage);
  }
  return readSession(data) ? active() : inactive();
};

export const probeGarminSession = (
  extensionId: string
): Promise<SessionProbeResult> =>
  probeByPing(
    extensionId,
    "Update your Kaiord Garmin Bridge extension",
    (data) => data.gcApi?.ok === true
  );

export const probeTrain2GoSession = (
  extensionId: string
): Promise<SessionProbeResult> =>
  probeByPing(
    extensionId,
    "Update your Kaiord Train2Go Bridge extension",
    (data) => data.sessionActive === true
  );
