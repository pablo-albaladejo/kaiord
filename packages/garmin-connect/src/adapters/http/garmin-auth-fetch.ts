import { createServiceApiError } from "@kaiord/core";
import type { FetchFn } from "./types";
import type { TokenReader } from "../token/token-manager.types";

const sendRequest = (
  url: string,
  init: RequestInit | undefined,
  token: string,
  fetchFn: FetchFn
): Promise<Response> =>
  fetchFn(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });

const getTokenOrThrow = (reader: TokenReader, msg: string): string => {
  const token = reader.getAccessToken();
  if (!token) throw createServiceApiError(msg, 401);
  return token;
};

const handleNonOk = (res: Response, prefix: string): never => {
  throw createServiceApiError(`${prefix}: ${res.statusText}`, res.status);
};

export const authFetch = async (
  url: string,
  init: RequestInit | undefined,
  reader: TokenReader,
  fetchFn: FetchFn
): Promise<Response> => {
  if (!reader.isAuthenticated()) await reader.refresh();
  const gen = reader.getGeneration();
  const token = getTokenOrThrow(reader, "Not authenticated");
  const res = await sendRequest(url, init, token, fetchFn);

  if (res.status !== 401) {
    if (!res.ok) handleNonOk(res, "API request failed");
    return res;
  }

  if (reader.getGeneration() === gen) await reader.refresh();
  const freshToken = getTokenOrThrow(reader, "Token unavailable after refresh");
  const retry = await sendRequest(url, init, freshToken, fetchFn);
  if (!retry.ok) handleNonOk(retry, "API request failed after token refresh");
  return retry;
};
