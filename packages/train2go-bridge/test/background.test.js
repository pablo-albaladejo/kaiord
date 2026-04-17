const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  handleAction,
  findTrain2GoTab,
  ping,
  readWeek,
  readDay,
  openTrain2Go,
} = require("../background.js");

describe("background service worker", () => {
  beforeEach(() => __resetChromeMock());

  describe("BRIDGE_MANIFEST", () => {
    it("has correct shape", () => {
      expect(BRIDGE_MANIFEST).toEqual({
        id: "train2go-bridge",
        name: "Kaiord Train2Go Bridge",
        version: "0.1.0",
        protocolVersion: 1,
        capabilities: ["read:training-plan"],
      });
    });

    it("has protocolVersion 1", () => {
      expect(PROTOCOL_VERSION).toBe(1);
    });

    it("version matches package.json (no drift between background.js and the published version)", () => {
      const pkg = require("../package.json");

      expect(BRIDGE_MANIFEST.version).toBe(pkg.version);
    });

    it("validates against bridgeManifestSchema (replica of the SPA contract)", () => {
      // Mirrors the Zod rules at
      // packages/workout-spa-editor/src/types/bridge-schemas.ts:20-26
      // exactly: id/name/version are bare z.string() (no min length),
      // protocolVersion is positive int, capabilities is z.array(...) (no
      // .nonempty()) of values from bridgeCapabilitySchema. If you
      // change the SPA schema, change this replica.
      const ALLOWED_CAPABILITIES = new Set([
        "read:workouts",
        "write:workouts",
        "read:body",
        "read:sleep",
        "read:training-plan",
      ]);
      const validate = (m) => {
        const errors = [];
        if (typeof m?.id !== "string") errors.push("id must be string");
        if (typeof m?.name !== "string") errors.push("name must be string");
        if (typeof m?.version !== "string")
          errors.push("version must be string");
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

      expect(validate(BRIDGE_MANIFEST)).toEqual([]);
    });
  });

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
        capabilities: ["read:training-plan"],
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
        capabilities: ["read:training-plan"],
        sessionActive: false,
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
  });
});
