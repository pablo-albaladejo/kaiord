import { describe, expect, it, vi } from "vitest";

import type { ExtensionResponse } from "./bridge-transport";
import {
  BridgeAnswerRefusal,
  callThroughBridge,
  MALFORMED_ANSWER,
} from "./thin-bridge-request";

const raw = (body: string, status = 200, contentType = "application/json") => ({
  ok: true,
  delivered: true,
  protocolVersion: 2,
  data: { status, contentType, body },
});

const OLDER = {
  ok: false,
  delivered: true,
  protocolVersion: 1,
  error: "Origin or action not permitted",
  retryable: false,
};

const call = {
  method: "POST" as const,
  path: "/things",
  body: { name: "x" },
  legacy: { action: "push-thing", thing: { name: "x" } },
  read: (answer: { body: string }) => JSON.parse(answer.body) as unknown,
};

describe("callThroughBridge", () => {
  it("should send the one request with method, path and body, and read the raw answer", async () => {
    // Arrange
    const send = vi.fn(async () => raw('{"id":7}'));

    // Act
    const res = await callThroughBridge(send, call);

    // Assert
    expect(send).toHaveBeenCalledWith({
      action: "request",
      method: "POST",
      path: "/things",
      body: { name: "x" },
    });
    expect(res).toMatchObject({
      ok: true,
      protocolVersion: 2,
      data: { id: 7 },
    });
  });

  it("should send no body key for a read", async () => {
    // Arrange
    const send = vi.fn(async () => raw("[]"));

    // Act
    await callThroughBridge(send, { ...call, method: "GET", body: undefined });

    // Assert
    expect(send).toHaveBeenCalledWith({
      action: "request",
      method: "GET",
      path: "/things",
    });
  });

  it("should fall back to the legacy action for an extension one protocol behind", async () => {
    // Arrange
    const legacyAnswer = { ok: true, protocolVersion: 1, data: { id: 7 } };
    const send = vi
      .fn<(m: unknown) => Promise<ExtensionResponse>>()
      .mockResolvedValueOnce(OLDER)
      .mockResolvedValueOnce(legacyAnswer);

    // Act
    const res = await callThroughBridge(send, call);

    // Assert
    expect(send).toHaveBeenNthCalledWith(2, call.legacy);
    expect(res).toBe(legacyAnswer);
  });

  it("should not fall back when a current extension refuses", async () => {
    // Arrange
    const refusal = {
      ok: false,
      protocolVersion: 2,
      error: "Request failed: 404",
      status: 404,
    };
    const send = vi.fn(async () => refusal);

    // Act
    const res = await callThroughBridge(send, call);

    // Assert
    expect(send).toHaveBeenCalledTimes(1);
    expect(res).toBe(refusal);
  });

  it("should answer a raw answer it cannot read as malformed", async () => {
    // Arrange
    const send = vi.fn(async () => raw("not json"));

    // Act
    const res = await callThroughBridge(send, call);

    // Assert
    expect(res).toEqual({
      ok: false,
      delivered: true,
      protocolVersion: 2,
      error: MALFORMED_ANSWER,
    });
  });

  it("should answer an envelope that is not a raw answer as malformed", async () => {
    // Arrange
    const send = vi.fn(async () => ({
      ok: true,
      protocolVersion: 2,
      data: { csv: "x" },
    }));

    // Act
    const res = await callThroughBridge(send, call);

    // Assert
    expect(res.ok).toBe(false);
    expect(res.error).toBe(MALFORMED_ANSWER);
  });

  it("should carry what a reader refuses, such as a dead Session, on the envelope", async () => {
    // Arrange
    const send = vi.fn(async () => raw("<html>", 200, "text/html"));
    const read = () => {
      throw new BridgeAnswerRefusal("Session expired", { needsReauth: true });
    };

    // Act
    const res = await callThroughBridge(send, { ...call, read });

    // Assert
    expect(res).toEqual({
      ok: false,
      delivered: true,
      protocolVersion: 2,
      error: "Session expired",
      needsReauth: true,
    });
  });
});
