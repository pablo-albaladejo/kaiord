import { describe, it, expect, beforeEach, afterEach } from "vitest";

// The privacy promise behind the store listing and the policy: the
// TrainingPeaks access token may be kept in the athlete's browser, and it
// never travels to Kaiord. Asserted at the message contract the Kaiord App
// sees: every answer to every external action, and every request the service
// worker makes.

require("../background.js");

const { ALLOWED } = require("../background.js");

const SPA_SENDER = { origin: "https://kaiord.com" };
const SECRET = "TP-ACCESS-SECRET-7c1d";
const TP_HOSTS = new Set(["tpapi.trainingpeaks.com"]);
const ATHLETE_ID = 900123;

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

// TrainingPeaks as the service worker meets it: a session cookie that mints
// the secret token, and an API that answers every allowed path.
const fakeTrainingPeaks = (dataStatus = 200) =>
  fetch.mockImplementation(async (url) => {
    if (url.endsWith("/users/v3/token"))
      return {
        ok: true,
        status: 200,
        type: "basic",
        redirected: false,
        headers: { get: () => "application/json" },
        text: async () =>
          JSON.stringify({
            token: { access_token: SECRET, expires_in: 3600 },
            athleteId: ATHLETE_ID,
          }),
      };
    const body = url.includes("/workouts")
      ? { workoutId: 4242 }
      : [
          {
            timeStamp: "2026-11-20T07:00:00",
            details: [{ type: 9, value: 70 }],
          },
        ];
    return {
      ok: dataStatus >= 200 && dataStatus < 300,
      status: dataStatus,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  });

const EXTERNAL_MESSAGES = [
  { action: "ping" },
  { action: "checkSession" },
  { action: "read-metrics", start: "2026-10-23", end: "2026-11-22" },
  { action: "push-weight", metric: { details: [{ type: 9, value: 70 }] } },
  {
    action: "push-workout",
    workout: { workoutDay: "2026-11-23", title: "Easy run", structure: "{}" },
  },
  { action: "set-theme", theme: "dark" },
  { action: "open-trainingpeaks" },
];

const send = (message) =>
  new Promise((resolve) => externalCb(message, SPA_SENDER, resolve));

const answersToEveryAction = async () => {
  const answers = [];
  for (const message of EXTERNAL_MESSAGES) answers.push(await send(message));
  return answers;
};

const leaks = (value) => JSON.stringify(value).includes(SECRET);

describe("token confinement", () => {
  beforeEach(() => {
    __resetChromeMock();
    chrome.tabs.create.mockResolvedValue({ id: 1 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should mint a token and keep it in chrome.storage.local when the session is checked", async () => {
    // Arrange
    fakeTrainingPeaks();

    // Act
    const answer = await send({ action: "checkSession" });
    const stored = await chrome.storage.local.get("tpAccessToken");

    // Assert
    expect(answer.data.authenticated).toBe(true);
    expect(stored.tpAccessToken.accessToken).toBe(SECRET);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://tpapi.trainingpeaks.com/users/v3/token",
    ]);
  });

  it("should answer no external action with the token, when TrainingPeaks answers", async () => {
    // Arrange
    fakeTrainingPeaks(200);

    // Act
    const answers = await answersToEveryAction();

    // Assert
    expect(answers).toHaveLength(EXTERNAL_MESSAGES.length);
    expect(answers.every((answer) => answer.ok === true)).toBe(true);
    expect(leaks(answers)).toBe(false);
  });

  it("should answer no external action with the token, when TrainingPeaks refuses the token", async () => {
    // Arrange
    fakeTrainingPeaks(401);

    // Act
    const answers = await answersToEveryAction();

    // Assert
    expect(answers.some((answer) => answer.ok === false)).toBe(true);
    expect(leaks(answers)).toBe(false);
  });

  it("should send requests to tpapi.trainingpeaks.com only, and nothing anywhere else", async () => {
    // Arrange
    fakeTrainingPeaks(200);

    // Act
    await answersToEveryAction();
    const hosts = fetch.mock.calls.map(([url]) => new URL(url).hostname);

    // Assert
    expect(hosts.length).toBeGreaterThan(0);
    expect(hosts.filter((host) => !TP_HOSTS.has(host))).toEqual([]);
  });

  it("should allow no DELETE, PUT or PATCH request to TrainingPeaks", () => {
    // Arrange
    const methods = new Set(ALLOWED.map((rule) => rule.method));

    // Act
    const editing = [...methods].filter((m) => !["GET", "POST"].includes(m));

    // Assert
    expect(editing).toEqual([]);
    expect(methods).toEqual(new Set(["GET", "POST"]));
  });
});
