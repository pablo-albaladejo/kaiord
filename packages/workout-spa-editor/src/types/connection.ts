/**
 * Connection records — per-(profile, provider) account-linkage state for the
 * Athlete Connections section. Distinct from `IntegrationPolicy` (which governs
 * individual import/export flows): a record here means "this account is linked".
 *
 * Stored device-local (excluded from the cloud snapshot) so provider
 * credentials never reach remote storage. `credentialRef` holds an AES-GCM
 * encrypted credential blob (e.g. an intervals.icu API key); bridge and
 * not-supported providers carry no credential.
 */

import { z } from "zod";

export const connectionStatusSchema = z.enum([
  "connected",
  "disconnected",
  "not-supported",
]);

export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

export const connectionMechanismSchema = z.enum([
  "bridge",
  "api-key",
  "not-supported",
]);

export type ConnectionMechanism = z.infer<typeof connectionMechanismSchema>;

export const connectionRecordSchema = z.object({
  profileId: z.string().min(1),
  providerId: z.string().min(1),
  status: connectionStatusSchema,
  mechanism: connectionMechanismSchema,
  /** AES-GCM encrypted credential blob; absent for bridge/not-supported. */
  credentialRef: z.string().optional(),
  updatedAt: z.iso.datetime(),
});

export type ConnectionRecord = z.infer<typeof connectionRecordSchema>;
