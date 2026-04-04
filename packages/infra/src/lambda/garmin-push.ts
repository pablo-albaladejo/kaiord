import type { KRD } from "@kaiord/core";
import {
  createGarminConnectClient,
  createMemoryTokenStore,
} from "@kaiord/garmin-connect";
import { proxyFetch } from "./proxy-fetch";

export type GarminCredentials = {
  username: string;
  password: string;
};

export type PushResultResponse = {
  id: string;
  name: string;
  url: string;
};

export const pushToGarmin = async (
  krd: KRD,
  credentials: GarminCredentials
): Promise<PushResultResponse> => {
  const tokenStore = createMemoryTokenStore();
  const fetchFn = process.env.TS_SECRET_API_KEY ? proxyFetch : undefined;
  const { auth, service } = createGarminConnectClient({
    tokenStore,
    ...(fetchFn ? { fetchFn } : {}),
  });

  await auth.login(credentials.username, credentials.password);

  const result = await service.push(krd);

  await auth.logout();

  return {
    id: String(result.id),
    name: result.name,
    url: result.url ?? `https://connect.garmin.com/modern/workout/${result.id}`,
  };
};
