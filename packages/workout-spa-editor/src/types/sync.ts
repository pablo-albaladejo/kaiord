/**
 * Sync Domain - Types Barrel
 *
 * Re-exports schemas covering bridge handshakes (capabilities, manifests,
 * sync-state records) and usage telemetry persisted alongside sync flows.
 */

// ============================================
// Bridge Schemas
// ============================================

export type {
  BridgeCapability,
  BridgeErrorResponse,
  BridgeManifest,
  SyncState,
} from "./bridge-schemas";
export {
  bridgeCapabilitySchema,
  bridgeErrorResponseSchema,
  bridgeManifestSchema,
  syncStateSchema,
} from "./bridge-schemas";

// ============================================
// Usage Schemas
// ============================================

export type { UsageEntry, UsageRecord } from "./usage-schemas";
export { usageEntrySchema, usageRecordSchema } from "./usage-schemas";
