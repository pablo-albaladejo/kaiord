/**
 * After a send to TrainingPeaks got no answer, the next send of that
 * Workout reads the day first. Each branch: nothing to check, an entry of
 * the same title (ask), none (send), a read that fails (ask, saying it
 * could not check), and the athlete's "send anyway".
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { recordUnansweredSend } from "./record-unanswered-send";
import type { TrainingPeaksDayPort } from "./trainingpeaks-day-port";
import { checkUnansweredSend } from "./unanswered-send";

const RECORD = "22222222-2222-4222-8222-222222222222";
const BRIDGE = "trainingpeaks-bridge";
const KEY = { kaiordRecordId: RECORD, destinationBridgeId: BRIDGE };
const DAY = "2026-11-24";
const AT = "2026-11-24T07:00:00.000Z";
const SENT = { day: DAY, title: "Easy run", at: AT, contentHash: "h1" };

const committed: ExportLedgerEntry = {
  id: "33333333-3333-4333-8333-333333333333",
  kaiordRecordId: RECORD,
  dataType: "workout",
  destinationBridgeId: BRIDGE,
  destinationExternalId: "5000",
  contentHash: "h0",
  exportedAt: "2026-11-20T07:00:00.000Z",
  updatedAt: "2026-11-20T07:00:00.000Z",
  destinationDate: "2026-11-20",
};

/** A TrainingPeaks day that holds titles; `down` fails the read. */
const fakeDay = () => {
  const state = { titles: [] as string[], down: false, reads: [] as string[] };
  const port: TrainingPeaksDayPort = {
    titlesOn: async (day) => {
      state.reads.push(day);
      return state.down ? { ok: false } : { ok: true, titles: state.titles };
    },
  };
  return { state, port };
};

let repo: ReturnType<typeof createInMemoryExportLedgerRepository>;
let day: ReturnType<typeof fakeDay>;
const deps = () => ({
  ledgerRepo: repo,
  destinationBridgeId: BRIDGE,
  days: day.port,
  sleep: async () => undefined,
});
const row = () => repo.findByNaturalKey(KEY);

beforeEach(() => {
  repo = createInMemoryExportLedgerRepository();
  day = fakeDay();
});

describe("checkUnansweredSend", () => {
  it("should let a send through without reading when every earlier send was answered", async () => {
    // Arrange
    repo.store.set(`${RECORD}\u0000${BRIDGE}`, committed);

    // Act
    const verdict = await checkUnansweredSend(deps(), RECORD, false);

    // Assert
    expect(verdict).toEqual({ blocked: false });
    expect(day.state.reads).toEqual([]);
  });

  it("should not send and ask when the day holds a workout of the same title", async () => {
    // Arrange
    await recordUnansweredSend(deps(), RECORD, SENT);
    day.state.titles = ["Recovery", " Easy run "];
    const before = await row();

    // Act
    const verdict = await checkUnansweredSend(deps(), RECORD, false);

    // Assert
    expect(verdict).toEqual({
      blocked: true,
      reason: "may-be-there",
      date: DAY,
    });
    expect(day.state.reads).toEqual([DAY]);
    expect(await row()).toEqual(before);
  });

  it("should let the send through and forget the unanswered send when the day holds no such workout", async () => {
    // Arrange
    await recordUnansweredSend(deps(), RECORD, SENT);
    day.state.titles = ["Recovery"];

    // Act
    const verdict = await checkUnansweredSend(deps(), RECORD, false);

    // Assert
    expect(verdict).toEqual({ blocked: false });
    expect(await row()).toBeUndefined();
  });

  it("should say it could not check when the day cannot be read", async () => {
    // Arrange
    await recordUnansweredSend(deps(), RECORD, SENT);
    day.state.down = true;

    // Act
    const verdict = await checkUnansweredSend(deps(), RECORD, false);

    // Assert
    expect(verdict).toEqual({ blocked: true, reason: "unchecked", date: DAY });
    expect((await row())?.unansweredSend).toEqual({
      day: DAY,
      title: "Easy run",
      at: AT,
    });
  });

  it("should let the athlete send anyway without reading the day", async () => {
    // Arrange
    await recordUnansweredSend(deps(), RECORD, SENT);
    day.state.titles = ["Easy run"];

    // Act
    const verdict = await checkUnansweredSend(deps(), RECORD, true);

    // Assert
    expect(verdict).toEqual({ blocked: false });
    expect(day.state.reads).toEqual([]);
    expect(await row()).toBeUndefined();
  });

  it("should keep the copy Kaiord recorded when it forgets an unanswered re-send", async () => {
    // Arrange
    repo.store.set(`${RECORD}\u0000${BRIDGE}`, committed);
    await recordUnansweredSend(deps(), RECORD, SENT);

    // Act
    await checkUnansweredSend(deps(), RECORD, true);

    // Assert
    const after = await row();
    expect(after).not.toHaveProperty("unansweredSend");
    expect(after).toMatchObject({
      destinationExternalId: "5000",
      contentHash: "h0",
      destinationDate: "2026-11-20",
    });
  });
});

describe("recordUnansweredSend", () => {
  it("should mark the copy Kaiord recorded without changing it", async () => {
    // Arrange
    repo.store.set(`${RECORD}\u0000${BRIDGE}`, committed);

    // Act
    await recordUnansweredSend(deps(), RECORD, SENT);

    // Assert
    expect(await row()).toMatchObject({
      ...committed,
      updatedAt: expect.any(String),
      unansweredSend: { day: DAY, title: "Easy run", at: AT },
    });
  });

  it("should hold a first send that got no answer as pending", async () => {
    // Arrange
    const none = await row();

    // Act
    await recordUnansweredSend(deps(), RECORD, SENT);

    // Assert
    expect(none).toBeUndefined();
    expect(await row()).toMatchObject({
      destinationExternalId: "pending",
      contentHash: "h1",
      unansweredSend: { day: DAY, title: "Easy run", at: AT },
    });
  });

  it("should not send again when TrainingPeaks commits the timed-out send while the day is read", async () => {
    // Arrange
    // The send gave up at 15 s; TrainingPeaks commits it at 20 s; the
    // athlete sends again at 17 s, when the day still reads empty.
    const clock = { ms: 17_000 };
    const committedAtMs = 20_000;
    const port: TrainingPeaksDayPort = {
      titlesOn: async () => ({
        ok: true,
        titles: clock.ms >= committedAtMs ? ["Easy run"] : [],
      }),
    };
    const slowDeps = {
      ...deps(),
      days: port,
      sleep: async (ms: number) => {
        clock.ms += ms;
      },
    };
    await recordUnansweredSend(slowDeps, RECORD, SENT);

    // Act
    const verdict = await checkUnansweredSend(slowDeps, RECORD, false);

    // Assert
    expect(verdict).toEqual({
      blocked: true,
      reason: "may-be-there",
      date: DAY,
    });
  });
});
