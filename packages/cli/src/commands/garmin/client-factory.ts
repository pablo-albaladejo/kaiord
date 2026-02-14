import type { Logger } from "@kaiord/core";
import {
  createGarminConnectClient,
  createFileTokenStore,
} from "@kaiord/garmin-connect";

export const createCliGarminClient = async (logger: Logger) => {
  const tokenStore = createFileTokenStore();
  const client = createGarminConnectClient({ logger, tokenStore });

  const stored = await tokenStore.load();
  if (stored) {
    await client.auth.restore_tokens(stored);
  }

  return client;
};
