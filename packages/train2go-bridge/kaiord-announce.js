/**
 * Kaiord Train2Go Bridge — Announce Content Script
 *
 * Injected at document_start on SPA origins (*.kaiord.com, localhost).
 * Posts KAIORD_BRIDGE_ANNOUNCE to the page so the SPA can discover the
 * extension ID at runtime. Re-announces on KAIORD_BRIDGE_DISCOVER.
 */

const BRIDGE_ID = "train2go-bridge";
const BRIDGE_NAME = "Train2Go";
const PROTOCOL_VERSION = 1;
const CAPABILITIES = ["read:training-plan"];

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
  window.postMessage(buildAnnouncement(), window.location.origin);
};

const onDiscoverRequest = (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== "KAIORD_BRIDGE_DISCOVER") return;
  announce();
};

window.addEventListener("message", onDiscoverRequest);
announce();

if (typeof module !== "undefined") {
  module.exports = { buildAnnouncement, announce, onDiscoverRequest };
}
