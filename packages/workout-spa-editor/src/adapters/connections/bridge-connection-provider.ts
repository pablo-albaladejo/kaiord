/**
 * Connection provider for the Chrome-extension bridges (Garmin, Train2Go).
 * Tracks local account linkage as a connection record. The SPA cannot force a
 * sign-out inside the extension, so `disconnect` clears the local linkage
 * (record → `disconnected`); the caller also disables the provider's flows.
 */
import type {
  ConnectInput,
  ConnectionProvider,
} from "../../application/connections/connection-provider.port";
import type { ConnectionRepository } from "../../application/connections/connection-repository.port";
import type { ConnectionRecord } from "../../types/connection";

export type BridgeConnectionProviderDeps = {
  providerId: string;
  repository: ConnectionRepository;
  clock: () => string;
};

export const createBridgeConnectionProvider = (
  deps: BridgeConnectionProviderDeps
): ConnectionProvider => {
  const { providerId, repository, clock } = deps;
  return {
    providerId,
    status: async (profileId) =>
      (await repository.get(profileId, providerId))?.status ?? "disconnected",

    connect: async ({ profileId }: ConnectInput): Promise<ConnectionRecord> => {
      const record: ConnectionRecord = {
        profileId,
        providerId,
        status: "connected",
        mechanism: "bridge",
        updatedAt: clock(),
      };
      await repository.put(record);
      return record;
    },

    disconnect: async (profileId) => {
      await repository.put({
        profileId,
        providerId,
        status: "disconnected",
        mechanism: "bridge",
        updatedAt: clock(),
      });
    },
  };
};
