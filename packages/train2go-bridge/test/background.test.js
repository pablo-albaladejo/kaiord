const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  handleAction,
  findTrain2GoTab,
  ping,
  readWeek,
  readDay,
  openTrain2Go,
  reinjectContentScripts,
} = require("../background.js");
const parser = require("../parser.js");
const pkg = require("../package.json");

// Capture at module load before __resetChromeMock clears mock.calls.
const onInstalledCb = chrome.runtime.onInstalled.addListener.mock.calls[0][0];

describe("background service worker", () => {
  beforeEach(() => __resetChromeMock());
  // Restore any vi.spyOn() patches from individual tests (e.g. the
  // parsePingJson stub used by the precedence test) so a failing
  // assertion never leaks a stub into a sibling test.
  afterEach(() => vi.restoreAllMocks());

  describe("BRIDGE_MANIFEST", () => {
    it("has correct shape", () => {
      expect(BRIDGE_MANIFEST).toEqual({
        id: "train2go-bridge",
        name: "Kaiord Train2Go Bridge",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["read:training-plan", "read:training-zones"],
      });
    });

    it("has protocolVersion 1", () => {
      expect(PROTOCOL_VERSION).toBe(1);
    });

    it("version matches package.json (no drift between background.js and the published version)", () => {
      expect(BRIDGE_MANIFEST.version).toBe(pkg.version);
    });

    it("validates against bridgeManifestSchema (replica of the SPA contract)", () => {
      // Mirrors the Zod rules in `bridgeManifestSchema` from
      // packages/workout-spa-editor/src/types/bridge-schemas.ts.
      // If you change the SPA schema, change this replica.
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

  function makeManifestValidator() {
    const ALLOWED_CAPABILITIES = new Set([
      "read:workouts",
      "write:workouts",
      "read:body",
      "read:sleep",
      "read:training-plan",
      "read:training-zones",
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

  describe("findTrain2GoTab", () => {
    it("returns null when no tab is open", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));
      const tab = await findTrain2GoTab();
      expect(tab).toBeNull();
    });

    it("returns first matching tab", async () => {
      const mockTab = { id: 42, url: "https://app.train2go.com/user/index" };
      chrome.tabs.query.mockImplementation((q, cb) => cb([mockTab]));
      const tab = await findTrain2GoTab();
      expect(tab).toEqual(mockTab);
    });
  });

  describe("handleAction", () => {
    it("handles ping action", async () => {
      const mockTab = { id: 1 };
      chrome.tabs.query.mockImplementation((q, cb) => cb([mockTab]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({
          ok: true,
          status: 200,
          data: {
            success: true,
            data: {
              user: { id: 28035, name: "Pablo" },
            },
          },
        })
      );

      const result = await handleAction({ action: "ping" });

      expect(result).toMatchObject({
        id: "train2go-bridge",
        protocolVersion: 1,
        capabilities: ["read:training-plan", "read:training-zones"],
        userId: 28035,
        userName: "Pablo",
        sessionActive: true,
      });
    });

    it("ping returns manifest even when session expired", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));

      const result = await handleAction({ action: "ping" });

      expect(result).toMatchObject({
        id: "train2go-bridge",
        protocolVersion: 1,
        capabilities: ["read:training-plan", "read:training-zones"],
        sessionActive: false,
      });
    });

    it("manifest fields take precedence if parsePingJson ever returns colliding keys", async () => {
      // Symmetric defense to the garmin-bridge "manifest fields take
      // precedence" test. The threat vectors differ: garmin-bridge's
      // is an upstream HTTP response leak (so its test injects at the
      // response layer, since `checkSession` spreads the raw response
      // object); train2go-bridge's vector would be a `parsePingJson`
      // regression that started passing arbitrary keys through (since
      // the parser is the layer between the response and the spread).
      // We therefore mock the parser here. Reverting the spread order
      // in ping() to `{ ...BRIDGE_MANIFEST, ...session }` makes this
      // test fail on result.id/name/version/protocolVersion/capabilities.
      const ATTACKER_SESSION = {
        id: "ATTACKER",
        name: "Fake Bridge",
        version: "99.9.9",
        protocolVersion: 999,
        capabilities: ["write:workouts"],
        userId: 28035,
        userName: "Pablo",
        sessionActive: true,
      };
      vi.spyOn(parser, "parsePingJson").mockReturnValue(ATTACKER_SESSION);
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: true, status: 200, data: { success: true } })
      );

      const result = await handleAction({ action: "ping" });

      // Manifest keys win on collision (5 fields), session-only fields
      // still flow through (3 fields). The describe-level
      // `afterEach(vi.restoreAllMocks)` cleans up the spy even if this
      // assertion throws.
      expect(result).toMatchObject({
        id: "train2go-bridge",
        name: "Kaiord Train2Go Bridge",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["read:training-plan", "read:training-zones"],
        sessionActive: true,
        userId: 28035,
        userName: "Pablo",
      });
    });

    it("handles read-week action", async () => {
      const mockTab = { id: 1 };
      chrome.tabs.query.mockImplementation((q, cb) => cb([mockTab]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({
          ok: true,
          status: 200,
          data: {
            data: {
              replace: {
                "#workplan":
                  '<div class="workplan-table-block workplan-table-day workplan-table-date-2026-04-13 remote-sidebar"><div class="activity" data-status="0" data-id="123"><figure class="icon icon-sportscycling"></figure><span class="measured">1 h</span><div class="workload workload-default" data-value="2"></div><a href="#" title="Test Ride"></a></div></div>',
              },
            },
          },
        })
      );

      const result = await handleAction({
        action: "read-week",
        date: "2026-04-13",
        userId: 28035,
      });

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0]).toMatchObject({
        id: 123,
        date: "2026-04-13",
        sport: "cycling",
        title: "Test Ride",
      });
    });

    it("read-week requires userId", async () => {
      await expect(
        handleAction({ action: "read-week", date: "2026-04-13" })
      ).rejects.toThrow("Missing userId");
    });

    it("read-day requires userId", async () => {
      await expect(
        handleAction({ action: "read-day", date: "2026-04-13" })
      ).rejects.toThrow("Missing userId");
    });

    it("read-day backfills the date param onto every parsed activity (the daily HTML fragment lacks a date anchor)", async () => {
      // Without backfill, expandDay would upsert records with date:""
      // and the activity would drop out of every per-day calendar
      // bucket — appearing as the card disappearing the moment the
      // user opened its detail dialog. Regression for that bug.
      const html = `<div data-id="9001" data-status="0" class="activity activity-default">
        <span class="activity-title"><strong>Test workout</strong></span>
        <figure class="icon-sportscycling"></figure>
        <span class="measured">60min</span>
        <span class="workload-default" data-value="3"></span>
      </div>`;
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: true, status: 200, data: { data: { content: html } } })
      );

      const result = await handleAction({
        action: "read-day",
        date: "2026-05-07",
        userId: 28035,
      });

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0]).toMatchObject({
        id: 9001,
        date: "2026-05-07",
      });
    });

    it("handles open-train2go action", async () => {
      await handleAction({ action: "open-train2go" });
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://app.train2go.com/user/index",
      });
    });

    it("rejects unknown actions", async () => {
      await expect(handleAction({ action: "unknown" })).rejects.toThrow(
        "Unknown action: unknown"
      );
    });

    it("read-week fails when no tab is open", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));

      await expect(
        handleAction({
          action: "read-week",
          date: "2026-04-13",
          userId: 28035,
        })
      ).rejects.toThrow("No Train2Go tab open");
    });

    it("handles read-details action: parses HTML body into a ZonesPayload", async () => {
      const html = `<main><section><div id="physio-99999" class="details-physio"><form>
        <input name="weight" type="number" value="83">
        <input name="bpm_max" type="number" value="187">
      </form></div></section></main>`;
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: true, status: 200, data: html })
      );

      const result = await handleAction({ action: "read-details" });

      expect(result.physiological).toEqual({ weight: 83, bpmMax: 187 });
    });

    it("read-details fails when no tab is open", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));

      await expect(handleAction({ action: "read-details" })).rejects.toThrow(
        "No Train2Go tab open"
      );
    });

    it("read-details fails when content script returns Session expired", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: false, error: "Session expired" })
      );

      await expect(handleAction({ action: "read-details" })).rejects.toThrow(
        /Read details failed|Session expired/
      );
    });
  });

  describe("reinjectContentScripts", () => {
    it("re-injects content.js into existing app.train2go.com tabs", async () => {
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: ["https://app.train2go.com/*"],
        content_scripts: [
          {
            matches: ["https://app.train2go.com/*"],
            js: ["content.js"],
            run_at: "document_start",
          },
        ],
      });
      chrome.tabs.query.mockImplementation(() =>
        Promise.resolve([
          { id: 11, url: "https://app.train2go.com/user/index" },
          { id: 12, url: "https://app.train2go.com/user/index" },
        ])
      );

      await reinjectContentScripts();

      expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 11, allFrames: false },
        files: ["content.js"],
      });
    });

    it("skips content scripts whose matches are not in host_permissions", async () => {
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: ["https://app.train2go.com/*"],
        content_scripts: [
          {
            matches: ["https://*.kaiord.com/*"],
            js: ["kaiord-announce.js"],
          },
        ],
      });

      await reinjectContentScripts();

      expect(chrome.tabs.query).not.toHaveBeenCalled();
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it("swallows per-tab executeScript errors so one bad tab doesn't break the rest", async () => {
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: ["https://app.train2go.com/*"],
        content_scripts: [
          {
            matches: ["https://app.train2go.com/*"],
            js: ["content.js"],
          },
        ],
      });
      chrome.tabs.query.mockImplementation(() =>
        Promise.resolve([
          { id: 11, url: "https://app.train2go.com/user/index" },
          { id: 12, url: "https://app.train2go.com/user/index" },
        ])
      );
      chrome.scripting.executeScript
        .mockRejectedValueOnce(new Error("Cannot access tab"))
        .mockResolvedValueOnce([]);

      await expect(reinjectContentScripts()).resolves.toBeUndefined();
      expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
    });

    it("the onInstalled listener invokes reinjectContentScripts", async () => {
      // onInstalledCb captured at module load (before __resetChromeMock).
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: [],
        content_scripts: [],
      });

      await expect(Promise.resolve(onInstalledCb())).resolves.toBeUndefined();
    });
  });
});
