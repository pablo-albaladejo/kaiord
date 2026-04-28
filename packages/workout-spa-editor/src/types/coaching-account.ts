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
 */

import { z } from "zod";

import type { Profile } from "./profile";

export const linkedCoachingAccountSchema = z.object({
  source: z.string().min(1),
  externalUserId: z.string().min(1),
  externalUserName: z.string().min(1),
  linkedAt: z.iso.datetime(),
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
