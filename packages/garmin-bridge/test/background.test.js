import { describe, it, expect, beforeEach, afterEach } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  BRIDGE_FEATURES,
  EXTERNAL_ACTIONS,
  handleAction,
  checkSession,
  logSwallowed,
  TELEMETRY_KEY,
  request,
  REQUEST_DEADLINE_MS,
  REQUEST_SEND_CUTOFF_MS,
  DEADLINE_BEFORE_SEND,
  DEADLINE_EXCEEDED,
} = require("../background.js");
const pkg = require("../package.json");

// External senders are origin-pinned by the vendored guard (spec:
// bridge-core, D4 tightening) — positive paths use an allowed SPA origin.
const SPA_SENDER = { origin: "https://kaiord.com" };

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

// A valid, non-expired token pair so the Bearer path skips minting.
const seedTokens = () =>
  chrome.storage.local.set({
    garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
    garminOAuth2: {
      access_token: "bear",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });

const jsonResp = (obj, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(obj),
  text: () => Promise.resolve(JSON.stringify(obj)),
});
const textResp = (body, ok = true, status = 200) => ({
  ok,
  status,
  text: () => Promise.resolve(body),
});

describe("background.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("PROTOCOL_VERSION", () => {
    it("should be 2", () => {
      expect(PROTOCOL_VERSION).toBe(2);
    });
  });

  describe("BRIDGE_MANIFEST", () => {
    it("has correct shape matching bridgeManifestSchema", () => {
      expect(BRIDGE_MANIFEST).toEqual({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 2,
        capabilities: ["write:workouts", "read:activities", "write:body"],
      });
    });

    it("version matches package.json (no drift between background.js and the published version)", () => {
      expect(BRIDGE_MANIFEST.version).toBe(pkg.version);
    });

    it("validates against bridgeManifestSchema (replica of the SPA contract)", () => {
      const validate = makeManifestValidator();

      expect(validate(BRIDGE_MANIFEST)).toEqual([]);
    });

    it("replica rejects malformed manifests (not a pass-everything stub)", () => {
      const validate = makeManifestValidator();

      expect(validate({ ...BRIDGE_MANIFEST, capabilities: ["bogus"] })).toEqual(
        expect.arrayContaining([expect.stringMatching(/not in allowed enum/)])
      );
      expect(validate({ ...BRIDGE_MANIFEST, protocolVersion: 0 })).toEqual(
        expect.arrayContaining([expect.stringMatching(/protocolVersion/)])
      );
      expect(validate({ ...BRIDGE_MANIFEST, id: 42 })).toEqual(
        expect.arrayContaining([expect.stringMatching(/id must be string/)])
      );
    });
  });

  // Inline replica of `bridgeManifestSchema` from
  // packages/workout-spa-editor/src/types/bridge-schemas.ts.
  function makeManifestValidator() {
    const ALLOWED_CAPABILITIES = new Set([
      "read:workouts",
      "write:workouts",
      "read:body",
      "write:body",
      "read:sleep",
      "read:training-plan",
      "read:training-zones",
      "read:activities",
    ]);
    return (m) => {
      const errors = [];
      if (typeof m?.id !== "string") errors.push("id must be string");
      if (typeof m?.name !== "string") errors.push("name must be string");
      if (typeof m?.version !== "string") errors.push("version must be string");
      if (
        typeof m?.protocolVersion !== "number" ||
        !Number.isInteger(m.protocolVersion) ||
        m.protocolVersion < 1
      )
        errors.push("protocolVersion must be a positive integer");
      if (!Array.isArray(m?.capabilities))
        errors.push("capabilities must be an array");
      for (const c of m?.capabilities ?? []) {
        if (!ALLOWED_CAPABILITIES.has(c))
          errors.push(`capabilities[] contains "${c}" not in allowed enum`);
      }
      return errors;
    };
  }

  describe("onMessageExternal listener", () => {
    it("returns true for async response", () => {
      const sendResponse = vi.fn();

      const result = externalCb({ action: "ping" }, SPA_SENDER, sendResponse);

      expect(result).toBe(true);
    });

    it("sends success result on resolved action", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 1 });
      const sendResponse = vi.fn();

      externalCb({ action: "open-garmin" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 2,
        data: null,
      });
    });

    it("should reject a non-allowlisted action before the handler runs", async () => {
      const sendResponse = vi.fn();

      externalCb({ action: "unknown" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 2,
        error: "Origin or action not permitted",
        retryable: false,
      });
    });

    it.each([
      { label: "a foreign origin", origin: "https://attacker.example" },
      { label: "a kaiord.com subdomain", origin: "https://app.kaiord.com" },
      { label: "the www host", origin: "https://www.kaiord.com" },
      {
        label: "a dev port in a packaged build",
        origin: "http://localhost:5173",
      },
      { label: "an empty sender", origin: undefined },
    ])("should give no answer to $label", async ({ origin }) => {
      // Arrange
      const sendResponse = vi.fn();
      const sender = origin === undefined ? {} : { origin };

      // Act
      const keepsChannelOpen = externalCb(
        { action: "list" },
        sender,
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(keepsChannelOpen).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("checkSession (ping)", () => {
    it("should report signed-in from held, still-valid tokens without a request", async () => {
      // Arrange
      seedTokens();
      const before = fetch.mock.calls.length;

      // Act
      const result = await checkSession();

      // Assert
      expect(result.session).toBe("signed-in");
      expect(result.authenticated).toBe(true);
      expect(result.gcApi).toEqual({ ok: true });
      expect(fetch.mock.calls.length).toBe(before);
      expect(result).toMatchObject({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 2,
        capabilities: ["write:workouts", "read:activities", "write:body"],
      });
    });

    it("should report the calendar feature flags outside the manifest", async () => {
      // Arrange
      seedTokens();

      // Act
      const result = await checkSession();

      // Assert
      expect(result.features).toEqual([
        "calendar-write-v1",
        "calendar-find-v1",
      ]);
      expect(BRIDGE_FEATURES).toEqual([
        "calendar-write-v1",
        "calendar-find-v1",
      ]);
      expect(BRIDGE_MANIFEST).not.toHaveProperty("features");
    });

    it("should report not-checked, minting nothing, when no token is held", async () => {
      // Arrange
      const before = fetch.mock.calls.length;

      // Act
      const result = await checkSession();

      // Assert
      expect(result.session).toBe("not-checked");
      expect(result.authenticated).toBe(false);
      expect(result.gcApi).toEqual({ ok: false });
      expect(fetch.mock.calls.length).toBe(before);
    });

    it("should report not-checked, refreshing nothing, when the OAuth2 token has expired", async () => {
      // Arrange
      await chrome.storage.local.set({
        garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
        garminOAuth2: {
          access_token: "bear",
          expires_at: Math.floor(Date.now() / 1000) - 1,
        },
      });
      const before = fetch.mock.calls.length;

      // Act
      const result = await checkSession();

      // Assert
      expect(result.session).toBe("not-checked");
      expect(fetch.mock.calls.length).toBe(before);
    });

    it("should wrap checkSession in the full SPA envelope via externalCb", async () => {
      // Arrange
      seedTokens();
      const sendResponse = vi.fn();

      // Act
      externalCb({ action: "ping" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(sendResponse.mock.calls[0][0]).toEqual({
        ok: true,
        protocolVersion: 2,
        data: {
          id: "garmin-bridge",
          name: "Garmin Connect",
          version: pkg.version,
          protocolVersion: 2,
          capabilities: ["write:workouts", "read:activities", "write:body"],
          features: ["calendar-write-v1", "calendar-find-v1"],
          session: "signed-in",
          authenticated: true,
          gcApi: { ok: true },
        },
      });
    });
  });

  describe("handleAction", () => {
    it("rejects unknown action", async () => {
      await expect(handleAction({ action: "unknown" })).rejects.toThrow(
        "Unknown action: unknown"
      );
    });

    it("handles open-garmin action", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 42 });

      const result = await handleAction({ action: "open-garmin" });

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://connect.garmin.com/modern/",
      });
      expect(result).toBeNull();
    });
  });

  describe("EXTERNAL_ACTIONS origin pinning", () => {
    // Pins the exact set, the way tanita/train2go/trainingpeaks do. The
    // previous assertion here was `EXTERNAL_ACTIONS.has("push-body-composition")`,
    // which says one action is present, not which actions exist — so a new
    // externally reachable action passed this suite, the privacy-surface
    // golden (blind to EXTERNAL_ACTIONS at the time) and `pnpm test:scripts`.
    // garmin-bridge is the published extension.
    it("should expose exactly the probe, the request, navigation and popup state", () => {
      // Arrange
      const expected = [
        "ping",
        "request",
        "open-garmin",
        "profile-snapshot",
        "profile-snapshot-clear",
        "set-theme",
      ];

      // Act
      const actual = [...EXTERNAL_ACTIONS];

      // Assert
      expect(actual).toEqual(expected);
    });
  });

  describe("logSwallowed", () => {
    it("records a structured entry (level, action, cause, timestamp)", async () => {
      await logSwallowed("error", "load-garmin-oauth", new Error("boom"));

      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toEqual([
        {
          level: "error",
          action: "load-garmin-oauth",
          cause: "boom",
          at: expect.any(Number),
        },
      ]);
    });

    it("caps the log to the most recent 25 entries", async () => {
      for (let i = 0; i < 30; i += 1) {
        await logSwallowed("warn", "x", `err-${i}`);
      }

      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toHaveLength(25);
      expect(log[0].cause).toBe("err-5");
      expect(log[24].cause).toBe("err-29");
    });
  });

  describe("request deadline", () => {
    const SCHEDULE = {
      action: "request",
      method: "POST",
      path: "/workout-service/schedule/1707805999",
      body: { date: "2026-09-29" },
    };
    const LIST = {
      action: "request",
      method: "GET",
      path: "/workout-service/workouts?start=0&limit=20",
    };
    const MONTH = {
      action: "request",
      method: "GET",
      path: "/calendar-service/year/2026/month/9",
    };
    const scheduleWorkout = () => request(SCHEDULE);
    const findCalendarEntries = () => request(MONTH);
    // Every hung request is recorded so teardown can settle it: a mint runs
    // on the untimed fetch and would otherwise stay in flight into the next
    // test, which would join it.
    let hung = [];
    // A fetch that never answers but, like the real one, rejects with the
    // signal's reason when its request is aborted.
    const hungFetch = (_url, init = {}) =>
      new Promise((resolve, reject) => {
        hung.push({ resolve, reject });
        init.signal?.addEventListener("abort", () =>
          reject(init.signal.reason)
        );
      });
    const isSso = (url) => url.startsWith("https://sso.garmin.com/");
    const isSchedule = (url) => url.includes("/workout-service/schedule/");
    const posts = () =>
      fetch.mock.calls.filter(
        ([url, init]) => isSchedule(url) && init?.method === "POST"
      );
    const ssoCalls = () => fetch.mock.calls.filter(([url]) => isSso(url));
    const settle = (promise) =>
      promise.then(
        () => null,
        (e) => e
      );
    const tracked = (promise) => {
      const state = { done: false, value: undefined };
      state.promise = promise.then(
        (value) => Object.assign(state, { done: true, value }),
        (value) => Object.assign(state, { done: true, value })
      );
      return state;
    };
    const ticketResp = () => textResp("<html>...ticket=ST-9-ABCdef...</html>");
    // The rest of a successful mint after the ticket hop.
    const mintTail = (url) =>
      url.includes("/preauthorized")
        ? Promise.resolve(textResp("oauth_token=T&oauth_token_secret=S"))
        : Promise.resolve(jsonResp({ access_token: "new", expires_in: 3600 }));
    const stubSigning = () => {
      vi.spyOn(globalThis.crypto.subtle, "importKey").mockResolvedValue({});
      vi.spyOn(globalThis.crypto.subtle, "sign").mockResolvedValue(
        new Uint8Array(20).buffer
      );
    };

    beforeEach(() => {
      hung = [];
      vi.useFakeTimers({
        toFake: ["setTimeout", "clearTimeout", "Date", "performance"],
      });
    });

    afterEach(async () => {
      hung.forEach(({ reject }) => reject(new TypeError("teardown")));
      await vi.advanceTimersByTimeAsync(0);
      vi.useRealTimers();
      vi.restoreAllMocks();
      fetch.mockReset();
    });

    it("should use a deadline below Chrome's 30 s pending-fetch limit", () => {
      // Arrange
      const chromeFetchLimitMs = 30000;

      // Act
      const margin = chromeFetchLimitMs - REQUEST_DEADLINE_MS;

      // Assert
      expect(REQUEST_DEADLINE_MS).toBe(25000);
      expect(REQUEST_SEND_CUTOFF_MS).toBe(15000);
      expect(margin).toBeGreaterThan(0);
    });

    it("should end by D with no POST when a mint hop hangs", async () => {
      // Arrange
      fetch.mockImplementation(hungFetch);
      const outcome = settle(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(error.retryable).toBe(true);
      expect(error.status).toBeUndefined();
      expect(posts()).toHaveLength(0);
    });

    it("should answer deadline-before-send when the token lifecycle aborts on its own", async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

      // Act
      const error = await settle(scheduleWorkout());

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(error.retryable).toBe(true);
      expect(posts()).toHaveLength(0);
    });

    it("should refuse to start the POST once the send cut-off has passed", async () => {
      // Arrange
      stubSigning();
      chrome.storage.local.set({
        garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
        garminOAuth2: { access_token: "old", expires_at: 0 },
      });
      const lateRefresh = REQUEST_SEND_CUTOFF_MS + 5000;
      fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(jsonResp({ access_token: "new", expires_in: 3600 })),
              lateRefresh
            )
          )
      );
      const outcome = settle(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(lateRefresh);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(0);
    });

    it("should refuse the retry POST after a 401 once the send cut-off has passed", async () => {
      // Arrange
      stubSigning();
      seedTokens();
      const lateTicket = REQUEST_SEND_CUTOFF_MS + 1000;
      fetch.mockImplementation((url) => {
        if (isSchedule(url)) {
          return Promise.resolve(textResp("Unauthorized", false, 401));
        }
        if (isSso(url)) {
          return new Promise((resolve) =>
            setTimeout(() => resolve(ticketResp()), lateTicket)
          );
        }
        return mintTail(url);
      });
      const outcome = settle(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(lateTicket);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(1);
    });

    it("should still end by D when it joins another caller's untimed mint", async () => {
      // Arrange
      fetch.mockImplementation(hungFetch);
      const starter = settle(request(LIST));
      await vi.advanceTimersByTimeAsync(0);
      const outcome = settle(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(fetch).toHaveBeenCalledTimes(1);
      // The starter is bounded too: it ends by its own deadline, and the
      // untimed mint it began settles later for nobody.
      expect((await starter).message).toBe(DEADLINE_BEFORE_SEND);
      hung[0].resolve(textResp("<html>no ticket</html>"));
    });

    it("should end by D when a 401 re-mint joins an untimed mint started by list", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation((url, init) => {
        if (isSso(url)) return hungFetch(url, init);
        return Promise.resolve(textResp("Unauthorized", false, 401));
      });
      const starter = settle(request(LIST));
      await vi.advanceTimersByTimeAsync(0);
      const outcome = tracked(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);

      // Assert
      expect(outcome.done).toBe(true);
      expect(outcome.value.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(1);
      expect(ssoCalls()).toHaveLength(1);
      // The starter is bounded too: it ends by its own deadline, and the
      // untimed mint it began settles later for nobody.
      expect((await starter).message).toBe(DEADLINE_BEFORE_SEND);
      hung[0].resolve(textResp("<html>no ticket</html>"));
    });

    it("should not fail a caller that joined the mint a calendar action started", async () => {
      // Arrange
      stubSigning();
      fetch.mockImplementation((url, init) => {
        if (isSso(url)) return hungFetch(url, init);
        if (url.includes("/workout-service/workouts")) {
          return Promise.resolve(jsonResp([{ workoutId: 7 }]));
        }
        return mintTail(url);
      });
      const outcome = settle(scheduleWorkout());
      const joinAfterMs = 10000;
      await vi.advanceTimersByTimeAsync(joinAfterMs);
      const joiner = settle(request(LIST));
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS - joinAfterMs);

      // Act
      hung[0].resolve(ticketResp());
      await vi.advanceTimersByTimeAsync(0);

      // Assert
      expect((await outcome).message).toBe(DEADLINE_BEFORE_SEND);
      expect(await joiner).toBeNull();
      expect(ssoCalls()).toHaveLength(1);
      expect(ssoCalls()[0][1].signal).toBeUndefined();
      expect(posts()).toHaveLength(0);
    });

    it("should end by D with at most one POST when a 401 is followed by a hung re-mint", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation((url, init) =>
        isSchedule(url)
          ? Promise.resolve(textResp("Unauthorized", false, 401))
          : hungFetch(url, init)
      );
      const outcome = settle(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(1);
    });

    it("should answer an ambiguous deadline when the retry POST after a 401 re-mint hangs", async () => {
      // Arrange
      stubSigning();
      seedTokens();
      let postCount = 0;
      fetch.mockImplementation((url, init) => {
        if (isSchedule(url)) {
          postCount += 1;
          return postCount === 1
            ? Promise.resolve(textResp("Unauthorized", false, 401))
            : hungFetch(url, init);
        }
        return isSso(url) ? Promise.resolve(ticketResp()) : mintTail(url);
      });
      const outcome = settle(scheduleWorkout());

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_EXCEEDED);
      expect(error.status).toBeUndefined();
      expect(posts()).toHaveLength(2);
    });

    it("should answer an ambiguous deadline with no status when the POST hangs after it was sent", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation(hungFetch);
      const sendResponse = vi.fn();
      externalCb(SCHEDULE, SPA_SENDER, sendResponse);

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);

      // Assert
      expect(posts()).toHaveLength(1);
      expect(posts()[0][1].signal.aborted).toBe(true);
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 2,
        error: DEADLINE_EXCEEDED,
        retryable: true,
      });
    });

    it("should end a hung calendar read by D with no status", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation(hungFetch);
      const outcome = settle(findCalendarEntries());

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_EXCEEDED);
      expect(error.status).toBeUndefined();
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    });

    it("should not apply the send cut-off to the calendar read", async () => {
      // Arrange
      chrome.storage.local.set({
        garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
        garminOAuth2: { access_token: "old", expires_at: 0 },
      });
      stubSigning();
      const lateRefresh = REQUEST_SEND_CUTOFF_MS + 5000;
      fetch.mockImplementation((url) =>
        url.includes("/calendar-service/")
          ? Promise.resolve(jsonResp({ calendarItems: [] }))
          : new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve(jsonResp({ access_token: "new", expires_in: 3600 })),
                lateRefresh
              )
            )
      );
      const outcome = findCalendarEntries();

      // Act
      await vi.advanceTimersByTimeAsync(lateRefresh);

      // Assert
      expect((await outcome).body).toBe('{"calendarItems":[]}');
    });

    it("should not answer before D while the POST is still in flight", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation(hungFetch);
      const sendResponse = vi.fn();
      externalCb(SCHEDULE, SPA_SENDER, sendResponse);

      // Act
      await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS - 1);

      // Assert
      expect(sendResponse).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(sendResponse).toHaveBeenCalled();
    });
  });
});

