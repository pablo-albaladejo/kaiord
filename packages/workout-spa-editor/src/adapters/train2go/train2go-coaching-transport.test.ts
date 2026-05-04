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
    // Arrange

    // Act
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    // Assert
    expect(t.source).toBe("train2go");
  });

  it("should map Train2GoPingResult into CoachingPingResult shape via ping()", async () => {
    // Arrange
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

    // Act
    const result = await t.ping();

    // Assert
    expect(result).toEqual({
      sessionActive: true,
      externalUserId: "28035",
      externalUserName: "Pablo",
    });
  });

  it("should preserve a userId larger than Number.MAX_SAFE_INTEGER as a string at the JSON parse boundary", async () => {
    // Arrange
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

    // Act
    const result = await t.ping();

    // Assert
    expect(result.externalUserId).toBe("9007199254740993");
    expect(typeof result.externalUserId).toBe("string");
  });

  it("should resolve on success without throwing via openExternal()", async () => {
    // Arrange
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: true });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };

    // Act
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    // Assert
    await expect(t.openExternal()).resolves.toBeUndefined();
  });

  it("should throw Session expired on session-expired error via readWeek()", async () => {
    // Arrange
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: false, error: "Session expired" });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };

    // Act
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    // Assert
    await expect(t.readWeek("p1", "2026-04-13", "28035")).rejects.toThrow(
      "Session expired"
    );
  });

  it("should map wire activities to CoachingActivityRecord[] via readWeek()", async () => {
    // Arrange
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

    // Act
    const result = await t.readWeek("p1", "2026-04-13", "28035");

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("p1:train2go:1");
    expect(result[0]?.profileId).toBe("p1");
    expect(result[0]?.fetchedAt).toBe("2026-04-28T10:00:00.000Z");
  });

  it("should return empty array when wire response has no activities via readDay()", async () => {
    // Arrange
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: true, data: { activities: [] } });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    // Act
    const result = await t.readDay("p1", "2026-04-13", "28035");

    // Assert
    expect(result).toEqual([]);
  });

  it("should throw fallback message on generic transport error via readDay()", async () => {
    // Arrange
    const mockSend = vi.fn(
      (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
        cb({ ok: false });
      }
    );
    (globalThis as Record<string, unknown>).chrome = {
      runtime: { lastError: null, sendMessage: mockSend },
    };

    // Act
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    // Assert
    await expect(t.readDay("p1", "2026-04-13", "28035")).rejects.toThrow(
      "Read day failed"
    );
  });

  it("should return a parsed ZonesPayload on success via readZones()", async () => {
    // Arrange
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

    // Act
    const result = await t.readZones?.("99999");

    // Assert
    expect(result?.physiological?.weight).toBe(83);
    expect(result?.paces?.cycling?.z4Upper).toBe(268);
    expect(result?.hrZones?.cycling?.z4Upper).toBe(160);
  });

  it("should return null when payload fails the Zod allowlist via readZones()", async () => {
    // Arrange
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

    // Act
    const result = await t.readZones?.("99999");

    // Assert
    expect(result).toBeNull();
  });

  it("should throw Session expired when the bridge reports it via readZones()", async () => {
    // Arrange
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

    // Act
    const t = createTrain2GoCoachingTransport(() => "ext-id");

    // Assert
    await expect(t.readZones?.("99999")).rejects.toThrow("Session expired");
  });
});
