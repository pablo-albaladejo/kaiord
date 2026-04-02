import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Logger, TokenStore } from "@kaiord/core";
import type { OAuth1Token, OAuth2Token } from "../http/types";

vi.mock("../http/cookie-fetch", () => ({
  createCookieFetch: () => {
    throw new Error("createCookieFetch should not be called in tests");
  },
}));

vi.mock("../http/garmin-sso", () => ({
  garminSso: vi.fn(),
}));

vi.mock("../http/oauth-consumer", () => ({
  fetchOAuthConsumer: vi.fn(),
}));

vi.mock("../http/sso-oauth", () => ({
  exchangeOAuth2: vi.fn(),
}));

import { createGarminConnectClient } from "./garmin-connect-client";
import { garminSso } from "../http/garmin-sso";
import { fetchOAuthConsumer } from "../http/oauth-consumer";
import { exchangeOAuth2 } from "../http/sso-oauth";

const OAUTH1: OAuth1Token = {
  oauth_token: "tok_1",
  oauth_token_secret: "sec_1",
};

const OAUTH2: OAuth2Token = {
  access_token: "acc_valid",
  refresh_token: "ref_valid",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token_expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

const createLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createMockStore = (
  data: unknown = null
): TokenStore & { save: ReturnType<typeof vi.fn> } => ({
  save: vi.fn().mockResolvedValue(undefined),
  load: vi.fn().mockResolvedValue(data),
  clear: vi.fn().mockResolvedValue(undefined),
});

const mockFetchOk = (body = {}): typeof globalThis.fetch =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

describe("createGarminConnectClient", () => {
  let logger: Logger;

  beforeEach(() => {
    vi.useFakeTimers();
    logger = createLogger();

    vi.mocked(garminSso).mockResolvedValue({
      oauth1: OAUTH1,
      oauth2: OAUTH2,
    });

    vi.mocked(fetchOAuthConsumer).mockResolvedValue({
      key: "ck",
      secret: "cs",
    });

    vi.mocked(exchangeOAuth2).mockResolvedValue(OAUTH2);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("init", () => {
    it("restores tokens from store and returns restored true", async () => {
      const store = createMockStore({ oauth1: OAUTH1, oauth2: OAUTH2 });
      const client = createGarminConnectClient({
        logger,
        tokenStore: store,
        fetchFn: mockFetchOk(),
      });

      const result = await client.init();

      expect(result).toEqual({ restored: true });
      expect(client.auth.is_authenticated()).toBe(true);
    });

    it("returns restored false when store is empty", async () => {
      const store = createMockStore(null);
      const client = createGarminConnectClient({
        logger,
        tokenStore: store,
        fetchFn: mockFetchOk(),
      });

      const result = await client.init();

      expect(result).toEqual({ restored: false });
      expect(client.auth.is_authenticated()).toBe(false);
    });

    it("returns restored false without tokenStore", async () => {
      const client = createGarminConnectClient({
        logger,
        fetchFn: mockFetchOk(),
      });

      const result = await client.init();

      expect(result).toEqual({ restored: false });
    });
  });

  describe("retry wiring", () => {
    it("retries API calls on 429 when retry options provided", async () => {
      const store = createMockStore({ oauth1: OAUTH1, oauth2: OAUTH2 });
      const apiFetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        } as unknown as Response);

      const client = createGarminConnectClient({
        logger,
        tokenStore: store,
        fetchFn: apiFetch,
        retry: { maxRetries: 2, randomFn: () => 0.5, baseDelay: 100 },
      });
      await client.init();

      const promise = client.service.list();
      await vi.advanceTimersByTimeAsync(5000);
      await promise;

      expect(apiFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("login uses raw fetch (no retry)", () => {
    it("does not retry SSO login on 5xx", async () => {
      const rawFetch = mockFetchOk();
      const client = createGarminConnectClient({
        logger,
        fetchFn: rawFetch,
        retry: { maxRetries: 3, randomFn: () => 0.5, baseDelay: 100 },
      });

      await client.auth.login("user@test.com", "pass123");

      expect(garminSso).toHaveBeenCalledWith(
        "user@test.com",
        "pass123",
        expect.anything(),
        rawFetch
      );
    });
  });
});
