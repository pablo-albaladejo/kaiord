// Kaiord Bridge Core — vendored unit tests for session-fetch.js.
// Master: packages/_shared/bridge-core/test/session-fetch.test.js. Never edit
// a vendored copy — edit the master and run `pnpm bridge:sync`. Every
// cookie-session bridge runs this suite against its own vendored transport.
// The origin and allowlist below are neutral stand-ins: each bridge supplies
// its real ones, and its own background suite tests them.
import { describe, it, expect } from "vitest";

const {
  isPathAllowed,
  isSessionRedirect,
  isAuthChallenge,
  cookieSessionFetch,
} = require("../session-fetch.js");

const OK_STATUS = 200;
const FOUND_STATUS = 302;
const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;
const SERVER_ERROR_STATUS = 500;
const OPAQUE_REDIRECT_STATUS = 0;

const EXPORT_PATH = "/export";
const EXPORT_URL = `https://integration.invalid${EXPORT_PATH}`;
const ALLOW_RULES = [{ method: "GET", pattern: /^\/export$/ }];
const SAMPLE_BODY = '"Date","Value"\n"2026-07-01","70.5"';

const makeResponse = ({
  ok = true,
  status = OK_STATUS,
  type = "basic",
  redirected = false,
  contentType = "text/csv",
  body = SAMPLE_BODY,
}) => ({
  ok,
  status,
  type,
  redirected,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
});

describe("session-fetch (vendored)", () => {
  describe("isPathAllowed", () => {
    it("should allow a GET matching an allowlist rule", () => {
      // Arrange
      const method = "GET";

      // Act
      const allowed = isPathAllowed(ALLOW_RULES, method, EXPORT_PATH);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should treat a missing method as GET", () => {
      // Arrange
      const method = undefined;

      // Act
      const allowed = isPathAllowed(ALLOW_RULES, method, EXPORT_PATH);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should deny a method mismatch", () => {
      // Arrange
      const method = "POST";

      // Act
      const allowed = isPathAllowed(ALLOW_RULES, method, EXPORT_PATH);

      // Assert
      expect(allowed).toBe(false);
    });

    it("should deny a path mismatch", () => {
      // Arrange
      const path = `${EXPORT_PATH}-all`;

      // Act
      const allowed = isPathAllowed(ALLOW_RULES, "GET", path);

      // Assert
      expect(allowed).toBe(false);
    });
  });

  describe("isSessionRedirect", () => {
    it("should flag an opaqueredirect response", () => {
      // Arrange
      const response = {
        type: "opaqueredirect",
        status: OPAQUE_REDIRECT_STATUS,
      };

      // Act
      const flagged = isSessionRedirect(response);

      // Assert
      expect(flagged).toBe(true);
    });

    it("should flag a 3xx status", () => {
      // Arrange
      const response = { type: "basic", status: FOUND_STATUS };

      // Act
      const flagged = isSessionRedirect(response);

      // Assert
      expect(flagged).toBe(true);
    });

    it("should flag a response the runtime already followed", () => {
      // Arrange
      const response = { type: "basic", status: OK_STATUS, redirected: true };

      // Act
      const flagged = isSessionRedirect(response);

      // Assert
      expect(flagged).toBe(true);
    });

    it("should not flag a 200 response", () => {
      // Arrange
      const response = { type: "basic", status: OK_STATUS, redirected: false };

      // Act
      const flagged = isSessionRedirect(response);

      // Assert
      expect(flagged).toBe(false);
    });
  });

  describe("isAuthChallenge", () => {
    it("should flag 401 and 403 responses", () => {
      // Arrange
      const responses = [
        { status: UNAUTHORIZED_STATUS },
        { status: FORBIDDEN_STATUS },
      ];

      // Act
      const flags = responses.map(isAuthChallenge);

      // Assert
      expect(flags).toEqual([true, true]);
    });

    it("should not flag a 200 response", () => {
      // Arrange
      const response = { status: OK_STATUS };

      // Act
      const flagged = isAuthChallenge(response);

      // Assert
      expect(flagged).toBe(false);
    });
  });

  describe("cookieSessionFetch", () => {
    it("should send cookies and return the raw body on a 2xx response", async () => {
      // Arrange
      const calls = [];
      const fetchImpl = (url, init) => {
        calls.push([url, init]);
        return Promise.resolve(makeResponse({ ok: true }));
      };

      // Act
      const result = await cookieSessionFetch({ url: EXPORT_URL, fetchImpl });

      // Assert
      expect(result).toEqual({
        ok: true,
        status: OK_STATUS,
        body: SAMPLE_BODY,
        contentType: "text/csv",
      });
      expect(calls[0][1].credentials).toBe("include");
      expect(calls[0][1].redirect).toBe("manual");
    });

    it("should return needsReauth on a redirect", async () => {
      // Arrange
      const fetchImpl = () =>
        Promise.resolve(
          makeResponse({
            ok: false,
            type: "opaqueredirect",
            status: OPAQUE_REDIRECT_STATUS,
          })
        );

      // Act
      const result = await cookieSessionFetch({ url: EXPORT_URL, fetchImpl });

      // Assert
      expect(result).toMatchObject({ ok: false, needsReauth: true });
    });

    it("should return needsReauth on a 401 auth challenge", async () => {
      // Arrange
      const fetchImpl = () =>
        Promise.resolve(
          makeResponse({ ok: false, status: UNAUTHORIZED_STATUS })
        );

      // Act
      const result = await cookieSessionFetch({ url: EXPORT_URL, fetchImpl });

      // Assert
      expect(result).toMatchObject({ ok: false, needsReauth: true });
    });

    it("should surface a non-2xx status without needsReauth", async () => {
      // Arrange
      const fetchImpl = () =>
        Promise.resolve(
          makeResponse({ ok: false, status: SERVER_ERROR_STATUS })
        );

      // Act
      const result = await cookieSessionFetch({ url: EXPORT_URL, fetchImpl });

      // Assert
      expect(result).toEqual({
        ok: false,
        status: SERVER_ERROR_STATUS,
        error: `Request failed: ${SERVER_ERROR_STATUS}`,
      });
    });
  });
});
