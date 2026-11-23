/**
 * Kaiord Train2Go Bridge — Identity
 *
 * The single per-bridge input to the vendored bridge-core masters. Loaded
 * before kaiord-announce.js (manifest content_scripts order). Values MUST
 * match BRIDGE_MANIFEST in background.js — enforced by
 * scripts/check-bridge-core-parity.test.mjs (protocolVersion by
 * test/thin-bridge.test.js).
 */

globalThis.KAIORD_BRIDGE_IDENTITY = {
  id: "train2go-bridge",
  name: "Train2Go",
  capabilities: ["read:training-plan", "read:training-zones", "read:body"],
  protocolVersion: 2,
};
