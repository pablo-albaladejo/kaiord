import { createServiceApiError } from "@kaiord/core";

import type { TokenReader } from "../token/token-manager.types";
import type { FetchFn } from "./types";

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

const throwHttpError = (response: Response, messagePrefix: string): never => {
  throw createServiceApiError(
    `${messagePrefix}: ${response.statusText}`,
    response.status
  );
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
  const response = await sendRequest(url, init, token, fetchFn);

  if (response.status !== 401) {
    if (!response.ok) throwHttpError(response, "API request failed");
    return response;
  }

  if (reader.getGeneration() === gen) await reader.refresh();
  const freshToken = getTokenOrThrow(reader, "Token unavailable after refresh");
  const retry = await sendRequest(url, init, freshToken, fetchFn);
  if (!retry.ok)
    throwHttpError(retry, "API request failed after token refresh");
  return retry;
};
