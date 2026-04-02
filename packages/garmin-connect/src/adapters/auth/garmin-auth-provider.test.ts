import { describe, it, expect, vi } from "vitest";
import { createGarminAuthProvider } from "./garmin-auth-provider";
import type { TokenManager } from "../token/token-manager.types";
import type { Logger } from "@kaiord/core";

vi.mock("../http/garmin-sso", () => ({
  garminSso: vi.fn(async () => ({
    oauth1: { oauth_token: "o1", oauth_token_secret: "s1" },
    oauth2: {
      access_token: "at",
      refresh_token: "rt",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token_expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  })),
}));

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

const createMockTokenManager = (
  overrides?: Partial<TokenManager>
): TokenManager => ({
  getAccessToken: vi.fn(() => undefined),
  getOAuth1Token: vi.fn(() => undefined),
  getOAuth2Token: vi.fn(() => undefined),
  getGeneration: vi.fn(() => 0),
  isAuthenticated: vi.fn(() => false),
  setTokens: vi.fn(async () => {}),
  clearTokens: vi.fn(async () => {}),
  refresh: vi.fn(async () => {}),
  init: vi.fn(async () => ({ restored: false })),
  ...overrides,
});

describe("createGarminAuthProvider", () => {
  it("should not be authenticated initially", () => {
    const tm = createMockTokenManager();
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    expect(auth.is_authenticated()).toBe(false);
  });

  it("should call setTokens after login", async () => {
    const tm = createMockTokenManager();
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    await auth.login("user", "pass");

    expect(tm.setTokens).toHaveBeenCalledWith(
      expect.objectContaining({ oauth_token: "o1" }),
      expect.objectContaining({ access_token: "at" })
    );
  });

  it("should delegate is_authenticated to TokenManager", () => {
    const tm = createMockTokenManager({
      isAuthenticated: vi.fn(() => true),
    });
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    expect(auth.is_authenticated()).toBe(true);
    expect(tm.isAuthenticated).toHaveBeenCalled();
  });

  it("should restore tokens via setTokens", async () => {
    const tm = createMockTokenManager();
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    await auth.restore_tokens({
      oauth1: { oauth_token: "t1", oauth_token_secret: "s1" },
      oauth2: {
        access_token: "at",
        refresh_token: "rt",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token_expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    expect(tm.setTokens).toHaveBeenCalledWith(
      expect.objectContaining({ oauth_token: "t1" }),
      expect.objectContaining({ access_token: "at" })
    );
  });

  it("should call clearTokens on logout", async () => {
    const tm = createMockTokenManager();
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    await auth.logout();

    expect(tm.clearTokens).toHaveBeenCalled();
  });

  it("should export tokens from TokenManager", async () => {
    const oauth2 = {
      access_token: "at",
      refresh_token: "rt",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token_expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    const tm = createMockTokenManager({
      getOAuth1Token: vi.fn(() => ({
        oauth_token: "o1",
        oauth_token_secret: "s1",
      })),
      getOAuth2Token: vi.fn(() => oauth2),
    });
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    const tokens = await auth.export_tokens();

    expect(tokens.oauth1).toStrictEqual({
      oauth_token: "o1",
      oauth_token_secret: "s1",
    });
    expect((tokens as Record<string, unknown>).oauth2).toBe(oauth2);
  });

  it("should throw when exporting tokens without login", async () => {
    const tm = createMockTokenManager();
    const auth = createGarminAuthProvider({
      tokenManager: tm,
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    await expect(auth.export_tokens()).rejects.toThrow("No tokens to export");
  });
});
