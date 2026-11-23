import { positiveSnapshotFixtures } from "@kaiord/core/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The privacy promises behind the store listing and the policy, asserted at
// the message contract the Kaiord App sees: every external action runs from
// the App origin against a fake Train2Go, and the test watches every request
// the service worker makes, every answer it gives and everything it stores.

require("../background.js");

const SPA_SENDER = { origin: "https://kaiord.com" };
const USER_ID = 28035;
const DATE = "2026-11-23";
const SNAPSHOT = positiveSnapshotFixtures[0];

const POPUP_STATE_KEYS = new Set([
  "profileSnapshot",
  "lastPushReceipt",
  "lastWeeklyRollup",
  "kaiordTheme",
  "bridgeHealth",
  "bridgeTelemetry",
]);

const CHECK_KEYS = [
  "authenticated",
  "capabilities",
  "id",
  "name",
  "protocolVersion",
  "session",
  "sessionActive",
  "version",
];

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

const reply = (contentType, body) => ({
  ok: true,
  status: 200,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  text: () => Promise.resolve(body),
});

const PING = {
  success: true,
  data: {
    user: {
      id: USER_ID,
      name: "Pablo",
      coach: { name: "Coach Dani" },
      user_notes: "<p>Knee: no hills</p>",
    },
  },
};

const fakeTrain2Go = () =>
  fetch.mockImplementation(async (url) => {
    if (url.includes("/profile/ping"))
      return reply("application/json", JSON.stringify(PING));
    if (url.includes("/workplan/weekly/"))
      return reply(
        "application/json",
        JSON.stringify({ data: { replace: { "#workplan": "" } } })
      );
    if (url.includes("/workplan/daily/"))
      return reply(
        "application/json",
        JSON.stringify({ data: { content: "" } })
      );
    return reply("text/html", "<main></main>");
  });

const EXTERNAL_MESSAGES = [
  { action: "ping" },
  {
    action: "request",
    method: "GET",
    path: `/api/v2/workplan/weekly/${DATE}?user=${USER_ID}`,
  },
  {
    action: "request",
    method: "GET",
    path: `/api/v2/workplan/daily/${DATE}?user=${USER_ID}&source=sidebar`,
  },
  { action: "request", method: "GET", path: "/user/details" },
  { action: "open-train2go" },
  { action: "profile-snapshot", snapshot: SNAPSHOT },
  { action: "profile-snapshot-clear" },
  { action: "set-theme", theme: "dark" },
];

const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];
const POPUP_SENDER = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};

const sendFromPopup = (message) =>
  new Promise((resolve) => internalCb(message, POPUP_SENDER, resolve));

const send = (message) =>
  new Promise((resolve) => externalCb(message, SPA_SENDER, resolve));

const runEveryAction = async () => {
  const answers = [];
  for (const message of EXTERNAL_MESSAGES) answers.push(await send(message));
  return answers;
};

