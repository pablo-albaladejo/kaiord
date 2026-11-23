import { beforeEach, describe, expect, it } from "vitest";

import { CYCLES_DETAILS_WRAPPED } from "../../whoop/src/test-utils/cycles-fixture.ts";

// ADR 0002: a Session token never travels to Kaiord. WHOOP's answers are
// JSON and carry no Session secret: the bearer travels only as the request
// header the WHOOP tab sends, never in an answer, and the numeric user id
// in paths is an account id, not a credential. The cycles fixture is
// WHOOP's own answer, scrubbed.

const { storeToken } = require("../background.js");

const APP = { origin: "https://kaiord.com" };
const CYCLES =
  "/core-details-bff/v0/cycles/details?id=42&startTime=2026-11-01T00%3A00%3A00.000Z&endTime=2026-11-23T00%3A00%3A00.000Z";
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const makeJwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

const withWhoopTab = async (body) => {
  await storeToken(makeJwt({ "custom:user_id": "42" }));
  chrome.tabs.query.mockImplementation((_q, cb) => cb([{ id: 99 }]));
  chrome.tabs.sendMessage.mockImplementation((_id, _msg, cb) =>
    cb({ ok: true, status: 200, contentType: "application/json", body })
  );
};

const ask = (path) =>
  new Promise((resolve) => {
    externalCb({ action: "request", method: "GET", path }, APP, resolve);
  });

describe("the answer carries no WHOOP Session secret", () => {
  beforeEach(() => __resetChromeMock());

  it("should hand WHOOP's cycles over byte for byte", async () => {
    // Arrange
    const body = JSON.stringify(CYCLES_DETAILS_WRAPPED);
    await withWhoopTab(body);

    // Act
    const res = await ask(CYCLES);

    // Assert
    expect(res.data.body).toBe(body);
  });

  it("should drop a token WHOOP echoes in an answer", async () => {
    // Arrange
    await withWhoopTab(JSON.stringify({ records: [], access_token: "S" }));

    // Act
    const res = await ask(CYCLES);

    // Assert
    expect(JSON.parse(res.data.body)).toEqual({ records: [] });
  });
});
