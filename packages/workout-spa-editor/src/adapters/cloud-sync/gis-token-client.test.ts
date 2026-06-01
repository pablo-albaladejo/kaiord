import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  GisGlobal,
  GisTokenClientConfig,
} from "../../lib/cloud-sync/gis-types";
import { createGisAuth } from "./gis-token-client";

vi.mock("../../lib/cloud-sync/load-gis-script", () => ({
  loadGisScript: vi.fn(async () => {}),
}));

type StubConfig = GisTokenClientConfig;

function stubGis(behavior: (cfg: StubConfig) => void): void {
  const win = window as unknown as GisGlobal;
  win.google = {
    accounts: {
      oauth2: {
        initTokenClient: (cfg) => ({
          requestAccessToken: () => behavior(cfg),
        }),
        revoke: () => {},
      },
    },
  };
}

afterEach(() => {
  delete (window as unknown as { google?: unknown }).google;
  vi.clearAllMocks();
});

describe("createGisAuth", () => {
  it("should not be authenticated before any token is granted", () => {
    // Arrange
    const auth = createGisAuth("client-x");

    // Act
    const result = auth.isAuthenticated();

    // Assert
    expect(result).toBe(false);
  });

  it("should store the token and report authenticated after authenticate", async () => {
    // Arrange
    stubGis((cfg) => cfg.callback({ access_token: "tok-1" }));
    const auth = createGisAuth("client-x");

    // Act
    await auth.authenticate();

    // Assert
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.getAccessToken()).toBe("tok-1");
  });

  it("should reject when the GIS callback returns an error", async () => {
    // Arrange
    stubGis((cfg) => cfg.callback({ error: "access_denied" }));
    const auth = createGisAuth("client-x");

    // Act
    const act = () => auth.authenticate();

    // Assert
    await expect(act()).rejects.toThrow(/access_denied/);
  });

  it("should request a silent token with empty prompt", async () => {
    // Arrange
    let seenPrompt: string | undefined = "unset";
    const win = window as unknown as GisGlobal;
    win.google = {
      accounts: {
        oauth2: {
          initTokenClient: (cfg) => ({
            requestAccessToken: (overrides) => {
              seenPrompt = overrides?.prompt;
              cfg.callback({ access_token: "tok-2" });
            },
          }),
          revoke: () => {},
        },
      },
    };
    const auth = createGisAuth("client-x");

    // Act
    await auth.authenticate();

    // Assert
    expect(seenPrompt).toBe("");
  });
});