describe("set-theme (the app's theme preference for the popup)", () => {
  const sendExternal = (message, origin) =>
    new Promise((resolve) => externalCb(message, { origin }, resolve));

  beforeEach(() => __resetChromeMock());

  it("should store a valid preference sent from a Kaiord origin", async () => {
    // Arrange
    const message = { action: "set-theme", theme: "light" };

    // Act
    const response = await sendExternal(message, "https://kaiord.com");

    // Assert
    expect(response).toMatchObject({ ok: true, data: null });
    expect(__chromeLocalStore.kaiordTheme).toBe("light");
  });

  it("should store nothing and give no answer to a preference sent from a kaiord.com subdomain", async () => {
    // Arrange
    const message = { action: "set-theme", theme: "dark" };
    const sendResponse = vi.fn();

    // Act
    const keepsChannelOpen = externalCb(
      message,
      { origin: "https://app.kaiord.com" },
      sendResponse
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(keepsChannelOpen).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
    expect(__chromeLocalStore.kaiordTheme).toBeUndefined();
  });

  it("should refuse a value outside light, dark and system", async () => {
    // Arrange
    const message = { action: "set-theme", theme: "sepia" };

    // Act
    const response = await sendExternal(message, "https://kaiord.com");

    // Assert
    expect(response).toMatchObject({
      ok: false,
      error: "Invalid theme preference",
      retryable: false,
    });
    expect(__chromeLocalStore.kaiordTheme).toBeUndefined();
  });
});

describe("host permissions", () => {
  it.each(["manifest.json", "manifest.prod.json"])(
    "should ask %s only for the two hosts the service worker sends requests to",
    (file) => {
      // Arrange
      const path = require("node:path").join(__dirname, "..", file);

      // Act
      const manifest = JSON.parse(
        require("node:fs").readFileSync(path, "utf8")
      );

      // Assert
      expect(manifest.host_permissions).toEqual([
        "https://connectapi.garmin.com/*",
        "https://sso.garmin.com/*",
      ]);
    }
  );
});
