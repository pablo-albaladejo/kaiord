import type { Logger } from "@kaiord/core";
import {
  createGarminConnectClient,
  createFileTokenStore,
} from "@kaiord/garmin-connect";

export const createCliGarminClient = async (logger: Logger) => {
  const tokenStore = createFileTokenStore();
  const client = createGarminConnectClient({ logger, tokenStore });

  await client.init();

  return client;
};
