/**
 * ConnectionProvider port — the mechanism-specific connect/disconnect surface
 * for one provider. Adapters: `bridge` (Garmin, Train2Go), `api-key`
 * (intervals.icu), and a `not-supported` sentinel (Strava, Wahoo). Each handles
 * its own connection record + credential/linkage; disabling the provider's
 * integration-policy flows is composed on top by the disconnect orchestration.
 */
import type {
  ConnectionRecord,
  ConnectionStatus,
} from "../../types/connection";

export type ConnectInput = {
  profileId: string;
  /** Mechanism-specific secret (e.g. an API key). Absent for bridge providers. */
  credential?: string;
};

export type ConnectionProvider = {
  readonly providerId: string;
  status: (profileId: string) => Promise<ConnectionStatus>;
  connect: (input: ConnectInput) => Promise<ConnectionRecord>;
  disconnect: (profileId: string) => Promise<void>;
};
