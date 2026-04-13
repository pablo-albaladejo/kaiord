/**
 * Bridge Schemas
 *
 * Zod schemas for bridge capability manifest, error response,
 * and sync state record.
 */

import { z } from "zod";

export const bridgeCapabilitySchema = z.enum([
  "read:workouts",
  "write:workouts",
  "read:body",
  "read:sleep",
  "read:training-plan",
]);

export type BridgeCapability = z.infer<typeof bridgeCapabilitySchema>;

export const bridgeManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  protocolVersion: z.number().int().positive(),
  capabilities: z.array(bridgeCapabilitySchema),
});

export type BridgeManifest = z.infer<typeof bridgeManifestSchema>;

export const bridgeErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  retryable: z.boolean().optional(),
});

export type BridgeErrorResponse = z.infer<typeof bridgeErrorResponseSchema>;

export const syncStateSchema = z.object({
  source: z.string(),
  extensionId: z.string(),
  lastSeen: z.iso.datetime(),
  capabilities: z.array(bridgeCapabilitySchema),
  protocolVersion: z.number().int().positive(),
});

export type SyncState = z.infer<typeof syncStateSchema>;
