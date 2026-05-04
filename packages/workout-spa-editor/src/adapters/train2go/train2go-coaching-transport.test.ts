/**
 * Train2Go CoachingTransport adapter — tests for the wire→port wrapper.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTrain2GoCoachingTransport } from "./train2go-coaching-transport";

describe("createTrain2GoCoachingTransport", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).chrome = {
      runtime: {
        lastError: null as { message: string } | null,
        sendMessage: vi.fn(),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).chrome;
  });

  it("should expose train2go as the source identifier", () => {
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    expect(t.source).toBe("train2go");
  });

  it("should map Train2GoPingResult into CoachingPingResult shape via ping()", async () => {
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({
          ok: true,
          protocolVersion: 1,
          data: { sessionActive: true, userId: 28035, userName: "Pablo" },
        });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    const result = await t.ping();

    expect(result).toEqual({
      sessionActive: true,
      externalUserId: "28035",
      externalUserName: "Pablo",
    });
  });

  it("should preserve a userId larger than Number.MAX_SAFE_INTEGER as a string at the JSON parse boundary", async () => {
    // 9007199254740993 is one above Number.MAX_SAFE_INTEGER (2^53 - 1) and
    // cannot be represented losslessly as a JS number. The bridge extension's
    // JSON reviver delivers the raw digits as a string; the SPA-side
    // stringifyUserId() in toPingResult() must preserve it byte-identical
    // (string-equal), NOT call String(parsedNumber).
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({
          ok: true,
          protocolVersion: 1,
          data: {
            sessionActive: true,
            userId: "9007199254740993",
            userName: "Pablo",
          },
        });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    const result = await t.ping();

    expect(result.externalUserId).toBe("9007199254740993");
    expect(typeof result.externalUserId).toBe("string");
  });

  it("should resolve on success without throwing via openExternal()", async () => {
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: true });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    await expect(t.openExternal()).resolves.toBeUndefined();
  });

  it("should throw Session expired on session-expired error via readWeek()", async () => {
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: false, error: "Session expired" });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    await expect(t.readWeek("p1", "2026-04-13", "28035")).rejects.toThrow(
      "Session expired"
    );
  });

  it("should map wire activities to CoachingActivityRecord[] via readWeek()", async () => {
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({
          ok: true,
          data: {
            activities: [
              {
                id: 1,
                date: "2026-04-13",
                sport: "cycling",
                title: "FTP",
                duration: "01:00:00",
                workload: 3,
                status: 0,
              },
            ],
          },
        });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(
      () => "ext-id",
      () => "2026-04-28T10:00:00.000Z"
    );

    const result = await t.readWeek("p1", "2026-04-13", "28035");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("p1:train2go:1");
    expect(result[0]?.profileId).toBe("p1");
    expect(result[0]?.fetchedAt).toBe("2026-04-28T10:00:00.000Z");
  });

  it("should return empty array when wire response has no activities via readDay()", async () => {
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: true, data: { activities: [] } });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    const result = await t.readDay("p1", "2026-04-13", "28035");

    expect(result).toEqual([]);
  });

  it("should throw fallback message on generic transport error via readDay()", async () => {
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: false });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    await expect(t.readDay("p1", "2026-04-13", "28035")).rejects.toThrow(
      "Read day failed"
    );
  });

  it("should return a parsed ZonesPayload on success via readZones()", async () => {
    (globalThis as Record<string, unknown>).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn(
          (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
            cb({
              ok: true,
              protocolVersion: 1,
              data: {
                physiological: { weight: 83, bpmMax: 187 },
                paces: { cycling: { z4Upper: 268, z5Lower: 270 } },
                hrZones: { cycling: { z4Upper: 160 } },
              },
            });
          }
        ),
      },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    const result = await t.readZones?.("99999");

    expect(result?.physiological?.weight).toBe(83);
    expect(result?.paces?.cycling?.z4Upper).toBe(268);
    expect(result?.hrZones?.cycling?.z4Upper).toBe(160);
  });

  it("should return null when payload fails the Zod allowlist via readZones()", async () => {
    (globalThis as Record<string, unknown>).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn(
          (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
            cb({
              ok: true,
              data: { physiological: { weight: "not-a-number" } },
            });
          }
        ),
      },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    const result = await t.readZones?.("99999");

    expect(result).toBeNull();
  });

  it("should throw Session expired when the bridge reports it via readZones()", async () => {
    (globalThis as Record<string, unknown>).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn(
          (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
            cb({ ok: false, error: "Session expired" });
          }
        ),
      },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    await expect(t.readZones?.("99999")).rejects.toThrow("Session expired");
  });
});
