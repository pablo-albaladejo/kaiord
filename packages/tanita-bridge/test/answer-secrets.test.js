import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TANITA_CSV_FIXTURE } from "../../tanita/src/test-utils/tanita-fixture.ts";

// ADR 0002: a Session token never travels to Kaiord. MyTANITA's export is
// CSV and carries no Session secret. When MyTANITA serves an HTML page in
// its place (a sign-in form carries an anti-forgery field), the page's
// token fields are removed before the App tab reads it.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const EXPORT = "/en/user/export-csv";
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

const ask = () =>
  new Promise((resolve) => {
    externalCb(
      { action: "request", method: "GET", path: EXPORT },
      APP,
      resolve
    );
  });

describe("the answer carries no MyTANITA Session secret", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should hand the export over byte for byte", async () => {
    // Arrange
    fetch.mockResolvedValueOnce(
      reply("application/csvm+json", TANITA_CSV_FIXTURE)
    );

    // Act
    const res = await ask();

    // Assert
    expect(res.data.body).toBe(TANITA_CSV_FIXTURE);
  });

  it("should remove the anti-forgery field of an HTML page served in its place", async () => {
    // Arrange
    const page =
      '<form action="/en/user/login" method="post">' +
      '<input type="hidden" name="_csrf_token" value="S">' +
      '<input name="username"><input type="password" name="password">' +
      "</form>";
    fetch.mockResolvedValueOnce(reply("text/html; charset=UTF-8", page));

    // Act
    const res = await ask();

    // Assert
    expect(res.data.body).toBe(
      '<form action="/en/user/login" method="post">' +
        '<input name="username"><input type="password" name="password">' +
        "</form>"
    );
  });
});

describe("the answer carries no personal field the Connector does not read", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should remove a prefilled email from a page served in place of the export", async () => {
    // Arrange
    const page =
      '<form><input type="email" name="email" value="a@b.c"><input type="password" name="pass"></form>';
    fetch.mockResolvedValueOnce(reply("text/html", page));

    // Act
    const res = await ask();

    // Assert
    expect(res.data.body).toBe(
      '<form><input type="password" name="pass"></form>'
    );
  });
});
