/**
 * The Train2Go Connector at the message contract with the extension
 * (docs/adr/0004-thin-bridge-smart-connector.md). The current extension
 * (protocol 2) answers `request` with Train2Go's raw answer and the
 * Connector reads it; an extension one protocol version behind (1) refuses
 * `request` and answers the legacy read actions already parsed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createOperationQueue } from "../../bridge/operation-queue";
import { readDay, readWeek } from "./train2go-extension-transport";
import { dailyPath, DETAILS_PATH, weeklyPath } from "./train2go-paths";
import { readZones } from "./train2go-read-zones";

const fixture = (name: string): string =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

type Message = Record<string, unknown>;
type Answer = { contentType: string; body: string; status?: number };

const json = (payload: unknown): Answer => ({
  contentType: "application/json",
  body: JSON.stringify(payload),
});

const html = (body: string): Answer => ({ contentType: "text/html", body });

const install = (answerTo: (message: Message) => unknown): Message[] => {
  const sent: Message[] = [];
  (globalThis as Record<string, unknown>).chrome = {
    runtime: {
      lastError: null,
      sendMessage: (
        _id: string,
        message: Message,
        cb: (r: unknown) => void
      ) => {
        sent.push(message);
        cb(answerTo(message));
      },
    },
  };
  return sent;
};

// The current extension: raw answers by path, nothing parsed.
const currentExtension = (byPath: Record<string, Answer>): Message[] =>
  install((message) => {
    const answer = byPath[String(message.path)];
    if (message.action !== "request" || !answer) {
      return { ok: false, protocolVersion: 2, error: "Request not allowed" };
    }
    return {
      ok: true,
      protocolVersion: 2,
      data: { status: answer.status ?? 200, ...answer },
    };
  });

// An extension one protocol version behind: parses for itself.
const previousExtension = (byAction: Record<string, unknown>): Message[] =>
  install((message) => {
    const data = byAction[String(message.action)];
    return data === undefined
      ? {
          ok: false,
          protocolVersion: 1,
          error: "Origin or action not permitted",
          retryable: false,
        }
      : { ok: true, protocolVersion: 1, data };
  });

const DAY = "2026-04-13";
const USER = "28035";

describe("Train2Go Connector, current extension (protocol 2)", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).chrome;
  });

  it("should read the week your coach planned from Train2Go's raw answer", async () => {
    // Arrange
    const weekly = {
      data: { replace: { "#workplan": fixture("weekly.html") } },
    };
    const sent = currentExtension({ [weeklyPath(DAY, USER)]: json(weekly) });

    // Act
    const res = await readWeek("ext-id", DAY, USER);

    // Assert
    expect(sent).toEqual([
      { action: "request", method: "GET", path: weeklyPath(DAY, USER) },
    ]);
    expect(res.ok).toBe(true);
    expect(res.data?.activities[0]).toEqual({
      id: 17722576,
      date: "2026-04-07",
      sport: "gym",
      title: "CORE FASE 3 P1 GYM",
      duration: "15 min",
      workload: 1,
      status: 1,
    });
  });

  it("should backfill the date param onto every activity read from a day", async () => {
    // Arrange
    const content = fixture("daily.html");
    currentExtension({ [dailyPath(DAY, USER)]: json({ data: { content } }) });

    // Act
    const res = await readDay("ext-id", DAY, USER);

    // Assert
    expect(res.data?.activities).toHaveLength(1);
    expect(res.data?.activities[0]).toMatchObject({
      id: 17722582,
      date: DAY,
      title: "15' Z5 INTERVALOS CORTOS",
    });
    expect(res.data?.activities[0]?.description).toContain(
      "**Calentamiento:**"
    );
  });

  it("should return the day's comment thread alongside its activities", async () => {
    // Arrange
    const content =
      `<div data-id="9003" data-status="0" class="activity activity-default">` +
      `<span class="activity-title"><strong>Race</strong></span>` +
      `<figure class="icon-sportsrunning"></figure>` +
      `<span class="measured">90min</span></div>` +
      `<div class="comments "><div class="comment" id="c1">` +
      `<picture class="image" title="Coach Dani"></picture>` +
      `<div class="content">` +
      `<time datetime="2026-06-08 13:02:21">Mon</time>` +
      `<p>Great race!</p></div></div></div>`;
    currentExtension({ [dailyPath(DAY, USER)]: json({ data: { content } }) });

    // Act
    const res = await readDay("ext-id", DAY, USER);

    // Assert
    expect(res.data?.activities).toHaveLength(1);
    expect(res.data?.comments).toEqual([
      {
        author: "Coach Dani",
        isOwn: false,
        timestamp: "2026-06-08 13:02:21",
        text: "Great race!",
      },
    ]);
  });

  it("should keep only zones and weight from the profile page, dropping everything else it holds", async () => {
    // Arrange
    const page = fixture("details-active.html");
    currentExtension({ [DETAILS_PATH]: html(page) });

    // Act
    const res = await readZones("ext-id", USER, createOperationQueue(0));

    // Assert
    expect(res.ok).toBe(true);
    expect(Object.keys(res.data as object).sort()).toEqual([
      "hrZones",
      "paces",
      "physiological",
    ]);
    expect(
      Object.keys((res.data as { physiological: object }).physiological)
    ).toEqual(expect.arrayContaining(["weight"]));
    expect(JSON.stringify(res.data)).not.toMatch(
      /birthday|gender|email|smoker|imc|user_notes|records|tests/i
    );
  });

  it("should pass a dead Session through as needsReauth, with nothing read", async () => {
    // Arrange
    install(() => ({
      ok: false,
      protocolVersion: 2,
      needsReauth: true,
      error: "Session expired — sign in again and retry",
    }));

    // Act
    const res = await readWeek("ext-id", DAY, USER);

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
    expect(res.data).toBeUndefined();
  });

  it("should report an answer that is not what Train2Go sends as malformed, without throwing", async () => {
    // Arrange
    currentExtension({ [weeklyPath(DAY, USER)]: html("<html>login</html>") });

    // Act
    const res = await readWeek("ext-id", DAY, USER);

    // Assert
    expect(res).toMatchObject({ ok: false, error: "Malformed response body" });
  });
});

describe("Train2Go Connector, extension one protocol version behind (1)", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).chrome;
  });

  it("should keep reading the week, the day and the zones through the legacy actions", async () => {
    // Arrange
    const activity = { id: 1, date: DAY, sport: "cycling", title: "Ride" };
    const zones = { physiological: { weight: 83 } };
    const sent = previousExtension({
      "read-week": { activities: [activity] },
      "read-day": { activities: [activity], comments: [] },
      "read-details": zones,
    });

    // Act
    const week = await readWeek("ext-id", DAY, USER);
    const day = await readDay("ext-id", DAY, USER);
    const details = await readZones("ext-id", USER, createOperationQueue(0));

    // Assert
    expect(week.data?.activities).toEqual([activity]);
    expect(day.data).toEqual({ activities: [activity], comments: [] });
    expect(details.data).toEqual(zones);
    expect(sent.map((m) => m.action)).toEqual([
      "request",
      "read-week",
      "request",
      "read-day",
      "request",
      "read-details",
    ]);
  });

  it("should pass the previous extension's own failure through unchanged", async () => {
    // Arrange
    install((message) =>
      message.action === "request"
        ? {
            ok: false,
            protocolVersion: 1,
            error: "Origin or action not permitted",
          }
        : {
            ok: false,
            protocolVersion: 1,
            needsReauth: true,
            error: "Session expired",
          }
    );

    // Act
    const res = await readWeek("ext-id", DAY, USER);

    // Assert
    expect(res).toMatchObject({ ok: false, needsReauth: true });
  });
});

describe("Train2Go Connector asks only for paths on the extension's closed list", () => {
  const background = readFileSync(
    join(__dirname, "../../../../../train2go-bridge/background.js"),
    "utf-8"
  );
  const closedList = [
    ...background.matchAll(/method: "GET", pattern: (\/.*\/) \},/g),
  ]
    .map((m) => m[1] ?? "")
    .map((src) => new RegExp(src.slice(1, -1)));

  it("should build every path it asks for so that the extension's list admits it", () => {
    // Arrange
    const asked = [weeklyPath(DAY, USER), dailyPath(DAY, USER), DETAILS_PATH];

    // Act
    const refused = asked.filter((p) => !closedList.some((re) => re.test(p)));

    // Assert
    expect(closedList.length).toBeGreaterThan(0);
    expect(refused).toEqual([]);
  });
});
