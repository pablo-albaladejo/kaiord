import { describe, it, expect, beforeEach, vi } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  TANITA_ORIGIN,
  EXPORT_CSV_PATH,
  isAllowed,
  looksLikeHtml,
  readExportCsv,
  checkSession,
  handleAction,
  EXTERNAL_ACTIONS,
} = require("../background.js");
const pkg = require("../package.json");

// External senders are origin-pinned by the vendored envelope guard; the
// positive paths use an allowed SPA origin, the negative paths a foreign one.
const SPA_ORIGIN = "https://app.kaiord.com";
const FOREIGN_ORIGIN = "https://attacker.example";
const SPA_SENDER = { origin: SPA_ORIGIN };

const EXPECTED_PROTOCOL_VERSION = 1;
const HTTP_OK = 200;
const HTTP_FOUND = 302;
const OPAQUE_REDIRECT_STATUS = 0;

const SAMPLE_CSV = '"Date","Weight (kg)"\n"2026-07-01","70.5"';
// A distinctive body used to assert it is never written to any console sink.
const SECRET_CSV = "SUPER-SECRET-EXPORT-BODY-0f9a1c";
const LOGIN_HTML = "<!doctype html><html><body>please sign in</body></html>";

// Listener callbacks are captured at import time; __resetChromeMock clears
// the mock call log in beforeEach, so grab them once at module scope.
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

// Minimal Response doubles for the SW `fetch(url, init)` call. cookieSessionFetch
// reads .type/.redirected/.status/.ok/.headers.get/.text().
const csvResponse = (body, status = HTTP_OK) => ({
  ok: status >= HTTP_OK && status < 300,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => "text/csv" },
  text: () => Promise.resolve(body),
});
const htmlResponse = (body) => ({
  ok: true,
  status: HTTP_OK,
  type: "basic",
  redirected: false,
  headers: { get: () => "text/html" },
  text: () => Promise.resolve(body),
});
const opaqueRedirectResponse = () => ({
  ok: false,
  status: OPAQUE_REDIRECT_STATUS,
  type: "opaqueredirect",
  redirected: false,
  headers: { get: () => "" },
  text: () => Promise.resolve(""),
});
const redirectResponse = (status) => ({
  ok: false,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => "" },
  text: () => Promise.resolve(""),
});

