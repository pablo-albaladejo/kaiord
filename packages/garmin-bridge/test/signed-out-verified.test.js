import { afterEach, beforeEach, describe, expect, it } from "vitest";

// GLOSSARY, "What the athlete reads": a cause that was not verified is never
// stated. Garmin says the Session is gone when its own sign-in page answers
// without a ticket (no single-sign-on session to issue one from), or when a
// handshake step or a data call answers 401. A 429 (Garmin rate-limits its
// sign-in), a 403 or a 5xx is Garmin failing: the request fails with its
// status and no needsReauth.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const LIST = "/workout-service/workouts?start=0&limit=20";
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const reply = (status, body = "", contentType = "text/html") => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
  json: () => Promise.resolve(JSON.parse(body || "{}")),
});
const TICKET_PAGE = "<script>var url='...embed?ticket=ST-1-abc';</script>";
const OAUTH1 = "oauth_token=t&oauth_token_secret=s";

const read = () =>
  new Promise((resolve) => {
    externalCb({ action: "request", method: "GET", path: LIST }, APP, resolve);
  });

describe("Garmin is reported signed out only when it said so", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should flag a read needsReauth when Garmin's sign-in page issues no ticket", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(200, "<form id='login-form'></form>"));

    // Act
    const res = await read();

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
  });

  it("should flag a read needsReauth when the ticket exchange answers 401", async () => {
    // Arrange
    fetch
      .mockResolvedValueOnce(reply(200, TICKET_PAGE))
      .mockResolvedValueOnce(reply(401));

    // Act
    const res = await read();

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
  });

  it.each([
    ["a 429 from the sign-in page", [reply(429)]],
    ["a 503 from the sign-in page", [reply(503)]],
    ["a 403 from the ticket exchange", [reply(200, TICKET_PAGE), reply(403)]],
    ["a 500 from the ticket exchange", [reply(200, TICKET_PAGE), reply(500)]],
    [
      "a 503 from the token exchange",
      [reply(200, TICKET_PAGE), reply(200, OAUTH1), reply(503)],
    ],
  ])("should fail a read without needsReauth on %s", async (_case, replies) => {
    // Arrange
    for (const r of replies) fetch.mockResolvedValueOnce(r);

    // Act
    const res = await read();

    // Assert
    expect(res.ok).toBe(false);
    expect(res.needsReauth).toBeUndefined();
  });

  it("should keep the sign-in page's status on a 429", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(reply(429));

    // Act
    const res = await read();

    // Assert
    expect(res).toMatchObject({ ok: false, status: 429 });
  });
});
