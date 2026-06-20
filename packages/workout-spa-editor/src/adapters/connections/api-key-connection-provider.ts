/**
 * Connection provider for API-key brands (intervals.icu). `connect` validates
 * the key against the provider, encrypts it for at-rest storage, and persists a
 * connected record; an invalid key throws and nothing is stored. `disconnect`
 * deletes the record, removing the encrypted credential. The `validate` and
 * `encryptCredential` deps are injected so the adapter is unit-testable without
 * network or a real passphrase.
 */
import type {
  ConnectInput,
  ConnectionProvider,
} from "../../application/connections/connection-provider.port";
import type { ConnectionRepository } from "../../application/connections/connection-repository.port";
import type { ConnectionRecord } from "../../types/connection";

export type ApiKeyConnectionProviderDeps = {
  providerId: string;
  repository: ConnectionRepository;
  validate: (credential: string) => Promise<boolean>;
  encryptCredential: (plaintext: string) => Promise<string>;
  clock: () => string;
};

export const createApiKeyConnectionProvider = (
  deps: ApiKeyConnectionProviderDeps
): ConnectionProvider => {
  const { providerId, repository, validate, encryptCredential, clock } = deps;
  return {
    providerId,
    status: async (profileId) =>
      (await repository.get(profileId, providerId))?.status ?? "disconnected",

    connect: async ({
      profileId,
      credential,
    }: ConnectInput): Promise<ConnectionRecord> => {
      if (!credential) throw new Error("An API key is required");
      if (!(await validate(credential)))
        throw new Error("The API key was rejected by the provider");
      const record: ConnectionRecord = {
        profileId,
        providerId,
        status: "connected",
        mechanism: "api-key",
        credentialRef: await encryptCredential(credential),
        updatedAt: clock(),
      };
      await repository.put(record);
      return record;
    },

    disconnect: async (profileId) => {
      await repository.delete(profileId, providerId);
    },
  };
};