describe("background.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("PROTOCOL_VERSION", () => {
    it("should be 1", () => {
      // Arrange
      const expected = EXPECTED_PROTOCOL_VERSION;

      // Act
      const actual = PROTOCOL_VERSION;

      // Assert
      expect(actual).toBe(expected);
    });
  });

  describe("BRIDGE_MANIFEST", () => {
    it("should have the pinned tanita-bridge shape", () => {
      // Arrange
      const expected = {
        id: "tanita-bridge",
        name: "Tanita",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:body"],
      };

      // Act
      const actual = BRIDGE_MANIFEST;

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should match the package.json version (no publish drift)", () => {
      // Arrange
      const expected = pkg.version;

      // Act
      const actual = BRIDGE_MANIFEST.version;

      // Assert
      expect(actual).toBe(expected);
    });
  });

  describe("EXTERNAL_ACTIONS origin pinning", () => {
    it("should expose exactly the read + session probe surface", () => {
      // Arrange
      const expected = ["ping", "checkSession", "read-export-csv"];

      // Act
      const actual = [...EXTERNAL_ACTIONS];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should reject a foreign origin without invoking the handler", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb(
        { action: "read-export-csv" },
        { origin: FOREIGN_ORIGIN },
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(fetch).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });

    it("should reject an empty sender for an allowlisted action", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(fetch).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });

    it("should wrap a checkSession probe in the SPA envelope for an allowed origin", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(csvResponse(SAMPLE_CSV));
      const sendResponse = vi.fn();

      // Act
      externalCb({ action: "ping" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(sendResponse.mock.calls[0][0]).toMatchObject({
        ok: true,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        data: { id: "tanita-bridge", authenticated: true },
      });
    });
  });

  describe("isAllowed", () => {
    it("should allow GET /en/user/export-csv", () => {
      // Arrange
      const method = "GET";

      // Act
      const allowed = isAllowed(method, EXPORT_CSV_PATH);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should deny POST on the export path", () => {
      // Arrange
      const method = "POST";

      // Act
      const allowed = isAllowed(method, EXPORT_CSV_PATH);

      // Assert
      expect(allowed).toBe(false);
    });

    it("should deny a look-alike export path", () => {
      // Arrange
      const lookAlikes = ["/en/user/export-csv-all", "/en/user/export", "/en/user/export-csv/"];

      // Act
      const results = lookAlikes.map((path) => isAllowed("GET", path));

      // Assert
      expect(results).toEqual([false, false, false]);
    });
  });

  describe("read-export-csv", () => {
    it("should return the raw csv on a 200 text/csv response", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(csvResponse(SAMPLE_CSV));

      // Act
      const result = await readExportCsv();

      // Assert
      expect(result).toEqual({ csv: SAMPLE_CSV });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(`${TANITA_ORIGIN}${EXPORT_CSV_PATH}`);
      expect(init.credentials).toBe("include");
      expect(init.redirect).toBe("manual");
    });

    it("should throw needsReauth on an opaqueredirect (dead session)", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const attempt = readExportCsv();

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });

    it("should throw needsReauth on a 3xx redirect", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(redirectResponse(HTTP_FOUND));

      // Act
      const attempt = readExportCsv();

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });

    it("should throw needsReauth when a 200 body is a login page", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(htmlResponse(LOGIN_HTML));

      // Act
      const attempt = readExportCsv();

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });
  });

  describe("looksLikeHtml", () => {
    it("should flag an html content-type or a leading html tag", () => {
      // Arrange
      const byContentType = looksLikeHtml("text/html; charset=utf-8", "x");
      const byBody = looksLikeHtml("", "<!doctype html><html></html>");
      const csv = looksLikeHtml("text/csv", '"Date","Weight"');

      // Act
      const results = [byContentType, byBody, csv];

      // Assert
      expect(results).toEqual([true, true, false]);
    });
  });

  describe("checkSession", () => {
    it("should report authenticated true on a reachable export", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(csvResponse(SAMPLE_CSV));

      // Act
      const result = await checkSession();

      // Assert
      expect(result.authenticated).toBe(true);
      expect(result).toMatchObject({
        id: "tanita-bridge",
        name: "Tanita",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:body"],
      });
    });

    it("should report authenticated false when the session is dead", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const result = await checkSession();

      // Assert
      expect(result.authenticated).toBe(false);
    });

    it("should report only a boolean flag, never the csv body", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(csvResponse(SECRET_CSV));

      // Act
      const result = await checkSession();

      // Assert
      expect(typeof result.authenticated).toBe("boolean");
      expect(JSON.stringify(result)).not.toContain(SECRET_CSV);
    });
  });

  describe("handleAction", () => {
    it("should reject an unknown action", async () => {
      // Arrange
      const message = { action: "delete-everything" };

      // Act
      const attempt = handleAction(message);

      // Assert
      await expect(attempt).rejects.toThrow("Unknown action: delete-everything");
    });
  });

  describe("credential safety", () => {
    it("should never write the csv body to any console sink", async () => {
      // Arrange
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      fetch.mockResolvedValueOnce(csvResponse(SECRET_CSV));

      // Act
      await readExportCsv();

      // Assert
      const logged = [
        ...logSpy.mock.calls,
        ...errorSpy.mock.calls,
        ...warnSpy.mock.calls,
      ]
        .flat()
        .join(" ");
      expect(logged).not.toContain(SECRET_CSV);
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe("onMessage listener", () => {
    it("should return true to keep the internal response channel open", () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      const result = internalCb({ action: "ping" }, {}, sendResponse);

      // Assert
      expect(result).toBe(true);
    });
  });
});