describe("request confinement", () => {
  beforeEach(() => {
    __resetChromeMock();
    chrome.tabs.create.mockResolvedValue({ id: 1 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send every request to app.train2go.com with the browser's own cookies and no other credential", async () => {
    // Arrange
    fakeTrain2Go();

    // Act
    await runEveryAction();
    const requests = fetch.mock.calls.map(([url, init]) => ({
      host: new URL(url).host,
      credentials: init.credentials,
      headers: init.headers,
    }));

    // Assert
    expect(requests.length).toBeGreaterThan(0);
    expect(
      requests.filter(
        (r) =>
          r.host !== "app.train2go.com" ||
          r.credentials !== "include" ||
          r.headers !== undefined
      )
    ).toEqual([]);
  });

  it("should send only GET requests, so nothing on Train2Go is changed", async () => {
    // Arrange
    fakeTrain2Go();

    // Act
    await runEveryAction();
    const methods = new Set(fetch.mock.calls.map(([, init]) => init.method));

    // Assert
    expect([...methods]).toEqual(["GET"]);
  });

  it("should store only its popup state in chrome.storage.local, never a credential", async () => {
    // Arrange
    fakeTrain2Go();

    // Act
    await runEveryAction();
    await send({ action: "profile-snapshot", snapshot: SNAPSHOT });
    const keys = Object.keys(__chromeLocalStore);

    // Assert
    expect(keys).toContain("profileSnapshot");
    expect(keys.filter((key) => !POPUP_STATE_KEYS.has(key))).toEqual([]);
    expect(JSON.stringify(__chromeLocalStore)).not.toMatch(/cookie|token/i);
  });

  it("should answer a connection check with one ping of Train2Go and only yes or no", async () => {
    // Arrange
    fakeTrain2Go();

    // Act
    const answer = await send({ action: "ping" });

    // Assert
    expect(fetch.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      "/api/v2/profile/ping",
    ]);
    expect(Object.keys(answer.data).sort()).toEqual(CHECK_KEYS);
    expect(answer.data).toMatchObject({
      session: "signed-in",
      authenticated: true,
      sessionActive: true,
    });
    expect(JSON.stringify(answer)).not.toMatch(/Pablo|Coach Dani|Knee|28035/);
  });

  it("should report signed out only when Train2Go said the session is gone", async () => {
    // Arrange
    fetch.mockResolvedValue(
      reply(
        "application/json",
        JSON.stringify({ success: false, redirect: "/login", data: null })
      )
    );

    // Act
    const answer = await send({ action: "ping" });

    // Assert
    expect(answer.data.session).toBe("signed-out");
    expect(answer.data.sessionActive).toBe(false);
  });

  it("should report that Train2Go is not answering, never signed out, when the check fails", async () => {
    // Arrange
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    // Act
    const answer = await send({ action: "ping" });

    // Assert
    expect(answer.data.session).toBe("not-answering");
    expect(answer.data.sessionActive).toBe(false);
  });

  it("should hand the athlete's profile, with the coach's name and notes, only to its own popup's explicit read", async () => {
    // Arrange
    fakeTrain2Go();

    // Act
    const popup = await sendFromPopup({ action: "read-profile" });
    const app = await send({ action: "read-profile" });

    // Assert
    expect(popup.data).toMatchObject({
      sessionActive: true,
      userId: USER_ID,
      userName: "Pablo",
      coachName: "Coach Dani",
      notes: "Knee: no hills",
    });
    expect(app.ok).toBe(false);
    expect(JSON.stringify(app)).not.toMatch(/Pablo|Coach Dani|Knee/);
  });

  it("should hand the Kaiord App Train2Go's answer as it came, without reading it", async () => {
    // Arrange
    const page = '<main><input name="birthday" value="1990-01-01"></main>';
    fetch.mockResolvedValueOnce(reply("text/html", page));

    // Act
    const answer = await send({
      action: "request",
      method: "GET",
      path: "/user/details",
    });

    // Assert
    expect(answer.data).toEqual({
      status: 200,
      contentType: "text/html",
      body: page,
    });
  });
});

describe("bundled code only", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const root = path.join(__dirname, "..");
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

  const loadedScripts = () => {
    const manifest = JSON.parse(read("manifest.prod.json"));
    return [
      manifest.background.service_worker,
      ...manifest.content_scripts.flatMap((c) => c.js),
      ...[...read("popup.html").matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(
        (m) => m[1]
      ),
      ...[...read("background.js").matchAll(/importScripts\(([^)]*)\)/g)].map(
        (m) => m[1].trim().replace(/^"|"$/g, "")
      ),
    ];
  };

  it("should run only scripts shipped in its own package, and evaluate no code", () => {
    // Arrange
    const scripts = loadedScripts();

    // Act
    const foreign = scripts.filter(
      (s) => !/^[\w-]+\.js$/.test(s) || !fs.existsSync(path.join(root, s))
    );
    const evaluating = scripts.filter((s) =>
      /\beval\s*\(|\bnew Function\s*\(/.test(read(s))
    );

    // Assert
    expect(scripts.length).toBeGreaterThan(5);
    expect(foreign).toEqual([]);
    expect(evaluating).toEqual([]);
  });
});
