/**
 * Page-side announce for the Garmin bridge stub: the SPA discovers the
 * extension from a `KAIORD_BRIDGE_ANNOUNCE` window message, posted on boot
 * and on every `KAIORD_BRIDGE_DISCOVER`.
 */
import type { GarminStubScriptArgs } from "./garmin-bridge-stub-page-script";

/** Announces the stub bridge on boot and on every discovery request. */
export const installGarminAnnounceScript = (
  args: Pick<GarminStubScriptArgs, "extensionId" | "bridgeId" | "caps">
): void => {
  const ann = {
    type: "KAIORD_BRIDGE_ANNOUNCE",
    bridgeId: args.bridgeId,
    extensionId: args.extensionId,
    id: args.bridgeId,
    name: "Garmin (stub)",
    version: "0.0.0-stub",
    protocolVersion: 1,
    capabilities: args.caps,
  };
  const post = (): void => void window.postMessage(ann, "*");
  window.addEventListener("message", (e: MessageEvent) => {
    if (
      e.source === window &&
      (e.data as { type?: string } | null)?.type === "KAIORD_BRIDGE_DISCOVER"
    )
      post();
  });
  for (const delayMs of [0, 250, 500, 1000, 2000, 4000, 6000])
    setTimeout(post, delayMs);
};
