import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createWhoopAuth,
  STORAGE_CREDS,
  STORAGE_TOKENS,
  STORAGE_STATE,
} = require("../whoop-oauth.js");

const makeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    get: vi.fn((keys) => {
      const out = {};
      for (const k of keys) out[k] = data[k];
      return Promise.resolve(out);
    }),
    set: vi.fn((obj) => {
      Object.assign(data, obj);
      return Promise.resolve();
    }),
    remove: vi.fn((keys) => {
      for (const k of keys) delete data[k];
      return Promise.resolve();
    }),
  };
};

const CREDS = { clientId: "cid", clientSecret: "secret" };
const okJson = (body) =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
const errJson = (status, body) =>
  Promise.resolve({
    ok: false,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });

describe("createWhoopAuth", () => {
  let clock;

  beforeEach(() => {
    clock = 1_000_000;
  });

  const makeAuth = (storage, fetchFn, extra = {}) =>
    createWhoopAuth({
      storage,
      fetchFn,
      getRedirectURL: () => "https://ext.chromiumapp.org/",
      launchWebAuthFlow: vi.fn(),
      now: () => clock,
      randomState: () => "state-1",
      ...extra,
    });

  it("should persist the rotated refresh token before handing out the access token", async () => {
    // Arrange
    const storage = makeStorage({
      [STORAGE_CREDS]: CREDS,
      [STORAGE_TOKENS]: {
        accessToken: "old-a",
        refreshToken: "old-r",
        expiresAt: clock, // expired
      },
    });
    const fetchFn = vi.fn(() =>
      okJson({
        access_token: "new-a",
        refresh_token: "new-r",
        expires_in: 3600,
      })
    );
    const auth = makeAuth(storage, fetchFn);

    // Act
    const token = await auth.getAccessToken();

    // Assert
    expect(token).toBe("new-a");
    expect(storage.data[STORAGE_TOKENS].refreshToken).toBe("new-r");
  });

  it("should share one in-flight refresh between concurrent callers", async () => {
    // Arrange
    const storage = makeStorage({
      [STORAGE_CREDS]: CREDS,
      [STORAGE_TOKENS]: {
        accessToken: "old-a",
        refreshToken: "single-use",
        expiresAt: clock,
      },
    });
    const fetchFn = vi.fn(() =>
      okJson({
        access_token: "new-a",
        refresh_token: "new-r",
        expires_in: 3600,
      })
    );
    const auth = makeAuth(storage, fetchFn);

    // Act
    const [a, b] = await Promise.all([
      auth.getAccessToken(),
      auth.getAccessToken(),
    ]);

    // Assert
    expect(a).toBe("new-a");
    expect(b).toBe("new-a");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("should clear tokens and flag needsReauth on invalid_grant instead of failing silently", async () => {
    // Arrange
    const storage = makeStorage({
      [STORAGE_CREDS]: CREDS,
      [STORAGE_TOKENS]: {
        accessToken: "old-a",
        refreshToken: "consumed",
        expiresAt: clock,
      },
    });
    const fetchFn = vi.fn(() =>
      errJson(400, { error: "invalid_grant", error_description: "revoked" })
    );
    const auth = makeAuth(storage, fetchFn);

    // Act
    const failure = auth.getAccessToken();

    // Assert
    await expect(failure).rejects.toMatchObject({ needsReauth: true });
    expect(storage.data[STORAGE_TOKENS]).toBeUndefined();
    expect(storage.data[STORAGE_STATE]).toMatchObject({ needsReauth: true });
  });

  it("should return the cached access token while it is not near expiry", async () => {
    // Arrange
    const storage = makeStorage({
      [STORAGE_CREDS]: CREDS,
      [STORAGE_TOKENS]: {
        accessToken: "cached",
        refreshToken: "r",
        expiresAt: clock + 3_600_000,
      },
    });
    const fetchFn = vi.fn();
    const auth = makeAuth(storage, fetchFn);

    // Act
    const token = await auth.getAccessToken();

    // Assert
    expect(token).toBe("cached");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should reject an OAuth redirect whose state does not match", async () => {
    // Arrange
    const storage = makeStorage({ [STORAGE_CREDS]: CREDS });
    const launchWebAuthFlow = vi.fn(() =>
      Promise.resolve("https://ext.chromiumapp.org/?code=c&state=EVIL")
    );
    const auth = makeAuth(storage, vi.fn(), { launchWebAuthFlow });

    // Act
    const failure = auth.connect();

    // Assert
    await expect(failure).rejects.toThrow("OAuth state mismatch");
  });

  it("should exchange the auth code and persist tokens on connect", async () => {
    // Arrange
    const storage = makeStorage({ [STORAGE_CREDS]: CREDS });
    const launchWebAuthFlow = vi.fn(() =>
      Promise.resolve(
        "https://ext.chromiumapp.org/?code=auth-code&state=state-1"
      )
    );
    const fetchFn = vi.fn(() =>
      okJson({ access_token: "a1", refresh_token: "r1", expires_in: 3600 })
    );
    const auth = makeAuth(storage, fetchFn, { launchWebAuthFlow });

    // Act
    const result = await auth.connect();

    // Assert
    expect(result).toEqual({ authenticated: true });
    expect(storage.data[STORAGE_TOKENS]).toMatchObject({
      accessToken: "a1",
      refreshToken: "r1",
    });
  });

  it("should report needsReauth in the auth state after tokens are cleared", async () => {
    // Arrange
    const storage = makeStorage({
      [STORAGE_CREDS]: CREDS,
      [STORAGE_STATE]: { needsReauth: true, lastError: "revoked" },
    });
    const auth = makeAuth(storage, vi.fn());

    // Act
    const state = await auth.getAuthState();

    // Assert
    expect(state).toMatchObject({
      authenticated: false,
      needsReauth: true,
      hasCredentials: true,
      lastError: "revoked",
    });
  });
});
