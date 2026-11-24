import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The thin Bridge at the message contract (ADR 0004): the extension lends
// the athlete's MyTANITA Session and executes requests from a closed list
// of method + path patterns, answering with MyTANITA's raw answer. Telling
// an export from a login page is the Kaiord App's Tanita Connector.

const { PROTOCOL_VERSION, ALLOWED } = require("../background.js");

const APP = { origin: "https://kaiord.com" };
const POPUP = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};
const CONTENT_SCRIPT = {
  id: "test-extension-id",
  origin: "https://kaiord.com",
  url: "https://kaiord.com/app/",
  tab: { id: 7 },
};
const EXPORT = "/en/user/export-csv";
const CSV = "Date;Weight\n2026-11-20 07:00;72.4\n";

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const reply = (body, status = 200, contentType = "text/csv") => ({
  ok: status >= 200 && status < 300,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
});

const answer = (cb, message, sender) =>
  new Promise((resolve) => {
    const open = cb(message, sender, resolve);
    if (open === false) resolve("no answer");
  });

describe("thin Bridge: closed path list", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

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

  it("should return MyTANITA's raw answer for a request on the export", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(CSV));
    const message = { action: "request", method: "GET", path: EXPORT };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual({
      ok: true,
      protocolVersion: 2,
      data: { status: 200, contentType: "text/csv", body: CSV },
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`https://mytanita.eu${EXPORT}`);
    expect(init.credentials).toBe("include");
    expect(init.redirect).toBe("manual");
  });

  it("should hand a login page served in place of the export over unread", async () => {
    // Arrange
    const page = "<!doctype html><title>Login</title>";
    fetch.mockResolvedValueOnce(reply(page, 200, "text/html"));

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: EXPORT },
      APP
    );

    // Assert
    expect(res.data).toEqual({
      status: 200,
      contentType: "text/html",
      body: page,
    });
  });

  it.each([
    ["an unlisted path", { method: "GET", path: "/en/user/profile" }],
    ["a listed path with another method", { method: "POST", path: EXPORT }],
    ["a look-alike path", { method: "GET", path: `${EXPORT}?all=1` }],
    ["a header", { method: "GET", path: EXPORT, headers: { Cookie: "x" } }],
    ["a body", { method: "GET", path: EXPORT, body: "x" }],
  ])("should refuse %s without sending a request", async (_label, rest) => {
    // Arrange
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
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse a path outside its closed list without sending a request", async () => {
    // Arrange
    const message = {
      action: "request",
      method: "GET",
      path: "/en/user/profile",
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.error).toBe("Request not allowed");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should list only reads of the export", () => {
    // Arrange
    const methods = ALLOWED.map((r) => r.method);

    // Act
    const writes = methods.filter((m) => m !== "GET" && m !== "HEAD");

    // Assert
    expect(writes).toEqual([]);
  });

  it("should surface a dead Session as needsReauth, with nothing read", async () => {
    // Arrange
    fetch.mockResolvedValueOnce({
      ...reply(""),
      ok: false,
      status: 0,
      type: "opaqueredirect",
    });

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: EXPORT },
      APP
    );

    // Assert
    expect(res.ok).toBe(false);
    expect(res.needsReauth).toBe(true);
    expect(res.data).toBeUndefined();
  });

  it("should pass a Platform failure status on unread", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply("busy", 503, "text/plain"));

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: EXPORT },
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

  it("should give the App no legacy action that read by itself", async () => {
    // Arrange
    const message = { action: "read-export-csv" };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.error).toBe("Origin or action not permitted");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("thin Bridge: internal channel is the popup's only", () => {
  beforeEach(() => __resetChromeMock());

  it("should give a content script no answer, whatever the action", async () => {
    // Arrange
    const message = { action: "checkSession" };

    // Act
    const res = await answer(internalCb, message, CONTENT_SCRIPT);

    // Assert
    expect(res).toBe("no answer");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse the generic request to the popup, as it is reachable only through the App origin gate", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: EXPORT };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res.error).toBe("Action not permitted");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should answer the popup's Session check", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply("", 200, "text/csv"));

    // Act
    const res = await answer(internalCb, { action: "checkSession" }, POPUP);

    // Assert
    expect(res.ok).toBe(true);
    expect(res.data.session).toBe("signed-in");
  });
});
