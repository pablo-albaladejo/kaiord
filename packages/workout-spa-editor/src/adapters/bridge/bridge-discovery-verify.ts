/**
 * Bridge Discovery Verification
 *
 * Confirms a bridge announcement is legitimate by pinging the announced
 * extensionId and checking that the returned manifest matches the
 * declared bridgeId and schema. Rejects spoofed announcements.
 *
 * The protocol version is deliberately NOT checked here: an extension on
 * another version is still that Kaiord extension. Discovery decides what to do
 * with it (it does not register it, and remembers it as outdated), so the App
 * offers Update rather than Install (#1098).
 */

import type { BridgeManifest } from "../../types/bridge-schemas";
import { bridgeManifestSchema } from "../../types/bridge-schemas";
import type { BridgeAnnouncement } from "./bridge-discovery-types";
import { sendBridgeMessage } from "./bridge-transport";

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
  return manifest.data;
}
