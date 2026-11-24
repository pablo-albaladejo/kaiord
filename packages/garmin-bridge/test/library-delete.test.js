import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The closed list holds no library delete (owner decision 2026-11-24,
// #1633): `DELETE /workout-service/workout/{id}` is refused before any
// token or request, whatever the id, so nothing in the athlete's Garmin
// library is ever deleted. The entry comes back only with the App's
// `GARMIN_LIBRARY_DELETES` switch, after the owner's live capture.

const APP = { origin: "https://kaiord.com" };
const POPUP = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};
const LIBRARY_WORKOUT = "/workout-service/workout/1711500235";
const REFUSED = {
  ok: false,
  protocolVersion: 2,
  error: "Request not allowed",
  retryable: false,
};

require("../background.js");
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const seedTokens = () =>
  chrome.storage.local.set({
    garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
    garminOAuth2: {
      access_token: "bear",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });

const answer = (cb, message, sender) =>
  new Promise((resolve) => {
    const open = cb(message, sender, resolve);
    if (open === false) resolve("no answer");
  });

const deleteOf = (path, extra = {}) => ({
  action: "request",
  method: "DELETE",
  path,
  ...extra,
});

describe("thin Bridge: no library delete", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should refuse a library delete by a canonical id without minting or sending anything", async () => {
    // Arrange
    const message = deleteOf(LIBRARY_WORKOUT);

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
    expect(await chrome.storage.local.get("garminOAuth2")).toEqual({});
  });

  it("should send nothing to Garmin for a library delete while signed in", async () => {
    // Arrange
    seedTokens();

    // Act
    const res = await answer(externalCb, deleteOf(LIBRARY_WORKOUT), APP);

    // Assert
    expect(res).toEqual(REFUSED);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["a body", deleteOf(LIBRARY_WORKOUT, { body: {} })],
    ["an id with a leading zero", deleteOf("/workout-service/workout/0123")],
    ["an id that is not a number", deleteOf("/workout-service/workout/abc")],
    ["a sub-path", deleteOf(`${LIBRARY_WORKOUT}/schedule`)],
    ["a query", deleteOf(`${LIBRARY_WORKOUT}?force=true`)],
    ["the plural list path", deleteOf("/workout-service/workouts/1711500235")],
    ["another workout service", deleteOf("/workout-service/user/1711500235")],
    [
      "a read of the same path",
      { action: "request", method: "GET", path: LIBRARY_WORKOUT },
    ],
    [
      "an overwrite of the same path",
      { action: "request", method: "PUT", path: LIBRARY_WORKOUT, body: {} },
    ],
  ])(
    "should refuse a library delete with %s without minting or sending anything",
    async (_label, message) => {
      // Arrange
      const sender = APP;

      // Act
      const res = await answer(externalCb, message, sender);

      // Assert
      expect(res).toEqual(REFUSED);
      expect(fetch).not.toHaveBeenCalled();
      expect(await chrome.storage.local.get("garminOAuth2")).toEqual({});
    }
  );

  it.each([
    ["a subdomain", "https://www.kaiord.com"],
    ["a look-alike host", "https://kaiord.com.example.org"],
    ["plain http", "http://kaiord.com"],
    ["another site", "https://example.org"],
  ])(
    "should give a library delete sent from %s no answer and send nothing",
    async (_label, origin) => {
      // Arrange
      seedTokens();

      // Act
      const res = await answer(externalCb, deleteOf(LIBRARY_WORKOUT), {
        origin,
      });

      // Assert
      expect(res).toBe("no answer");
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it("should refuse a library delete from its own popup", async () => {
    // Arrange
    seedTokens();

    // Act
    const res = await answer(internalCb, deleteOf(LIBRARY_WORKOUT), POPUP);

    // Assert
    expect(res.ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
