import { beforeEach, describe, expect, it } from "vitest";

// An App tab opened before the extension updated keeps reading `ping` with
// its own code. What each App build does with the answer (read at
// origin/main and on the current App):
//
// - protocol-1 App (origin/main, hooks/garmin-ping-evaluation.ts and
//   adapters/bridge/bridge-ping-session-probes.ts): an `ok: false` envelope
//   is "inactive" (signed out); an envelope whose protocolVersion is not 1
//   is "outdated extension" before any session field is read.
// - protocol-[1, 2] App (application/connections/session-outcome.ts):
//   signed out only on `gcApi.needsReauth === true`; `gcApi.ok !== true`
//   alone is "could not tell".
//
// So a check that asked Garmin nothing must answer `ok: true`, carry no
// needsReauth anywhere, and keep `gcApi.ok` false: no App build then reads
// it as signed out.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const ping = () =>
  new Promise((resolve) => externalCb({ action: "ping" }, APP, resolve));

describe("the legacy ping fields never imply signed out unless verified", () => {
  beforeEach(() => __resetChromeMock());

  it("should answer a ping with no Garmin access in a delivered, successful envelope", async () => {
    // Arrange
    const noTokensStored = await chrome.storage.local.get([
      "garminOAuth1",
      "garminOAuth2",
    ]);

    // Act
    const res = await ping();

    // Assert
    expect(noTokensStored).toEqual({});
    expect(res).toMatchObject({ ok: true, protocolVersion: 2 });
  });

  it("should carry no needsReauth in the legacy fields when nothing was checked", async () => {
    // Arrange
    const expectedGcApi = { ok: false };

    // Act
    const { data, needsReauth } = await ping();

    // Assert
    expect(data.session).toBe("not-checked");
    expect(data.gcApi).toEqual(expectedGcApi);
    expect(data.authenticated).toBe(false);
    expect(needsReauth).toBeUndefined();
    expect(data.needsReauth).toBeUndefined();
  });

  it("should answer an expired access the same way, never signed out", async () => {
    // Arrange
    await chrome.storage.local.set({
      garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
      garminOAuth2: { access_token: "a", expires_at: 1 },
    });

    // Act
    const { data } = await ping();

    // Assert
    expect(data).toMatchObject({
      session: "not-checked",
      gcApi: { ok: false },
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
