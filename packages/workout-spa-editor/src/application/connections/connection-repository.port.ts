/**
 * Persistence port for per-(profile, provider) connection records. Keyed by the
 * composite `[profileId+providerId]`; `getByProfile` backs the live UI read and
 * the profile-delete cascade.
 */
import type { ConnectionRecord } from "../../types/connection";

export type ConnectionRepository = {
  getByProfile: (profileId: string) => Promise<ConnectionRecord[]>;
  get: (
    profileId: string,
    providerId: string
  ) => Promise<ConnectionRecord | undefined>;
  put: (record: ConnectionRecord) => Promise<void>;
  delete: (profileId: string, providerId: string) => Promise<void>;
  /** Profile-delete cascade: remove every connection for the profile. */
  deleteByProfile: (profileId: string) => Promise<void>;
};
