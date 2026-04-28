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

  it("source identifier is train2go", () => {
    const t = createTrain2GoCoachingTransport(() => "ext-id");
    expect(t.source).toBe("train2go");
  });

  it("ping() maps Train2GoPingResult into CoachingPingResult shape", async () => {
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

  it("openExternal() resolves on success without throwing", async () => {
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

  it("readWeek() throws Session expired on session-expired error", async () => {
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

  it("readWeek() maps wire activities to CoachingActivityRecord[]", async () => {
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

  it("readDay() returns empty array when wire response has no activities", async () => {
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

  it("readDay() throws fallback message on generic transport error", async () => {
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
});
