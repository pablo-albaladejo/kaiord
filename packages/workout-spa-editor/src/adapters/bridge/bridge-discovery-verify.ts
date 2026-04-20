/**
 * Bridge Discovery Verification
 *
 * Confirms a bridge announcement is legitimate by pinging the announced
 * extensionId and checking that the returned manifest matches the
 * declared bridgeId and schema. Rejects spoofed announcements.
 */

import { bridgeManifestSchema } from "../../types/bridge-schemas";
import type { BridgeAnnouncement } from "./bridge-discovery-types";
import { sendBridgeMessage } from "./bridge-transport";

const SUPPORTED_PROTOCOLS = [1] as const;

export async function verifyAnnouncement(
  announcement: BridgeAnnouncement
): Promise<boolean> {
  const response = await sendBridgeMessage(announcement.extensionId, {
    action: "ping",
  });
  if (!response.ok || !response.data) return false;

  const manifest = bridgeManifestSchema.safeParse(response.data);
  if (!manifest.success) return false;

  if (manifest.data.id !== announcement.bridgeId) return false;
  if (!SUPPORTED_PROTOCOLS.includes(manifest.data.protocolVersion as 1)) {
    return false;
  }
  return true;
}
