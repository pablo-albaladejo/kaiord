import { authFetch } from "./garmin-auth-fetch";
import type { FetchFn, GarminHttpClient } from "./types";
import type { TokenReader } from "../token/token-manager.types";
import type { Logger } from "@kaiord/core";

export type { GarminHttpClient } from "./types";

export const createGarminHttpClient = (
  tokenReader: TokenReader,
  fetchFn: FetchFn,
  logger: Logger
): GarminHttpClient => {
  const fetch = (url: string, init?: RequestInit) =>
    authFetch(url, init, tokenReader, fetchFn);

  logger.debug("HTTP client created");

  return {
    get: async <T>(url: string): Promise<T> => {
      const res = await fetch(url);
      return (await res.json()) as T;
    },
    post: async <T>(url: string, body: unknown): Promise<T> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body !== null ? JSON.stringify(body) : undefined,
      });
      return (await res.json()) as T;
    },
    del: async <T>(url: string): Promise<T> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "X-Http-Method-Override": "DELETE" },
      });
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    },
  };
};
