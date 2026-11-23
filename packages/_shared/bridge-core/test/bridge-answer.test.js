/**
 * Kaiord Bridge Core — Answer unit tests (vendored)
 *
 * Master: packages/_shared/bridge-core/test/bridge-answer.test.js.
 * Never edit a vendored copy — edit the master and run `pnpm bridge:sync`.
 */
import { describe, expect, it } from "vitest";

const { stripSessionSecrets, toAnswer } = require("../bridge-answer.js");

describe("bridge-answer: Session secrets in HTML", () => {
  it.each([
    '<input name="_token" type="hidden" value="S">',
    "<input type='hidden' name='csrf_token' value='S' />",
    '<input type="hidden" name=authenticity_token value="S">',
    '<input type="hidden" name="session_key" value="S">',
    '<input type="hidden" name="form_nonce" value="S">',
    '<meta name="csrf-token" content="S">',
    '<meta name="csrf-param" content="_token" />',
    '<META NAME="XSRF-TOKEN" CONTENT="S">',
  ])("should remove %s", (tag) => {
    // Arrange
    const page = `<form>${tag}<input name="weight" value="70"></form>`;

    // Act
    const out = stripSessionSecrets("text/html", page);

    // Assert
    expect(out).toBe('<form><input name="weight" value="70"></form>');
  });

  it.each([
    ['{"csrfToken":"S"}', '{"csrfToken":""}'],
    ["csrf_token = 'S';", "csrf_token = '';"],
    ['"_token": "S"', '"_token": ""'],
  ])("should blank the inline token in %s", (script, expected) => {
    // Arrange
    const page = `<script>${script}</script>`;

    // Act
    const out = stripSessionSecrets("text/html", page);

    // Assert
    expect(out).toBe(`<script>${expected}</script>`);
  });

  it("should keep inputs and metas whose names are not secrets", () => {
    // Arrange
    const page =
      '<meta name="viewport" content="w"><input name="sport_id" type="hidden" value="3">' +
      '<input name="user_id" type="hidden" value="9">';

    // Act
    const out = stripSessionSecrets("text/html", page);

    // Assert
    expect(out).toBe(page);
  });

  it("should strip a body with no content type as text", () => {
    // Arrange
    const page = '<input name="_token" value="S">ok';

    // Act
    const out = stripSessionSecrets("", page);

    // Assert
    expect(out).toBe("ok");
  });
});

describe("bridge-answer: Session secrets in JSON", () => {
  it("should drop credential keys at any depth and keep everything else", () => {
    // Arrange
    const body = JSON.stringify({
      access_token: "S",
      data: { id: 7, sessionId: "S", items: [{ csrfToken: "S", n: 1 }] },
    });

    // Act
    const out = stripSessionSecrets("application/json", body);

    // Assert
    expect(JSON.parse(out)).toEqual({ data: { id: 7, items: [{ n: 1 }] } });
  });

  it("should strip the HTML a JSON string member carries", () => {
    // Arrange
    const body = JSON.stringify({
      data: { content: '<input name="_token" value="S"><p>x</p>' },
    });

    // Act
    const out = stripSessionSecrets("application/json; charset=utf-8", body);

    // Assert
    expect(JSON.parse(out)).toEqual({ data: { content: "<p>x</p>" } });
  });

  it("should hand JSON with no secret over byte for byte", () => {
    // Arrange
    const body = '{ "isSessionTransitionEnabled": true, "ownerId": 12 }';

    // Act
    const out = stripSessionSecrets("application/json", body);

    // Assert
    expect(out).toBe(body);
  });

  it("should strip a body labelled JSON that does not parse as text", () => {
    // Arrange
    const body = '<input name="_token" value="S">down';

    // Act
    const out = stripSessionSecrets("application/json", body);

    // Assert
    expect(out).toBe("down");
  });
});

describe("bridge-answer: toAnswer", () => {
  it("should keep status and content type and strip the body", () => {
    // Arrange
    const res = {
      ok: true,
      status: 200,
      contentType: "text/html",
      body: '<input name="_token" value="S">ok',
      needsReauth: true,
    };

    // Act
    const answer = toAnswer(res);

    // Assert
    expect(answer).toEqual({
      status: 200,
      contentType: "text/html",
      body: "ok",
    });
  });

  it.each([[""], [undefined]])(
    "should hand an empty body %j over as it is",
    (body) => {
      // Arrange
      const res = { status: 204, contentType: "", body };

      // Act
      const answer = toAnswer(res);

      // Assert
      expect(answer.body).toBe(body);
    }
  );
});
