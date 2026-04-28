/**
 * CoachingSyncStateRecord — staleness tracking per (source, profileId)
 *
 * Stored in a dedicated `coachingSyncState` Dexie table, distinct from the
 * existing bridge-discovery `syncState` table (which is bridge-manifest
 * shaped: extensionId, lastSeen, capabilities, protocolVersion).
 *
 * Primary key is the compound `[source+profileId]`. `lastSyncedAt` is
 * updated UNCONDITIONALLY on a successful sync — including zero-activity
 * responses — so an empty week doesn't keep re-firing the staleness gate.
 */

import { z } from "zod";

export const coachingSyncStateRecordSchema = z.object({
  source: z.string().min(1),
  profileId: z.string().min(1),
  lastSyncedAt: z.iso.datetime(),
});

export type CoachingSyncStateRecord = z.infer<
  typeof coachingSyncStateRecordSchema
>;
