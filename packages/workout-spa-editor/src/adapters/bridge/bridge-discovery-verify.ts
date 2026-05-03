/**
 * Bridge Discovery Verification
 *
 * Confirms a bridge announcement is legitimate by pinging the announced
 * extensionId and checking that the returned manifest matches the
 * declared bridgeId and schema. Rejects spoofed announcements.
 */

import type { BridgeManifest } from "../../types/bridge-schemas";
import { bridgeManifestSchema } from "../../types/bridge-schemas";
import type { BridgeAnnouncement } from "./bridge-discovery-types";
import { sendBridgeMessage } from "./bridge-transport";

const SUPPORTED_PROTOCOLS = [1] as const;

/**
 * Verifies an announcement and returns the pinged manifest on success
 * (so callers can stash its capabilities), or `null` on rejection.
 */
export async function verifyAnnouncement(
  announcement: BridgeAnnouncement
): Promise<BridgeManifest | null> {
  const response = await sendBridgeMessage(announcement.extensionId, {
    action: "ping",
  });
  if (!response.ok || !response.data) return null;

  const manifest = bridgeManifestSchema.safeParse(response.data);
  if (!manifest.success) return null;

  if (manifest.data.id !== announcement.bridgeId) return null;
  if (!SUPPORTED_PROTOCOLS.includes(manifest.data.protocolVersion as 1)) {
    return null;
  }
  return manifest.data;
}
