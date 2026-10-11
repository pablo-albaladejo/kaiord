/**
 * Checks an API key against the provider's model-listing endpoint. Listing
 * models is free on all three providers, so a key is verified without
 * spending a token. Only an authentication answer means "invalid": a rate
 * limit, an outage or no network says nothing about the key, so those are
 * "unverified" and the caller decides whether to keep the key anyway.
 */
import type { LlmProviderType, ProviderCredential } from "./types";

export type ProviderKeyCheck = "valid" | "invalid" | "unverified";

type Probe = { url: string; headers: Record<string, string> };

const PROBES: Record<LlmProviderType, (apiKey: string) => Probe> = {
  anthropic: (apiKey) => ({
    url: "https://api.anthropic.com/v1/models?limit=1",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
  }),
  openai: (apiKey) => ({
    url: "https://api.openai.com/v1/models",
    headers: { authorization: `Bearer ${apiKey}` },
  }),
  google: (apiKey) => ({
    url: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
    headers: { "x-goog-api-key": apiKey },
  }),
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_BAD_REQUEST = 400;

// Google answers a malformed or unknown key with 400 API_KEY_INVALID rather
// than 401, so a 400 counts only when the body names the key.
const isInvalid = async (response: Response): Promise<boolean> => {
  if (response.status === HTTP_UNAUTHORIZED) return true;
  if (response.status === HTTP_FORBIDDEN) return true;
  if (response.status !== HTTP_BAD_REQUEST) return false;
  const body = await response.text().catch(() => "");
  return body.includes("API_KEY_INVALID");
};

export const verifyProviderKey = async (
  credential: ProviderCredential,
  fetchImpl: typeof fetch = fetch
): Promise<ProviderKeyCheck> => {
  const probe = PROBES[credential.type](credential.apiKey);
  try {
    const response = await fetchImpl(probe.url, {
      method: "GET",
      headers: probe.headers,
    });
    if (response.ok) return "valid";
    return (await isInvalid(response)) ? "invalid" : "unverified";
  } catch {
    return "unverified";
  }
};
