/**
 * Maps a provider's declared mechanism to its ConnectionProvider adapter,
 * wiring the shared deps (record repository, credential encryption, clock).
 * The only API-key brand today is intervals.icu, so the api-key adapter uses
 * its validator directly.
 */
import type { ConnectionProvider } from "../../application/connections/connection-provider.port";
import type { ConnectionRepository } from "../../application/connections/connection-repository.port";
import type { ConnectionCredentials } from "../../lib/connections/connection-credentials";
import type { ConnectionMechanism } from "../../types/connection";
import { createApiKeyConnectionProvider } from "./api-key-connection-provider";
import { createBridgeConnectionProvider } from "./bridge-connection-provider";
import { validateIntervalsIcuKey } from "./intervals-icu-validate";
import { createNotSupportedConnectionProvider } from "./not-supported-connection-provider";

export type ConnectionProviderDeps = {
  repository: ConnectionRepository;
  credentials: ConnectionCredentials;
  clock: () => string;
};

export const createConnectionProvider = (
  providerId: string,
  mechanism: ConnectionMechanism,
  deps: ConnectionProviderDeps
): ConnectionProvider => {
  if (mechanism === "api-key") {
    return createApiKeyConnectionProvider({
      providerId,
      repository: deps.repository,
      validate: validateIntervalsIcuKey,
      encryptCredential: deps.credentials.encrypt,
      clock: deps.clock,
    });
  }
  if (mechanism === "bridge") {
    return createBridgeConnectionProvider({
      providerId,
      repository: deps.repository,
      clock: deps.clock,
    });
  }
  return createNotSupportedConnectionProvider(providerId);
};
