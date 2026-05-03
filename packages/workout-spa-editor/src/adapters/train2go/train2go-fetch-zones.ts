/**
 * `fetchZones` — adapter glue between the wire-level `readZones` action
 * and the `CoachingTransport.readZones` port. Validates the bridge
 * envelope through `zonesPayloadSchema` so any shape drift surfaces as
 * `null` (never an exception thrown into application code).
 *
 * Defense-in-depth: even though `parseDetailsHtml` already enforces a
 * field allowlist, re-validating here keeps the use case decoupled from
 * the bridge's hand-written parser.
 */
import { readZones } from "../../store/train2go-extension-transport";
import {
  type ZonesPayload,
  zonesPayloadSchema,
} from "../../types/coaching-zones";
import { BRIDGE_QUEUE } from "../bridge/shared-operation-queue";

const buildErr = (error: string | undefined): Error => {
  if (error === "Session expired") return new Error("Session expired");
  return new Error(error ?? "Read details failed");
};

export const fetchZones = async (
  getExtensionId: () => string,
  externalUserId: string,
  signal?: AbortSignal
): Promise<ZonesPayload | null> => {
  const res = await readZones(
    getExtensionId(),
    externalUserId,
    BRIDGE_QUEUE,
    signal
  );
  if (!res.ok) throw buildErr(res.error);
  if (res.data === undefined || res.data === null) return null;
  const parsed = zonesPayloadSchema.safeParse(res.data);
  return parsed.success ? parsed.data : null;
};
