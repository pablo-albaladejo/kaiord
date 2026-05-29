/**
 * LinkedCoachingAccount Types and Schemas
 *
 * Defines the link between a Kaiord Profile and an external coaching
 * platform (Train2Go today, TrainingPeaks/others later). At most one
 * entry per `source` per profile.
 *
 * `source` is compared case-sensitively as a canonical lowercase ASCII
 * identifier ("train2go"). Mappers MUST emit the canonical form.
 *
 * `externalUserId` is stored as `string` and MUST be captured at the
 * JSON parse boundary in the platform-specific transport adapter
 * (never `String(parsedNumber)` — lossy for ids above MAX_SAFE_INTEGER).
 *
 * `lastSyncedZonesSnapshot` (added in v9) captures the post-mapper
 * Kaiord-domain zones + threshold scalars from the most recent
 * successful T2G sync. Used by the zone-table classifier to detect
 * "user edited zones since last sync" without per-zone tracking.
 */

import { z } from "zod";

import type { Profile } from "./profile";
import { heartRateZoneSchema, powerZoneSchema } from "./zone-schemas";

const paceZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  name: z.string().min(1).max(50),
  minPace: z.number().min(0),
  maxPace: z.number().min(0),
  unit: z.enum(["min_per_km", "min_per_100m"]),
});

export const lastSyncedZonesSnapshotSchema = z.object({
  syncedAt: z.iso.datetime(),
  cyclingHr: z.array(heartRateZoneSchema).length(5),
  runningHr: z.array(heartRateZoneSchema).length(5),
  swimmingHr: z.array(heartRateZoneSchema).length(5),
  cyclingPower: z.array(powerZoneSchema).length(5),
  runningPace: z.array(paceZoneSchema).length(5),
  swimmingPace: z.array(paceZoneSchema).length(5),
  bodyWeight: z.number().positive().optional(),
  maxHeartRate: z.number().int().positive().max(250).optional(),
  cyclingFtp: z.number().int().positive().optional(),
  cyclingLthr: z.number().int().positive().max(250).optional(),
  runningLthr: z.number().int().positive().max(250).optional(),
  runningThresholdPace: z.number().positive().optional(),
  swimmingCss: z.number().positive().optional(),
});

export type LastSyncedZonesSnapshot = z.infer<
  typeof lastSyncedZonesSnapshotSchema
>;

// 'syncZones' removed in v17 — superseded by IntegrationPolicy(dataType='training-zones', direction='import'). Dexie column retained nullable as rollback buffer; full drop in v18 (F-4).
export const linkedCoachingAccountSchema = z.object({
  source: z.string().min(1),
  externalUserId: z.string().min(1),
  externalUserName: z.string().min(1),
  linkedAt: z.iso.datetime(),
  lastSyncedZonesSnapshot: lastSyncedZonesSnapshotSchema.optional(),
});

export type LinkedCoachingAccount = z.infer<typeof linkedCoachingAccountSchema>;

/**
 * Adds or replaces a linked coaching account on a Profile.
 *
 * One-entry-per-source invariant: an existing entry with the same `source`
 * is replaced. Source comparison is case-sensitive. Returns a new Profile;
 * does not mutate the input.
 */
export function linkCoachingAccount(
  profile: Profile,
  account: LinkedCoachingAccount
): Profile {
  const others = profile.linkedAccounts.filter(
    (a) => a.source !== account.source
  );
  return { ...profile, linkedAccounts: [...others, account] };
}

/**
 * Removes a linked coaching account by source. No-op if not present.
 * Returns a new Profile; does not mutate the input.
 *
 * Atomic snapshot removal: the per-account `lastSyncedZonesSnapshot`
 * is removed alongside the account record (it lives on `linkedAccounts[i]`,
 * so removing the entry removes the snapshot — no orphan data).
 */
export function unlinkCoachingAccount(
  profile: Profile,
  source: string
): Profile {
  const linkedAccounts = profile.linkedAccounts.filter(
    (a) => a.source !== source
  );
  return { ...profile, linkedAccounts };
}
