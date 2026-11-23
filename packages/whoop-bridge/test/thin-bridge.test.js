import { beforeEach, describe, expect, it } from "vitest";

// The thin Bridge at the message contract (ADR 0004): the extension lends
// the athlete's WHOOP Session (the bearer the WHOOP web app itself sends)
// and executes requests from a closed list of method + path patterns, run
// from the open app.whoop.com tab, answering with WHOOP's raw answer. What
// to ask for and how to read it is the Kaiord App's WHOOP Connector.

const { PROTOCOL_VERSION, ALLOWED, storeToken } = require("../background.js");

const APP = { origin: "https://kaiord.com" };
const POPUP = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};
const KAIORD_CONTENT_SCRIPT = {
  id: "test-extension-id",
  origin: "https://kaiord.com",
  url: "https://kaiord.com/app/",
  tab: { id: 7 },
};
const WHOOP_CONTENT_SCRIPT = {
  id: "test-extension-id",
  origin: "https://app.whoop.com",
  url: "https://app.whoop.com/",
  tab: { id: 8 },
};
const CYCLES =
  "/core-details-bff/v0/cycles/details?id=42&startTime=2026-11-01T00%3A00%3A00.000Z&endTime=2026-11-23T00%3A00%3A00.000Z";

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
// Captured at import: __resetChromeMock clears the mock's call log.
const INTERNAL_LISTENERS = chrome.runtime.onMessage.addListener.mock.calls.map(
  ([cb]) => cb
);

const makeJwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

const answer = (cb, message, sender) =>
  new Promise((resolve) => {
    const open = cb(message, sender, resolve);
    if (open !== true) resolve("no answer");
  });

// Every internal listener sees the message, as Chrome delivers it; the
// first one that answers wins.
const answerInternal = async (message, sender) => {
  const answers = await Promise.all(
    INTERNAL_LISTENERS.map((cb) => answer(cb, message, sender))
  );
  return answers.find((a) => a !== "no answer") ?? "no answer";
};

const withWhoopTab = async (tabReply) => {
  await storeToken(makeJwt({ "custom:user_id": "42" }));
  chrome.tabs.query.mockImplementation((_q, cb) => cb([{ id: 99 }]));
  chrome.tabs.sendMessage.mockImplementation((_id, _msg, cb) => cb(tabReply));
};

