/**
 * Kaiord WHOOP Bridge — Identity
 *
 * The single per-bridge input to the vendored bridge-core masters. Loaded
 * before kaiord-announce.js (manifest content_scripts order). Values MUST
 * match BRIDGE_MANIFEST in background.js — enforced by
 * scripts/check-bridge-core-parity.test.mjs.
 */

globalThis.KAIORD_BRIDGE_IDENTITY = {
  id: "whoop-bridge",
  name: "WHOOP",
  capabilities: ["read:body", "read:sleep"],
};
