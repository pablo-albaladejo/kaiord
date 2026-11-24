import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The thin Bridge at the message contract (ADR 0004): the extension lends
// the athlete's Session and executes requests from a closed list of
// method + path patterns, answering with Train2Go's raw answer. What to ask
// for and how to read it is the Kaiord App's Connector.

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
const WEEKLY = "/api/v2/workplan/weekly/2026-11-23?user=28035";
const WEEK_BODY = JSON.stringify({ data: { replace: { "#workplan": "" } } });

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const reply = (contentType, body, status = 200) => ({
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

  it("should return Train2Go's raw answer for a request on a listed path", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply("application/json", WEEK_BODY));
    const message = { action: "request", method: "GET", path: WEEKLY };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual({
      ok: true,
      protocolVersion: 2,
      data: { status: 200, contentType: "application/json", body: WEEK_BODY },
    });
    expect(fetch).toHaveBeenCalledWith(`https://app.train2go.com${WEEKLY}`, {
      method: "GET",
      credentials: "include",
      redirect: "manual",
      headers: undefined,
    });
  });

  it.each([
    { label: "a path outside the list", path: "/api/v2/comments/1" },
    {
      label: "the activity tooltip, which no Connector reads",
      path: "/api/v2/workplan/tooltip/activity/123",
    },
    { label: "a listed path with a query added", path: "/user/details?x=1" },
    { label: "another host", path: "//attacker.example/user/details" },
    { label: "a path with no leading slash", path: "user/details" },
    { label: "a missing path", path: undefined },
  ])("should refuse $label without a request", async ({ path }) => {
    // Arrange
    const message = { action: "request", method: "GET", path };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toMatchObject({
      ok: false,
      protocolVersion: 2,
      error: "Request not allowed",
      retryable: false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { label: "a POST", extra: { method: "POST" } },
    { label: "headers", extra: { headers: { Authorization: "x" } } },
    { label: "a body", extra: { body: "{}" } },
  ])(
    "should refuse a request that carries $label, as the list holds only method and path",
    async ({ extra }) => {
      // Arrange
      const message = { action: "request", method: "GET", path: WEEKLY };

      // Act
      const res = await answer(externalCb, { ...message, ...extra }, APP);

      // Assert
      expect(res).toMatchObject({ ok: false, error: "Request not allowed" });
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it("should refuse any path outside its closed list without sending a request", async () => {
    // Arrange
    const outside = ["/api/v2/comments/1", "/user/index", "/api/v2/profile"];

    // Act
    const answers = [];
    for (const path of outside) {
      answers.push(
        await answer(
          externalCb,
          { action: "request", method: "GET", path },
          APP
        )
      );
    }

    // Assert
    expect(answers.every((a) => a.ok === false && a.retryable === false)).toBe(
      true
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse a request with headers or a body without sending it", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: WEEKLY };

    // Act
    const withHeaders = await answer(
      externalCb,
      { ...message, headers: { Cookie: "x" } },
      APP
    );
    const withBody = await answer(externalCb, { ...message, body: "x" }, APP);

    // Assert
    expect([withHeaders.ok, withBody.ok]).toEqual([false, false]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should list only GET rules", () => {
    // Arrange
    const methods = new Set(ALLOWED.map((rule) => rule.method));

    // Act
    const actual = [...methods];

    // Assert
    expect(actual).toEqual(["GET"]);
  });

  it("should surface a dead Session as needsReauth, with nothing read", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply("text/html", "", 302));
    const message = { action: "request", method: "GET", path: WEEKLY };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
    expect(res.data).toBeUndefined();
  });

  it("should pass a Platform failure status on unread", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply("text/html", "", 503));
    const message = { action: "request", method: "GET", path: "/user/details" };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toMatchObject({ ok: false, status: 503 });
  });

  it.each(["read-week", "read-day", "read-details"])(
    "should no longer read and parse %s for the Kaiord App",
    async (action) => {
      // Arrange
      const message = { action, date: "2026-11-23", userId: 28035 };

      // Act
      const res = await answer(externalCb, message, APP);

      // Assert
      expect(res).toMatchObject({ ok: false, protocolVersion: 2 });
      expect(fetch).not.toHaveBeenCalled();
    }
  );
});

describe("thin Bridge: internal channel is the popup's only", () => {
  beforeEach(() => __resetChromeMock());

  it("should give a content script no answer, whatever the action", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: WEEKLY };

    // Act
    const res = await answer(internalCb, message, CONTENT_SCRIPT);

    // Assert
    expect(res).toBe("no answer");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should give a message from another extension no answer", async () => {
    // Arrange
    const other = { ...POPUP, id: "other", origin: "chrome-extension://other" };

    // Act
    const res = await answer(internalCb, { action: "ping" }, other);

    // Assert
    expect(res).toBe("no answer");
  });

  it("should refuse the generic request to the popup, as it is reachable only through the App origin gate", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: WEEKLY };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res).toMatchObject({ ok: false, retryable: false });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should answer the popup's weekly read with the planned, done and workload inputs", async () => {
    // Arrange
    const html =
      '<div class="workplan-table-block workplan-table-day workplan-table-date-2026-11-23">' +
      '<a data-id="1"></a><span data-status="1"></span>' +
      '<span class="workload-default" data-value="3"></span></div>';
    const body = JSON.stringify({ data: { replace: { "#workplan": html } } });
    fetch.mockResolvedValueOnce(reply("application/json", body));
    const message = { action: "read-week", date: "2026-11-23", userId: 28035 };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res).toMatchObject({
      ok: true,
      data: { activities: [{ status: 1, workload: 3 }] },
    });
  });
});

describe("popup reads (ADR 0004's bounded exception)", () => {
  it("should answer every popup read on the popup's channel and none on the App's", () => {
    // Arrange
    const bg = require("../background.js");

    // Act
    const reads = [...bg.POPUP_READS];

    // Assert
    expect(reads.every((a) => bg.INTERNAL_ACTIONS.has(a))).toBe(true);
    expect(reads.some((a) => bg.EXTERNAL_ACTIONS.has(a))).toBe(false);
    expect(Array.isArray(bg.POPUP_READ_SCRIPTS)).toBe(true);
  });
});
