import { describe, it, expect, beforeEach, afterEach } from "vitest";

// The privacy promise behind the store listing and the policy: the Garmin
// tokens may be kept in the athlete's browser, and they never travel to
// Kaiord. Asserted at the message contract the Kaiord App sees: every answer
// to every external action, and every request the service worker makes.

require("../background.js");

const SPA_SENDER = { origin: "https://kaiord.com" };
const SECRETS = ["OT-SECRET", "OS-SECRET", "AT-SECRET", "RT-SECRET"];
const GARMIN_HOSTS = new Set(["sso.garmin.com", "connectapi.garmin.com"]);

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
});

// Garmin as the service worker meets it: a session that mints the four
// secrets, and an API that answers every allowed path.
const fakeGarmin = (dataStatus = 200) =>
  fetch.mockImplementation(async (url) => {
    if (url.startsWith("https://sso.garmin.com/"))
      return { ok: true, status: 200, text: async () => "ticket=ST-1-abc" };
    if (url.includes("/oauth/preauthorized"))
      return {
        ok: true,
        status: 200,
        text: async () => "oauth_token=OT-SECRET&oauth_token_secret=OS-SECRET",
      };
    if (url.includes("/oauth/exchange/"))
      return response(200, {
        access_token: "AT-SECRET",
        refresh_token: "RT-SECRET",
        expires_in: 3600,
      });
    if (url.includes("/calendar-service/"))
      return response(dataStatus, {
        calendarItems: [
          { itemType: "workout", workoutId: 1, id: 2, date: "2026-11-23" },
        ],
      });
    if (url.includes("/workout-service/schedule/"))
      return response(dataStatus, { workoutScheduleId: 2 });
    return response(dataStatus, [{ workoutId: 1, workoutName: "Easy run" }]);
  });

const EXTERNAL_MESSAGES = [
  { action: "ping" },
  { action: "list" },
  { action: "activities" },
  { action: "push", gcn: { workoutName: "Easy run" } },
  { action: "push-body-composition", fit: "AAAA" },
  { action: "schedule", workoutId: "1", date: "2026-11-23" },
  { action: "calendar-find", workoutId: "1", date: "2026-11-23" },
  { action: "unschedule", scheduleId: "2" },
  { action: "profile-snapshot", snapshot: { profile: { name: "A" } } },
  { action: "profile-snapshot-clear" },
  { action: "set-theme", theme: "dark" },
  { action: "open-garmin" },
];

const send = (message) =>
  new Promise((resolve) => externalCb(message, SPA_SENDER, resolve));

const answersToEveryAction = async () => {
  const answers = [];
  for (const message of EXTERNAL_MESSAGES) answers.push(await send(message));
  return answers;
};

const leaked = (value) =>
  SECRETS.filter((secret) => JSON.stringify(value).includes(secret));

describe("token confinement", () => {
  beforeEach(() => {
    __resetChromeMock();
    chrome.tabs.create.mockResolvedValue({ id: 1 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should keep the minted tokens in chrome.storage.local", async () => {
    // Arrange
    fakeGarmin();

    // Act
    await send({ action: "ping" });
    const stored = await chrome.storage.local.get([
      "garminOAuth1",
      "garminOAuth2",
    ]);

    // Assert
    expect(leaked(stored)).toEqual(SECRETS);
  });

  it("should answer no external action with a token, when Garmin answers", async () => {
    // Arrange
    fakeGarmin(200);

    // Act
    const answers = await answersToEveryAction();

    // Assert
    expect(answers).toHaveLength(EXTERNAL_MESSAGES.length);
    expect(leaked(answers)).toEqual([]);
  });

  it("should answer no external action with a token, when Garmin refuses the token", async () => {
    // Arrange
    fakeGarmin(401);

    // Act
    const answers = await answersToEveryAction();

    // Assert
    expect(answers.some((answer) => answer.ok === false)).toBe(true);
    expect(leaked(answers)).toEqual([]);
  });

  it("should send requests to Garmin hosts only, and nothing anywhere else", async () => {
    // Arrange
    fakeGarmin(200);

    // Act
    await answersToEveryAction();
    const hosts = fetch.mock.calls.map(([url]) => new URL(url).hostname);

    // Assert
    expect(hosts.length).toBeGreaterThan(0);
    expect(hosts.filter((host) => !GARMIN_HOSTS.has(host))).toEqual([]);
  });
});
