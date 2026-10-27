import { afterEach, describe, expect, it, vi } from "vitest";

import { CloudAuthRequiredError } from "../../types/cloud-auth-required-error";
import { createDriveAuthedFetch } from "./drive-authed-fetch";
import type { GisAuth } from "./gis-token-client";

type FakeAuth = GisAuth & { token: string | null };

function fakeAuth(token: string | null, next = "fresh"): FakeAuth {
  const auth: FakeAuth = {
    token,
    isAuthenticated: () => auth.token !== null,
    getAccessToken: () => auth.token,
    invalidate: vi.fn(() => {
      auth.token = null;
    }),
    authenticate: vi.fn(async () => {
      auth.token = next;
    }),
  };
  return auth;
}

const OK = 200;
const UNAUTHORIZED = 401;

const status = (code: number) => new Response("{}", { status: code });

const bearerOf = (call: unknown[]) =>
  ((call[1] as RequestInit).headers as Record<string, string>).Authorization;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createDriveAuthedFetch", () => {
  it("should send the held token without signing in again", async () => {
    // Arrange
    const fetchMock = vi.fn(async () => status(OK));
    vi.stubGlobal("fetch", fetchMock);
    const auth = fakeAuth("tok");
    const send = createDriveAuthedFetch(auth, () => false);

    // Act
    await send("https://drive/x", { headers: { "Content-Type": "a/b" } });

    // Assert
    expect(auth.authenticate).not.toHaveBeenCalled();
    expect(bearerOf(fetchMock.mock.calls[0])).toBe("Bearer tok");
  });

  it("should throw CloudAuthRequiredError when the token is gone and no gesture can open the popup", async () => {
    // Arrange
    const fetchMock = vi.fn(async () => status(OK));
    vi.stubGlobal("fetch", fetchMock);
    const auth = fakeAuth(null);
    const send = createDriveAuthedFetch(auth, () => false);

    // Act
    const run = send("https://drive/x");

    // Assert
    await expect(run).rejects.toBeInstanceOf(CloudAuthRequiredError);
    expect(auth.authenticate).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should sign in again during a gesture when the token is gone", async () => {
    // Arrange
    const fetchMock = vi.fn(async () => status(OK));
    vi.stubGlobal("fetch", fetchMock);
    const auth = fakeAuth(null);
    const send = createDriveAuthedFetch(auth, () => true);

    // Act
    await send("https://drive/x");

    // Assert
    expect(auth.authenticate).toHaveBeenCalledTimes(1);
    expect(bearerOf(fetchMock.mock.calls[0])).toBe("Bearer fresh");
  });

  it("should refresh the token and retry once when Drive answers 401", async () => {
    // Arrange
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(status(UNAUTHORIZED))
      .mockResolvedValueOnce(status(OK));
    vi.stubGlobal("fetch", fetchMock);
    const auth = fakeAuth("revoked");
    const send = createDriveAuthedFetch(auth, () => true);

    // Act
    const res = await send("https://drive/x");

    // Assert
    expect(res.status).toBe(OK);
    expect(auth.invalidate).toHaveBeenCalledTimes(1);
    expect(bearerOf(fetchMock.mock.calls[1])).toBe("Bearer fresh");
  });

  it("should map a failed sign-in to CloudAuthRequiredError", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => status(OK))
    );
    const auth = fakeAuth(null);
    auth.authenticate = vi.fn(async () => {
      throw new Error("popup_failed_to_open");
    });
    const send = createDriveAuthedFetch(auth, () => true);

    // Act
    const run = send("https://drive/x");

    // Assert
    await expect(run).rejects.toBeInstanceOf(CloudAuthRequiredError);
  });
});
