import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// GLOSSARY, "What the athlete reads": a cause that was not verified is never
// stated. Train2Go has said the Session is gone only when it bounces to its
// sign-in page (a redirect), answers 401, or answers the profile ping with
// its "Unauthenticated" body (test/fixtures/ping-expired.json). Anything
// else, a 403, a page that is not the ping, a 5xx or no answer, is
// "not-answering".

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
const EXPIRED = readFileSync(
  join(import.meta.dirname, "fixtures/ping-expired.json"),
  "utf8"
);

const reply = (status, body = "", contentType = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
});
const OPAQUE_REDIRECT = { ok: false, status: 0, type: "opaqueredirect" };

const answer = (cb, message, sender) =>
  new Promise((resolve) => cb(message, sender, resolve));

const pingSession = async () =>
  (await answer(externalCb, { action: "ping" }, APP)).data.session;

describe("Train2Go is reported signed out only when it said so", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["the expired-session ping body", () => reply(200, EXPIRED)],
    ["a 401", () => reply(401)],
    ["a redirect to the sign-in page", () => OPAQUE_REDIRECT],
  ])("should answer the ping signed-out on %s", async (_case, response) => {
    // Arrange
    fetch.mockResolvedValueOnce(response());

    // Act
    const session = await pingSession();

    // Assert
    expect(session).toBe("signed-out");
  });

  it.each([
    ["a 403", () => reply(403)],
    ["a 503", () => reply(503)],
    ["a maintenance page", () => reply(200, "<html>Down</html>", "text/html")],
    [
      "a failure body that does not say unauthenticated",
      () => reply(200, JSON.stringify({ success: false, errors: ["Oops"] })),
    ],
  ])("should answer the ping not-answering on %s", async (_case, response) => {
    // Arrange
    fetch.mockResolvedValueOnce(response());

    // Act
    const session = await pingSession();

    // Assert
    expect(session).toBe("not-answering");
  });

  it("should answer the ping not-answering when the network fails", async () => {
    // Arrange
    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    // Act
    const session = await pingSession();

    // Assert
    expect(session).toBe("not-answering");
  });

  it("should give the popup's profile read not-answering on a 403", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(403));

    // Act
    const res = await answer(internalCb, { action: "read-profile" }, POPUP);

    // Assert
    expect(res.data.session).toBe("not-answering");
  });

  it("should refuse a request answered 403 with its status and no needsReauth", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(403));
    const message = { action: "request", method: "GET", path: "/user/details" };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toMatchObject({ ok: false, status: 403 });
    expect(res.needsReauth).toBeUndefined();
  });

  it("should flag a request answered 401 needsReauth", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(401));
    const message = { action: "request", method: "GET", path: "/user/details" };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
  });
});
