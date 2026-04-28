/**
 * Helpers extracted from attempt-link.ts to keep the use-case file
 * under the lint-enforced size limit.
 */

import type { ProfileRepository } from "../../ports/persistence-port";
import { ProfileNotFoundError } from "../profile/errors";
import type {
  CoachingPingResult,
  CoachingTransport,
} from "./coaching-transport-port";
import { linkAccount } from "./link-account";

export type Aborted = { ok: false; reason: "aborted" };
export type TransportError = {
  ok: false;
  reason: "transport-error";
  error?: string;
};

export const aborted = (): Aborted => ({ ok: false, reason: "aborted" });

export const transportError = (err: unknown): TransportError => ({
  ok: false,
  reason: "transport-error",
  error: err instanceof Error ? err.message : String(err),
});

export const safeOpenExternal = async (
  transport: CoachingTransport,
  signal?: AbortSignal
): Promise<TransportError | null> => {
  try {
    await transport.openExternal();
    return null;
  } catch (err) {
    if (signal?.aborted) return null;
    return transportError(err);
  }
};

export const persistLinkOrDeleted = async (
  profiles: ProfileRepository,
  transport: CoachingTransport,
  targetProfileId: string,
  ping: CoachingPingResult,
  now: string
): Promise<{ ok: true } | { ok: false; reason: "profile-deleted" }> | never => {
  try {
    await linkAccount(profiles, targetProfileId, {
      source: transport.source,
      externalUserId: ping.externalUserId!,
      externalUserName: ping.externalUserName!,
      linkedAt: now,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof ProfileNotFoundError) {
      return { ok: false, reason: "profile-deleted" };
    }
    throw err;
  }
};
