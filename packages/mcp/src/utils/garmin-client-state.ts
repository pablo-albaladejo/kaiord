import type { Logger } from "@kaiord/core";
import {
  createGarminConnectClient,
  createMemoryTokenStore,
} from "@kaiord/garmin-connect";

type GarminClient = ReturnType<typeof createGarminConnectClient>;

let instance: GarminClient | null = null;

export const getGarminClient = (logger: Logger): GarminClient => {
  if (!instance) {
    const tokenStore = createMemoryTokenStore();
    instance = createGarminConnectClient({ logger, tokenStore });
  }
  return instance;
};

export const resetGarminClient = (): void => {
  instance = null;
};
