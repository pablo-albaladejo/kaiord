import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The one library delete of the closed list, at the message contract (ADR
// 0004): `DELETE /workout-service/workout/{id}` with a canonical id and no
// body, reachable only through the exact App origin. Which library workout
// may be deleted (only one Kaiord created and no calendar entry uses) is
// the App's Garmin Connector; the extension only refuses everything else.

const APP = { origin: "https://kaiord.com" };
const POPUP = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};
const CONNECTAPI = "https://connectapi.garmin.com";
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

const reply = (body, status) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => "text/plain" },
  json: () => Promise.reject(new Error("the bridge never parses")),
  text: () => Promise.resolve(body),
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

describe("thin Bridge: the library delete", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should delete one library workout by its id, sending no body", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply("", 204));

    // Act
    const res = await answer(externalCb, deleteOf(LIBRARY_WORKOUT), APP);

    // Assert
    expect(res).toEqual({
      ok: true,
      protocolVersion: 2,
      data: { status: 204, contentType: "text/plain", body: "" },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${CONNECTAPI}${LIBRARY_WORKOUT}`);
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
    expect(init.headers.Authorization).toBe("Bearer bear");
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

  it("should pass Garmin's refusal of a library delete on with its status", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply("Not Found", 404));

    // Act
    const res = await answer(externalCb, deleteOf(LIBRARY_WORKOUT), APP);

    // Assert
    expect(res).toEqual({
      ok: false,
      protocolVersion: 2,
      error: "Request failed: 404",
      status: 404,
    });
  });
});
