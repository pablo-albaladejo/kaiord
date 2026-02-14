import fetchCookie from "fetch-cookie";

export const createCookieFetch = (): typeof globalThis.fetch =>
  fetchCookie(globalThis.fetch) as typeof globalThis.fetch;
