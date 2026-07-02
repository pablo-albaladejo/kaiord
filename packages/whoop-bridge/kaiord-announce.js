/**
 * Kaiord WHOOP Bridge — Announce Content Script
 *
 * Injected at document_start on SPA origins (*.kaiord.com, localhost).
 * Posts KAIORD_BRIDGE_ANNOUNCE so the SPA can discover the extension ID at
 * runtime. Re-announces on KAIORD_BRIDGE_DISCOVER. Mirrors garmin-bridge's
 * announce script exactly; only the identity + capabilities differ.
 *
 * Capabilities use the existing bridge vocabulary (types/bridge-schemas.ts):
 * `read:body` gates the Recovery/HRV import flow, `read:sleep` gates Sleep.
 */

const BRIDGE_ID = "whoop-bridge";
const BRIDGE_NAME = "WHOOP";
const PROTOCOL_VERSION = 1;
const CAPABILITIES = ["read:body", "read:sleep"];

const isContextValid = () => {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
};

const buildAnnouncement = () => ({
  type: "KAIORD_BRIDGE_ANNOUNCE",
  bridgeId: BRIDGE_ID,
  extensionId: chrome.runtime.id,
  name: BRIDGE_NAME,
  version: chrome.runtime.getManifest().version,
  protocolVersion: PROTOCOL_VERSION,
  capabilities: CAPABILITIES,
});

const announce = () => {
  if (!isContextValid()) {
    window.removeEventListener("message", onDiscoverRequest);
    return;
  }
  try {
    window.postMessage(buildAnnouncement(), window.location.origin);
  } catch {
    window.removeEventListener("message", onDiscoverRequest);
  }
};

const onDiscoverRequest = (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== "KAIORD_BRIDGE_DISCOVER") return;
  announce();
};

window.addEventListener("message", onDiscoverRequest);
announce();

if (typeof module !== "undefined") {
  module.exports = {
    buildAnnouncement,
    announce,
    onDiscoverRequest,
    isContextValid,
    CAPABILITIES,
  };
}
