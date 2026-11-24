/**
 * The one call every Connector makes through its Bridge, at the message
 * contract: the request on the current protocol and the legacy action on
 * the previous one, each leg with the call's timeout, JSON read the same
 * way, and a failed envelope turned into the error its Connector throws.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  currentExtension,
  json,
  previousExtension,
  uninstallFakeExtension,
} from "../../test-utils/fake-bridge-extension";
import type { ExtensionResponse } from "./bridge-transport";
import {
  answerOrThrow,
  asksRedetect,
  callConnector,
  readJson,
} from "./connector-call";

const EXT = "ext-1";
const TIMEOUT_MS = 1_234;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const READ = {
  method: "GET" as const,
  path: "/thing",
  legacy: { action: "read-thing" },
  read: readJson,
};

afterEach(() => uninstallFakeExtension());

describe("callConnector", () => {
  it("should ask the current extension once and read its JSON answer", async () => {
    // Arrange
    const sent = currentExtension({ "GET /thing": json({ a: 1 }) });

    // Act
    const res = await callConnector(EXT, READ, TIMEOUT_MS);

    // Assert
    expect(sent).toEqual([
      { action: "request", method: "GET", path: "/thing" },
    ]);
    expect(res).toMatchObject({ ok: true, data: { a: 1 } });
  });

  it("should ask an extension one protocol behind the legacy action", async () => {
    // Arrange
    const sent = previousExtension({ "read-thing": { a: 2 } });

    // Act
    const res = await callConnector(EXT, READ, TIMEOUT_MS);

    // Assert
    expect(sent.map((m) => m.action)).toEqual(["request", "read-thing"]);
    expect(res).toMatchObject({ ok: true, data: { a: 2 } });
  });

  it("should send each leg with the call's timeout", async () => {
    // Arrange
    const send = vi.fn(async (): Promise<ExtensionResponse> => ({
      ok: true,
      protocolVersion: 2,
      data: { status: 200, contentType: "application/json", body: "" },
    }));

    // Act
    await callConnector(EXT, READ, TIMEOUT_MS, send);

    // Assert
    expect(send).toHaveBeenCalledWith(
      EXT,
      expect.objectContaining({ action: "request" }),
      TIMEOUT_MS
    );
  });
});

describe("readJson", () => {
  it("should read an empty body as null", () => {
    // Arrange
    const answer = { status: 204, contentType: "", body: "" };

    // Act
    const data = readJson(answer);

    // Assert
    expect(data).toBeNull();
  });
});

describe("asksRedetect", () => {
  it.each([
    [UNAUTHORIZED, true],
    [FORBIDDEN, true],
    [NOT_FOUND, false],
    [undefined, false],
  ])("should re-detect after a %s: %s", (status, expected) => {
    // Arrange
    const res: ExtensionResponse = { ok: false, status };

    // Act
    const redetect = asksRedetect(res);

    // Assert
    expect(redetect).toBe(expected);
  });
});

describe("answerOrThrow", () => {
  it("should hand back an answer that worked", () => {
    // Arrange
    const res: ExtensionResponse = { ok: true, data: 1 };

    // Act
    const out = answerOrThrow(res, "fallback", (f) => new Error(f.message));

    // Assert
    expect(out).toBe(res);
  });

  it("should throw the Connector's error with what the envelope says", () => {
    // Arrange
    const res: ExtensionResponse = {
      ok: false,
      delivered: true,
      status: 403,
      error: "Request failed: 403",
    };

    // Act
    const attempt = () =>
      answerOrThrow(res, "fallback", (f) => Object.assign(new Error(), f));

    // Assert
    expect(attempt).toThrow(
      expect.objectContaining({
        message: "Request failed: 403",
        needsReauth: false,
        delivered: true,
        status: 403,
        redetect: true,
      })
    );
  });

  it("should fall back to the Connector's message and an undelivered failure", () => {
    // Arrange
    const res: ExtensionResponse = { ok: false, delivered: false };

    // Act
    const attempt = () =>
      answerOrThrow(res, "fallback", (f) => Object.assign(new Error(), f));

    // Assert
    expect(attempt).toThrow(
      expect.objectContaining({ message: "fallback", delivered: false })
    );
  });
});
