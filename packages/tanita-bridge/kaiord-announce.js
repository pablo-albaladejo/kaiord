/**
 * Kaiord Bridge Core — Announce Content Script (vendored)
 *
 * Master: packages/_shared/bridge-core/kaiord-announce.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * Injected at document_start on the exact App origin (kaiord.com; the
 * Vite dev server on localhost in dev builds only),
 * after the per-bridge `bridge-identity.js` (manifest content_scripts
 * order), whose globalThis.KAIORD_BRIDGE_IDENTITY provides id, name,
 * capabilities and, when not 1, the protocol version. Posts KAIORD_BRIDGE_ANNOUNCE to the page so the SPA can
 * discover the extension ID at runtime. Re-announces on
 * KAIORD_BRIDGE_DISCOVER.
 *
 * Resilience to extension reload: when the bridge is updated/reloaded,
 * Chrome terminates this script's runtime context but does NOT remove
 * its window listener (the listener lives in the page, not the
 * extension). A subsequent KAIORD_BRIDGE_DISCOVER would otherwise
 * throw "Extension context invalidated". `isContextValid` short-
 * circuits in that case and detaches the listener so it never throws
 * twice. The new content script gets injected on the next page load
 * (or via the bridge's onInstalled re-inject for tabs covered by
 * host_permissions).
 */

// A bridge that moved to a newer protocol declares it in bridge-identity.js.
const DEFAULT_PROTOCOL_VERSION = 1;

const bridgeIdentity = () => globalThis.KAIORD_BRIDGE_IDENTITY ?? {};

const isContextValid = () => {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
};

const buildAnnouncement = () => {
  const identity = bridgeIdentity();
  return {
    type: "KAIORD_BRIDGE_ANNOUNCE",
    bridgeId: identity.id,
    extensionId: chrome.runtime.id,
    name: identity.name,
    version: chrome.runtime.getManifest().version,
    protocolVersion: identity.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
    capabilities: identity.capabilities,
  };
};

const announce = () => {
  if (!isContextValid()) {
    window.removeEventListener("message", onDiscoverRequest);
    return;
  }
  try {
    window.postMessage(buildAnnouncement(), window.location.origin);
  } catch {
    // Context torn down between the guard and the call — same outcome.
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
  };
}
