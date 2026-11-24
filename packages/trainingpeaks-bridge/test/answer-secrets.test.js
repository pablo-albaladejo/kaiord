import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TRAININGPEAKS_METRICS_FIXTURE } from "../../trainingpeaks/src/test-utils/trainingpeaks-fixture.ts";

// ADR 0002: a Session token never travels to Kaiord. TrainingPeaks' data
// answers are JSON and carry no Session secret; the Bearer is minted from
// the token endpoint, which is not on the closed list, so its answer never
// reaches the App. The athlete id they hold is an account id, not a
// credential. The metrics fixture mirrors TrainingPeaks' own answer.

require("../background.js");

const APP = { origin: "https://kaiord.com" };
const METRICS =
  "/metrics/v3/athletes/900123/consolidatedtimedmetrics/2026-07-01/2026-07-31";
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const seedToken = () =>
  chrome.storage.local.set({
    tpAccessToken: {
      accessToken: "TP-BEARER",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      athleteId: 900123,
    },
  });

const reply = (body) => ({
  ok: true,
  status: 200,
  type: "basic",
  redirected: false,
  headers: { get: () => "application/json; charset=utf-8" },
  text: () => Promise.resolve(body),
});

const ask = (path) =>
  new Promise((resolve) => {
    externalCb({ action: "request", method: "GET", path }, APP, resolve);
  });

describe("the answer carries no TrainingPeaks Session secret", () => {
  beforeEach(async () => {
    __resetChromeMock();
    await seedToken();
  });
  afterEach(() => vi.restoreAllMocks());

  it("should hand TrainingPeaks' metrics over byte for byte", async () => {
    // Arrange
    const body = JSON.stringify(TRAININGPEAKS_METRICS_FIXTURE, null, 2);
    fetch.mockResolvedValueOnce(reply(body));

    // Act
    const res = await ask(METRICS);

    // Assert
    expect(res.data.body).toBe(body);
  });

  it("should drop a token TrainingPeaks echoes in an answer", async () => {
    // Arrange
    const body = JSON.stringify({ token: { access_token: "S" }, ok: 1 });
    fetch.mockResolvedValueOnce(reply(body));

    // Act
    const res = await ask(METRICS);

    // Assert
    expect(JSON.parse(res.data.body)).toEqual({ ok: 1 });
  });
});

describe("the answer carries no personal field the Connector does not read", () => {
  beforeEach(async () => {
    __resetChromeMock();
    await seedToken();
  });
  afterEach(() => vi.restoreAllMocks());

  it("should remove a workout's comments and keep the id and day the Connector reads", async () => {
    // Arrange
    const workout = {
      workoutId: 4242,
      athleteId: 900123,
      workoutDay: "2026-11-24T00:00:00",
      title: "Tempo",
      coachComments: "Felt heavy?",
      workoutComments: [{ comment: "ok", commenterName: "Coach" }],
      newComment: "draft",
    };
    fetch.mockResolvedValueOnce(reply(JSON.stringify(workout)));

    // Act
    const res = await ask("/fitness/v6/athletes/900123/workouts/4242");

    // Assert
    expect(JSON.parse(res.data.body)).toEqual({
      workoutId: 4242,
      athleteId: 900123,
      workoutDay: "2026-11-24T00:00:00",
      title: "Tempo",
    });
  });
});
