import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// ADR 0002: a Session token never travels to Kaiord. Train2Go's pages carry
// its anti-forgery token (`<input name="_token">`), tied to the athlete's
// Session; the extension removes it from every answer before the App tab
// reads it. The fixtures are Train2Go's own answers, sanitized.

require("../background.js");

const FIXTURES = join(import.meta.dirname, "fixtures");
const fixture = (name) => readFileSync(join(FIXTURES, name), "utf8");

const APP = { origin: "https://kaiord.com" };
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const reply = (contentType, body) => ({
  ok: true,
  status: 200,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
});

const ask = (path) =>
  new Promise((resolve) => {
    externalCb({ action: "request", method: "GET", path }, APP, resolve);
  });

const DAILY = "/api/v2/workplan/daily/2026-06-07?user=99999";

describe("the answer carries no Train2Go Session secret", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should remove the anti-forgery token from the profile page and keep the rest", async () => {
    // Arrange
    const page = fixture("details-active.html");
    const tokenInput =
      '<input name="_token" type="hidden" value="TEST_CSRF" />';
    fetch.mockResolvedValueOnce(reply("text/html; charset=UTF-8", page));

    // Act
    const res = await ask("/user/details");

    // Assert
    expect(res.ok).toBe(true);
    expect(res.data.body).toBe(page.replace(tokenInput, ""));
    expect(res.data.body).not.toContain("TEST_CSRF");
    expect(res.data.contentType).toBe("text/html; charset=UTF-8");
  });

  it("should keep the hidden inputs the App reads zones by", async () => {
    // Arrange
    const page = fixture("details-active.html");
    fetch.mockResolvedValueOnce(reply("text/html", page));

    // Act
    const res = await ask("/user/details");

    // Assert
    expect(res.data.body).toContain(
      '<input name="sport_id" type="hidden" value="3" />'
    );
    expect(res.data.body).toContain(
      '<input name="user_id" type="hidden" value="99999" />'
    );
  });

  it("should remove the token from the HTML a daily answer wraps in JSON", async () => {
    // Arrange
    const html = fixture("daily-with-comments.html");
    const body = JSON.stringify({ data: { content: html }, success: true });
    fetch.mockResolvedValueOnce(reply("application/json", body));

    // Act
    const res = await ask(DAILY);

    // Assert
    const content = JSON.parse(res.data.body).data.content;
    expect(content).toBe(
      html.replace('<input name="_token" type="hidden" value="TOKEN" />', "")
    );
    expect(content).toContain(
      '<input required name="date" type="hidden" value="2026-06-07" />'
    );
  });

  it("should hand an answer with no secret over byte for byte", async () => {
    // Arrange
    const body = fixture("ping-active.json");
    fetch.mockResolvedValueOnce(reply("application/json", body));

    // Act
    const res = await ask("/api/v2/profile/ping");

    // Assert
    expect(res.data.body).toBe(body);
  });

  it("should remove the csrf meta tags and blank an inline csrf token", async () => {
    // Arrange
    const page =
      '<head><meta name="csrf-token" content="SECRET1">' +
      '<meta name="csrf-param" content="_token">' +
      '<script>window.Laravel = {"csrfToken":"SECRET2"};</script>' +
      "</head><body><p>zones</p></body>";
    fetch.mockResolvedValueOnce(reply("text/html", page));

    // Act
    const res = await ask("/user/details");

    // Assert
    expect(res.data.body).toBe(
      '<head><script>window.Laravel = {"csrfToken":""};</script>' +
        "</head><body><p>zones</p></body>"
    );
  });
});
