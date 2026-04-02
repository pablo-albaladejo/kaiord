import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceApiError } from "@kaiord/core";
import { createTokenManager } from "./token-manager";
import type { Logger, TokenStore } from "@kaiord/core";
import type { OAuth1Token, OAuth2Token } from "../http/types";
import type { RefreshFn } from "./token-manager.types";

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

const expiredOAuth2 = (): OAuth2Token => ({
  ...OAUTH2,
  access_token: "acc_expired",
  expires_at: Math.floor(Date.now() / 1000) - 100,
});

const refreshedOAuth2 = (): OAuth2Token => ({
  ...OAUTH2,
  access_token: "acc_refreshed",
  expires_at: Math.floor(Date.now() / 1000) + 7200,
});

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

describe("createTokenManager", () => {
  let logger: Logger;
  let refreshFn: RefreshFn;

  beforeEach(() => {
    logger = createLogger();
    refreshFn = vi.fn().mockResolvedValue(refreshedOAuth2());
  });

  describe("state encapsulation", () => {
    it("returns no mutable state properties", () => {
      const tm = createTokenManager({ refreshFn, logger });
      const keys = Object.keys(tm);
      expect(keys).not.toContain("oauth1");
      expect(keys).not.toContain("oauth2");
      expect(keys).not.toContain("generation");
    });
  });

  describe("token generation counter", () => {
    it("increments on setTokens", async () => {
      const tm = createTokenManager({ refreshFn, logger });
      expect(tm.getGeneration()).toBe(0);

      await tm.setTokens(OAUTH1, OAUTH2);
      expect(tm.getGeneration()).toBe(1);

      await tm.setTokens(OAUTH1, OAUTH2);
      expect(tm.getGeneration()).toBe(2);
    });

    it("increments on refresh", async () => {
      const tm = createTokenManager({ refreshFn, logger });
      await tm.setTokens(OAUTH1, OAUTH2);
      const genBefore = tm.getGeneration();

      await tm.refresh();
      expect(tm.getGeneration()).toBe(genBefore + 1);
    });
  });

  describe("setTokens", () => {
    it("persists to tokenStore", async () => {
      const store = createMockStore();
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      await tm.setTokens(OAUTH1, OAUTH2);

      expect(store.save).toHaveBeenCalledWith({
        oauth1: OAUTH1,
        oauth2: OAUTH2,
      });
    });

    it("logs warning on persist failure without propagating", async () => {
      const store = createMockStore();
      store.save.mockRejectedValue(new Error("disk full"));
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      await expect(tm.setTokens(OAUTH1, OAUTH2)).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        "Failed to persist tokens",
        expect.objectContaining({ errorName: "Error" })
      );
    });
  });

  describe("refresh", () => {
    it("delegates to refreshFn and updates token", async () => {
      const tm = createTokenManager({ refreshFn, logger });
      await tm.setTokens(OAUTH1, OAUTH2);

      await tm.refresh();

      expect(refreshFn).toHaveBeenCalledWith(OAUTH1);
      expect(tm.getAccessToken()).toBe("acc_refreshed");
    });

    it("persists refreshed tokens to store", async () => {
      const store = createMockStore();
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });
      await tm.setTokens(OAUTH1, OAUTH2);

      await tm.refresh();

      expect(store.save).toHaveBeenCalledTimes(2);
    });

    it("throws ServiceApiError without OAuth1 token", async () => {
      const tm = createTokenManager({ refreshFn, logger });

      await expect(tm.refresh()).rejects.toThrow(ServiceApiError);
      expect(refreshFn).not.toHaveBeenCalled();
    });

    it("throws ServiceApiError after clearTokens", async () => {
      const tm = createTokenManager({ refreshFn, logger });
      await tm.setTokens(OAUTH1, OAUTH2);
      await tm.clearTokens();

      await expect(tm.refresh()).rejects.toThrow(ServiceApiError);
    });

    it("subscriber pattern: concurrent callers get same result", async () => {
      let resolveRefresh!: (v: OAuth2Token) => void;
      const slowRefresh: RefreshFn = vi.fn(
        () =>
          new Promise<OAuth2Token>((r) => {
            resolveRefresh = r;
          })
      );
      const tm = createTokenManager({
        refreshFn: slowRefresh,
        logger,
      });
      await tm.setTokens(OAUTH1, OAUTH2);

      const p1 = tm.refresh();
      const p2 = tm.refresh();

      resolveRefresh(refreshedOAuth2());
      await Promise.all([p1, p2]);

      expect(slowRefresh).toHaveBeenCalledTimes(1);
      expect(tm.getAccessToken()).toBe("acc_refreshed");
    });

    it("subscriber pattern: rejects all on failure", async () => {
      const failRefresh: RefreshFn = vi
        .fn()
        .mockRejectedValue(new Error("network"));
      const tm = createTokenManager({ refreshFn: failRefresh, logger });
      await tm.setTokens(OAUTH1, OAUTH2);

      const p1 = tm.refresh();
      const p2 = tm.refresh();

      await expect(p1).rejects.toThrow("network");
      await expect(p2).rejects.toThrow("network");
    });
  });

  describe("init", () => {
    it("restores valid tokens from store", async () => {
      const store = createMockStore({ oauth1: OAUTH1, oauth2: OAUTH2 });
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      const result = await tm.init();

      expect(result).toEqual({ restored: true });
      expect(tm.isAuthenticated()).toBe(true);
      expect(tm.getAccessToken()).toBe("acc_valid");
      expect(tm.getGeneration()).toBe(1);
    });

    it("restores expired tokens with warning", async () => {
      const store = createMockStore({
        oauth1: OAUTH1,
        oauth2: expiredOAuth2(),
      });
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      const result = await tm.init();

      expect(result).toEqual({ restored: true });
      expect(tm.isAuthenticated()).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith("Restored tokens are expired");
    });

    it("returns restored false for empty store", async () => {
      const store = createMockStore(null);
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      const result = await tm.init();

      expect(result).toEqual({ restored: false });
      expect(tm.isAuthenticated()).toBe(false);
    });

    it("returns restored false without tokenStore", async () => {
      const tm = createTokenManager({ refreshFn, logger });

      const result = await tm.init();

      expect(result).toEqual({ restored: false });
    });

    it("is idempotent: no-op if tokens in memory", async () => {
      const store = createMockStore({ oauth1: OAUTH1, oauth2: OAUTH2 });
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });
      await tm.setTokens(OAUTH1, OAUTH2);

      const result = await tm.init();

      expect(result).toEqual({ restored: false });
      expect(tm.getGeneration()).toBe(1);
    });

    it("concurrent init calls do not corrupt state", async () => {
      const store = createMockStore({ oauth1: OAUTH1, oauth2: OAUTH2 });
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      const results = await Promise.all([tm.init(), tm.init()]);

      expect(results.some((r) => r.restored)).toBe(true);
      expect(tm.getGeneration()).toBe(1);
      expect(tm.getAccessToken()).toBe("acc_valid");
    });

    it("returns restored false for invalid store data", async () => {
      const store = createMockStore({ bad: "data" });
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      const result = await tm.init();

      expect(result).toEqual({ restored: false });
    });
  });

  describe("clearTokens", () => {
    it("nulls memory synchronously and clears store", async () => {
      const store = createMockStore();
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });
      await tm.setTokens(OAUTH1, OAUTH2);

      await tm.clearTokens();

      expect(tm.getAccessToken()).toBeUndefined();
      expect(tm.getOAuth1Token()).toBeUndefined();
      expect(tm.isAuthenticated()).toBe(false);
      expect(store.clear).toHaveBeenCalled();
    });
  });

  describe("stale refresh guard", () => {
    it("should discard stale refresh result after clearTokens", async () => {
      let resolveRefresh!: (v: OAuth2Token) => void;
      const slowRefresh: RefreshFn = vi.fn(
        () =>
          new Promise<OAuth2Token>((r) => {
            resolveRefresh = r;
          })
      );
      const tm = createTokenManager({ refreshFn: slowRefresh, logger });
      await tm.setTokens(OAUTH1, OAUTH2);

      const refreshPromise = tm.refresh();
      await tm.clearTokens();

      resolveRefresh(refreshedOAuth2());
      await refreshPromise;

      expect(tm.getAccessToken()).toBeUndefined();
      expect(tm.isAuthenticated()).toBe(false);
    });
  });

  describe("isAuthenticated", () => {
    it("returns true with valid token", async () => {
      const tm = createTokenManager({ refreshFn, logger });
      await tm.setTokens(OAUTH1, OAUTH2);

      expect(tm.isAuthenticated()).toBe(true);
    });

    it("returns false with expired token", async () => {
      const tm = createTokenManager({ refreshFn, logger });
      await tm.setTokens(OAUTH1, expiredOAuth2());

      expect(tm.isAuthenticated()).toBe(false);
    });

    it("returns false with no tokens", () => {
      const tm = createTokenManager({ refreshFn, logger });

      expect(tm.isAuthenticated()).toBe(false);
    });
  });

  describe("token values never in logs", () => {
    it("does not log token values", async () => {
      const store = createMockStore({ oauth1: OAUTH1, oauth2: OAUTH2 });
      const tm = createTokenManager({ refreshFn, logger, tokenStore: store });

      await tm.setTokens(OAUTH1, OAUTH2);
      await tm.refresh();
      await tm.clearTokens();
      await tm.init();

      const tokenValues = [
        OAUTH1.oauth_token,
        OAUTH1.oauth_token_secret,
        OAUTH2.access_token,
        OAUTH2.refresh_token,
        "acc_refreshed",
        "ref_valid",
      ];

      const allCalls = [
        ...(logger.debug as ReturnType<typeof vi.fn>).mock.calls,
        ...(logger.info as ReturnType<typeof vi.fn>).mock.calls,
        ...(logger.warn as ReturnType<typeof vi.fn>).mock.calls,
        ...(logger.error as ReturnType<typeof vi.fn>).mock.calls,
      ];

      const serialized = JSON.stringify(allCalls);
      for (const val of tokenValues) {
        expect(serialized).not.toContain(val);
      }
    });
  });
});