describe("thin Bridge: closed path list", () => {
  beforeEach(() => __resetChromeMock());

  it("should speak protocol version 2", () => {
    // Arrange
    const expected = 2;

    // Act
    const actual = PROTOCOL_VERSION;

    // Assert
    expect(actual).toBe(expected);
  });

  it("should announce the same protocol version it answers with", () => {
    // Arrange
    require("../bridge-identity.js");

    // Act
    const announced = globalThis.KAIORD_BRIDGE_IDENTITY.protocolVersion;

    // Assert
    expect(announced).toBe(PROTOCOL_VERSION);
  });

  it("should return WHOOP's raw answer for a request on a listed path, read from the WHOOP tab", async () => {
    // Arrange
    await withWhoopTab({
      ok: true,
      status: 200,
      contentType: "application/json",
      body: '{"records":[]}',
    });
    const message = { action: "request", method: "GET", path: CYCLES };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual({
      ok: true,
      protocolVersion: 2,
      data: {
        status: 200,
        contentType: "application/json",
        body: '{"records":[]}',
      },
    });
    const [tabId, relayed] = chrome.tabs.sendMessage.mock.calls[0];
    expect(tabId).toBe(99);
    expect(relayed).toMatchObject({ action: "whoop-fetch", path: CYCLES });
  });

  it.each([
    ["an unlisted path", { method: "GET", path: "/users-service/v2/profile" }],
    [
      "a listed path with another method",
      { method: "POST", path: "/advanced-labs-service/v1/biomarker-tests" },
    ],
    [
      "a query the Connector never builds",
      {
        method: "GET",
        path: "/activities-service/v1/sports/history?countryCode=US&all=1",
      },
    ],
    [
      "a traversal out of a listed path",
      { method: "GET", path: "/health-service/v2/stress-bff/../../users" },
    ],
    ["a header", { method: "GET", path: CYCLES, headers: { a: "b" } }],
    ["a body", { method: "GET", path: CYCLES, body: "x" }],
  ])(
    "should refuse %s without relaying it to the WHOOP tab",
    async (_label, rest) => {
      // Arrange
      await withWhoopTab({ ok: true, status: 200, contentType: "", body: "" });
      const message = { action: "request", ...rest };

      // Act
      const res = await answer(externalCb, message, APP);

      // Assert
      expect(res).toEqual({
        ok: false,
        protocolVersion: 2,
        error: "Request not allowed",
        retryable: false,
      });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    }
  );

  it("should refuse a path outside its closed list without relaying it to the WHOOP tab", async () => {
    // Arrange
    await withWhoopTab({ ok: true, status: 200, contentType: "", body: "" });
    const message = {
      action: "request",
      method: "GET",
      path: "/membership-service/v1/affiliate",
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.error).toBe("Request not allowed");
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("should list only reads", () => {
    // Arrange
    const methods = new Set(ALLOWED.map((r) => r.method));

    // Act
    const listed = [...methods];

    // Assert
    expect(listed).toEqual(["GET"]);
  });

  it("should surface a bearer WHOOP refuses as needsReauth, with nothing read", async () => {
    // Arrange
    await withWhoopTab({ ok: false, status: 401, contentType: "", body: "" });

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: CYCLES },
      APP
    );

    // Assert
    expect(res.ok).toBe(false);
    expect(res.needsReauth).toBe(true);
    expect(res.status).toBe(401);
    expect(res.data).toBeUndefined();
  });

  it("should pass a Platform failure status on with no body", async () => {
    // Arrange
    await withWhoopTab({ ok: false, status: 503, contentType: "", body: "x" });

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: CYCLES },
      APP
    );

    // Assert
    expect(res).toEqual({
      ok: false,
      protocolVersion: 2,
      error: "Request failed: 503",
      status: 503,
    });
  });

  it("should keep the open WHOOP tab a condition of every read", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": "42" }));
    chrome.tabs.query.mockImplementation((_q, cb) => cb([]));

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: CYCLES },
      APP
    );

    // Assert
    expect(res.ok).toBe(false);
    expect(res.error).toBe("No app.whoop.com tab open.");
  });

  it("should give the App no legacy action that relayed a caller-built path", async () => {
    // Arrange
    const message = { action: "whoop-fetch", path: CYCLES };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.error).toBe("Origin or action not permitted");
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });
});

describe("thin Bridge: internal channel", () => {
  beforeEach(() => __resetChromeMock());

  it("should give a content script on the Kaiord App no answer, whatever the action", async () => {
    // Arrange
    const message = { action: "popup-status" };

    // Act
    const res = await answerInternal(message, KAIORD_CONTENT_SCRIPT);

    // Assert
    expect(res).toBe("no answer");
  });

  it("should refuse the generic request to the popup, as it is reachable only through the App origin gate", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: CYCLES };

    // Act
    const res = await answerInternal(message, POPUP);

    // Assert
    expect(res.error).toBe("Action not permitted");
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("should answer the popup's status and tab reads", async () => {
    // Arrange
    chrome.tabs.query.mockImplementation((_q, cb) => cb([{ id: 1 }]));

    // Act
    const status = await answerInternal({ action: "popup-status" }, POPUP);
    const tab = await answerInternal({ action: "tab-open" }, POPUP);

    // Assert
    expect(status.ok).toBe(true);
    expect(tab.data).toEqual({ open: true });
  });

  it("should store a bearer the WHOOP tab's content script captured, answering nothing", async () => {
    // Arrange
    const token = makeJwt({ "custom:user_id": "42" });

    // Act
    const res = await answerInternal(
      { action: "capture-token", token },
      WHOOP_CONTENT_SCRIPT
    );
    const stored = await chrome.storage.session.get("whoopToken");

    // Assert
    expect(res).toBe("no answer");
    expect(stored.whoopToken).toBe(token);
  });

  it.each([
    ["a content script on another site", KAIORD_CONTENT_SCRIPT],
    ["another extension", { ...WHOOP_CONTENT_SCRIPT, id: "another" }],
    ["the popup", POPUP],
  ])("should not take a bearer from %s", async (_label, sender) => {
    // Arrange
    const token = makeJwt({ "custom:user_id": "42" });

    // Act
    await answerInternal({ action: "capture-token", token }, sender);
    const stored = await chrome.storage.session.get("whoopToken");

    // Assert
    expect(stored.whoopToken).toBeUndefined();
  });
});
