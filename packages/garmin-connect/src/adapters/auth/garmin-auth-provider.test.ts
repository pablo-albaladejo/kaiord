import { describe, it, expect, vi } from "vitest";
import { createGarminAuthProvider } from "./garmin-auth-provider";
import type { Logger, TokenStore } from "@kaiord/core";

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
  exchangeOAuth2: vi.fn(),
}));

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;

describe("createGarminAuthProvider", () => {
  it("should not be authenticated initially", () => {
    const { auth } = createGarminAuthProvider({
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    expect(auth.is_authenticated()).toBe(false);
  });

  it("should be authenticated after login", async () => {
    const { auth } = createGarminAuthProvider({
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    await auth.login("user", "pass");

    expect(auth.is_authenticated()).toBe(true);
  });

  it("should save tokens to store after login", async () => {
    const mockStore: TokenStore = {
      save: vi.fn(async () => {}),
      load: vi.fn(async () => null),
      clear: vi.fn(async () => {}),
    };

    const { auth } = createGarminAuthProvider({
      logger: mockLogger,
      tokenStore: mockStore,
      fetchFn: mockFetch,
    });

    await auth.login("user", "pass");

    expect(mockStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        oauth1: expect.objectContaining({ oauth_token: "o1" }),
        oauth2: expect.objectContaining({ access_token: "at" }),
      })
    );
  });

  it("should restore tokens from stored data", async () => {
    const { auth } = createGarminAuthProvider({
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

    expect(auth.is_authenticated()).toBe(true);
  });

  it("should not be authenticated after logout", async () => {
    const { auth } = createGarminAuthProvider({
      logger: mockLogger,
      fetchFn: mockFetch,
    });

    await auth.login("user", "pass");
    expect(auth.is_authenticated()).toBe(true);

    await auth.logout();
    expect(auth.is_authenticated()).toBe(false);
  });

  it("should clear token store on logout", async () => {
    const mockStore: TokenStore = {
      save: vi.fn(async () => {}),
      load: vi.fn(async () => null),
      clear: vi.fn(async () => {}),
    };

    const { auth } = createGarminAuthProvider({
      logger: mockLogger,
      tokenStore: mockStore,
      fetchFn: mockFetch,
    });

    await auth.login("user", "pass");
    await auth.logout();

    expect(mockStore.clear).toHaveBeenCalled();
  });
});
