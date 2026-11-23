import { beforeEach, describe, expect, it } from "vitest";

// What the Kaiord App needs to show the popup's own notice at the same moment:
// whether the held sign-in names a WHOOP account and whether a WHOOP tab is
// open to read through. Both are yes or no, learned without a request to
// WHOOP; the id itself still travels only to `read-user-id`.

const { storeToken } = require("../background.js");

const SPA_SENDER = { origin: "https://kaiord.com" };
const USER_ID = 7654321;

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const makeJwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

const send = (message) =>
  new Promise((resolve) => externalCb(message, SPA_SENDER, resolve));

const withTabs = (tabs) =>
  chrome.tabs.query.mockImplementation((_q, cb) => cb(tabs));

describe("session readiness", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should say a held sign-in names an account and a WHOOP tab is open, with no id and no request", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": String(USER_ID) }));
    withTabs([{ id: 99 }]);

    // Act
    const status = await send({ action: "status" });

    // Assert
    expect(status.data).toMatchObject({
      session: "signed-in",
      hasAccountId: true,
      tabOpen: true,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    expect(JSON.stringify(status)).not.toContain(String(USER_ID));
  });

  it("should say no WHOOP tab is open when the sign-in is held and every tab is closed", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": String(USER_ID) }));
    withTabs([]);

    // Act
    const status = await send({ action: "status" });

    // Assert
    expect(status.data).toMatchObject({ session: "signed-in", tabOpen: false });
  });

  it("should say a held sign-in names no account when its token has no custom:user_id", async () => {
    // Arrange
    await storeToken(makeJwt({ sub: "someone" }));
    withTabs([{ id: 99 }]);

    // Act
    const status = await send({ action: "status" });

    // Assert
    expect(status.data).toMatchObject({
      session: "signed-in",
      hasAccountId: false,
    });
  });
});
