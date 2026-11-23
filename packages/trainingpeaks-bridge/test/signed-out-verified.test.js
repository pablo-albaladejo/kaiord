import { afterEach, beforeEach, describe, expect, it } from "vitest";

// GLOSSARY, "What the athlete reads": a cause that was not verified is never
// stated. TrainingPeaks says the Session is gone when its token endpoint
// answers 401 (docs/connectors-research/trainingpeaks.md: "401 -> cookie
// expired/invalid") or bounces to its sign-in page; a data call says so
// with a 401 that survives a fresh token. A 403, a 5xx, or a 200 that holds
// no token (an HTML page, an empty JSON) is not that: the request fails
// with its status and no needsReauth.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const METRICS =
  "/metrics/v3/athletes/123/consolidatedtimedmetrics/2026-11-01/2026-11-23";
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const reply = (status, body = "", contentType = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
});

const read = () =>
  new Promise((resolve) => {
    externalCb(
      { action: "request", method: "GET", path: METRICS },
      APP,
      resolve
    );
  });

describe("TrainingPeaks is reported signed out only when it said so", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["a 401 from the token endpoint", () => reply(401)],
    [
      "a redirect to the sign-in page",
      () => ({ ok: false, status: 0, type: "opaqueredirect" }),
    ],
  ])("should flag a read needsReauth on %s", async (_case, response) => {
    // Arrange
    fetch.mockResolvedValueOnce(response());

    // Act
    const res = await read();

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
  });

  it.each([
    ["a 403 from the token endpoint", () => reply(403)],
    ["a 503 from the token endpoint", () => reply(503)],
    [
      "an HTML page from the token endpoint",
      () => reply(200, "<html/>", "text/html"),
    ],
    ["a JSON answer with no token", () => reply(200, '{"success":false}')],
  ])(
    "should fail a read without needsReauth on %s",
    async (_case, response) => {
      // Arrange
      fetch.mockResolvedValueOnce(response());

      // Act
      const res = await read();

      // Assert
      expect(res.ok).toBe(false);
      expect(res.needsReauth).toBeUndefined();
    }
  );

  it("should keep the token endpoint's status on a 403", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(403));

    // Act
    const res = await read();

    // Assert
    expect(res).toMatchObject({ ok: false, status: 403 });
  });
});
