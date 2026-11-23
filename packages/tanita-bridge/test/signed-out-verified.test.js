import { afterEach, beforeEach, describe, expect, it } from "vitest";

// GLOSSARY, "What the athlete reads": a cause that was not verified is never
// stated. MyTANITA says the Session is gone by bouncing the export to its
// sign-in page (docs/connectors-research/tanita.md: 302 to /en/user/login)
// or by a 401. The Session check is a HEAD, so an HTML page in place of the
// export has no body to tell a sign-in page from a maintenance page: it is
// "not-answering", as are a 403, a 5xx and no answer at all.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const POPUP = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const head = (status, contentType = "application/csvm+json") => ({
  ok: status >= 200 && status < 300,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  text: () => Promise.resolve(""),
});
const OPAQUE_REDIRECT = { ok: false, status: 0, type: "opaqueredirect" };

const answer = (cb, message, sender) =>
  new Promise((resolve) => cb(message, sender, resolve));

const pingSession = async () =>
  (await answer(externalCb, { action: "ping" }, APP)).data.session;

describe("MyTANITA is reported signed out only when it said so", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["a redirect to the sign-in page", () => OPAQUE_REDIRECT],
    ["a 401", () => head(401)],
  ])("should answer the ping signed-out on %s", async (_case, response) => {
    // Arrange
    fetch.mockResolvedValueOnce(response());

    // Act
    const session = await pingSession();

    // Assert
    expect(session).toBe("signed-out");
  });

  it.each([
    ["an HTML page in place of the export", () => head(200, "text/html")],
    ["a 403", () => head(403)],
    ["a 405", () => head(405)],
    ["a 503", () => head(503)],
  ])("should answer the ping not-answering on %s", async (_case, response) => {
    // Arrange
    fetch.mockResolvedValueOnce(response());

    // Act
    const session = await pingSession();

    // Assert
    expect(session).toBe("not-answering");
  });

  it("should answer the popup's check not-answering on an HTML page", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(head(200, "text/html; charset=UTF-8"));

    // Act
    const res = await answer(internalCb, { action: "checkSession" }, POPUP);

    // Assert
    expect(res.data).toMatchObject({
      session: "not-answering",
      authenticated: false,
    });
  });

  it("should refuse a request answered 403 with its status and no needsReauth", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(head(403));
    const message = {
      action: "request",
      method: "GET",
      path: "/en/user/export-csv",
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toMatchObject({ ok: false, status: 403 });
    expect(res.needsReauth).toBeUndefined();
  });
});
