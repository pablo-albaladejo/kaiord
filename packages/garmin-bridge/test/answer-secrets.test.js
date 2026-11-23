import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

// ADR 0002: a Session token never travels to Kaiord. Garmin's answers are
// JSON and carry no Session secret (the Bearer travels only in the request
// header, never in an answer); the owner and profile ids they hold are
// account ids, not credentials. The workout fixture is Garmin's own answer
// for a workout (test-fixtures/gcn, *Output.gcn).

require("../background.js");

const GCN = join(import.meta.dirname, "../../../test-fixtures/gcn");
const APP = { origin: "https://kaiord.com" };
const LIST = "/workout-service/workouts?start=0&limit=20";
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const seedTokens = () =>
  chrome.storage.local.set({
    garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
    garminOAuth2: {
      access_token: "bear",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });

const reply = (body) => ({
  ok: true,
  status: 200,
  headers: { get: () => "application/json;charset=UTF-8" },
  text: () => Promise.resolve(body),
});

const ask = (path) =>
  new Promise((resolve) => {
    externalCb({ action: "request", method: "GET", path }, APP, resolve);
  });

describe("the answer carries no Garmin Session secret", () => {
  beforeEach(async () => {
    __resetChromeMock();
    await seedTokens();
  });
  afterEach(() => vi.restoreAllMocks());

  it("should hand Garmin's workout list over byte for byte, ids included", async () => {
    // Arrange
    const workout = readFileSync(
      join(GCN, "WorkoutRunningNestedRepeatsOutput.gcn"),
      "utf8"
    );
    const body = `[${workout}]`;
    fetch.mockResolvedValueOnce(reply(body));

    // Act
    const res = await ask(LIST);

    // Assert
    expect(res.data.body).toBe(body);
    expect(res.data.body).toContain('"ownerId"');
  });

  it("should drop a credential member Garmin echoes in an answer", async () => {
    // Arrange
    const body = JSON.stringify([{ workoutId: 1, accessToken: "bear" }]);
    fetch.mockResolvedValueOnce(reply(body));

    // Act
    const res = await ask(LIST);

    // Assert
    expect(JSON.parse(res.data.body)).toEqual([{ workoutId: 1 }]);
  });
});
