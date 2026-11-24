import { beforeEach, describe, expect, it } from "vitest";

// The Session check, asserted at the message contract the Kaiord App sees:
// a check makes no request, stores nothing and answers yes or no, with no
// WHOOP id and no capture time. The id travels only to the read the App makes
// when it is about to import.

const { storeToken } = require("../background.js");

const SPA_SENDER = { origin: "https://kaiord.com" };
const USER_ID = 7654321;

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const makeJwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

const CHECK_KEYS = [
  "authenticated",
  "connected",
  "hasAccountId",
  "session",
  "tabOpen",
];
const PING_KEYS = [
  "authenticated",
  "capabilities",
  "connected",
  "hasAccountId",
  "id",
  "name",
  "protocolVersion",
  "session",
  "tabOpen",
  "version",
];

const send = (message) =>
  new Promise((resolve) => externalCb(message, SPA_SENDER, resolve));

const captureSession = () =>
  storeToken(makeJwt({ "custom:user_id": String(USER_ID) }));

describe("session confinement", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should check a session with no request and store nothing, answering only yes or no", async () => {
    // Arrange
    await captureSession();
    chrome.storage.session.set.mockClear();

    // Act
    const status = await send({ action: "status" });
    const ping = await send({ action: "ping" });

    // Assert
    expect(fetch).not.toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
    expect(Object.keys(status.data).sort()).toEqual(CHECK_KEYS);
    expect(Object.keys(ping.data).sort()).toEqual(PING_KEYS);
    expect(status.data.session).toBe("signed-in");
    expect(JSON.stringify([status, ping])).not.toContain(String(USER_ID));
  });

  it("should report not checked, never signed out, while no WHOOP request has been seen", async () => {
    // Arrange

    // Act
    const status = await send({ action: "status" });

    // Assert
    expect(status.data).toEqual({
      connected: false,
      session: "not-checked",
      authenticated: false,
      hasAccountId: false,
      tabOpen: false,
    });
  });

  it("should hand the WHOOP id only to the read the Kaiord App makes before an import", async () => {
    // Arrange
    await captureSession();

    // Act
    const answer = await send({ action: "read-user-id" });

    // Assert
    expect(answer.data).toEqual({ userId: USER_ID });
  });
});
