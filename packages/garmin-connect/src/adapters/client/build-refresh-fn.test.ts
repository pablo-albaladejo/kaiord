import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";
import type { OAuth1Token, OAuth2Token, OAuthConsumer } from "../http/types";

vi.mock("../http/oauth-consumer", () => ({
  fetchOAuthConsumer: vi.fn(),
}));

vi.mock("../http/sso-oauth", () => ({
  exchangeOAuth2: vi.fn(),
}));

import { buildRefreshFn } from "./build-refresh-fn";
import { fetchOAuthConsumer } from "../http/oauth-consumer";
import { exchangeOAuth2 } from "../http/sso-oauth";

const OAUTH1: OAuth1Token = {
  oauth_token: "tok_1",
  oauth_token_secret: "sec_1",
};

const CONSUMER: OAuthConsumer = { key: "ck", secret: "cs" };

const OAUTH2: OAuth2Token = {
  access_token: "acc_valid",
  refresh_token: "ref_valid",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token_expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

const mockFetch: typeof globalThis.fetch = vi.fn();

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("buildRefreshFn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("caches consumer: fetchOAuthConsumer called only once for two refreshes", async () => {
    vi.mocked(fetchOAuthConsumer).mockResolvedValue(CONSUMER);
    vi.mocked(exchangeOAuth2).mockResolvedValue(OAUTH2);

    const refreshFn = buildRefreshFn(mockFetch, mockLogger);

    await refreshFn(OAUTH1);
    await refreshFn(OAUTH1);

    expect(fetchOAuthConsumer).toHaveBeenCalledTimes(1);
    expect(exchangeOAuth2).toHaveBeenCalledTimes(2);
    expect(exchangeOAuth2).toHaveBeenCalledWith(
      OAUTH1,
      CONSUMER,
      mockFetch,
      mockLogger
    );
  });

  it("clears consumer cache on failure and re-fetches on retry", async () => {
    const freshConsumer: OAuthConsumer = {
      key: "ck_new",
      secret: "cs_new",
    };

    vi.mocked(exchangeOAuth2)
      .mockRejectedValueOnce(new Error("consumer rejected"))
      .mockResolvedValueOnce(OAUTH2);

    vi.mocked(fetchOAuthConsumer)
      .mockResolvedValueOnce(CONSUMER)
      .mockResolvedValueOnce(freshConsumer);

    const refreshFn = buildRefreshFn(mockFetch, mockLogger);

    const result = await refreshFn(OAUTH1);

    expect(fetchOAuthConsumer).toHaveBeenCalledTimes(2);
    expect(exchangeOAuth2).toHaveBeenCalledTimes(2);
    expect(exchangeOAuth2).toHaveBeenLastCalledWith(
      OAUTH1,
      freshConsumer,
      mockFetch,
      mockLogger
    );
    expect(result).toEqual(OAUTH2);
  });
});
